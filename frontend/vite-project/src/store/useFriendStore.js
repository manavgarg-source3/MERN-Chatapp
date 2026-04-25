import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "./useChatStore";

export const useFriendStore = create((set, get) => ({
  availableUsers: [],
  incomingRequests: [],
  outgoingRequests: [],
  isLoading: false,
  isPeopleLoading: false,
  hasMoreAvailableUsers: true,
  availableUsersPage: 1,
  availableUsersSearch: "",
  activeRequestId: null,

  getFriendOverview: async ({ page = 1, search = "", append = false, mode = "refresh" } = {}) => {
    const normalizedSearch = search.trim();
    set({
      isLoading: mode === "initial",
      isPeopleLoading: append || mode === "search",
    });
    try {
      const res = await axiosInstance.get("/friends", {
        params: {
          page,
          limit: 12,
          search: normalizedSearch,
        },
      });

      const nextAvailableUsers = res.data.availableUsers || [];
      set({
        availableUsers: append
          ? [...get().availableUsers, ...nextAvailableUsers.filter(
              (user) => !get().availableUsers.some((existingUser) => existingUser._id === user._id)
            )]
          : nextAvailableUsers,
        incomingRequests: res.data.incomingRequests || [],
        outgoingRequests: res.data.outgoingRequests || [],
        availableUsersPage: page,
        hasMoreAvailableUsers: Boolean(res.data.pagination?.hasMore),
        availableUsersSearch: normalizedSearch,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load friend requests");
    } finally {
      set({ isLoading: false, isPeopleLoading: false });
    }
  },

  searchAvailableUsers: async (search) => {
    await get().getFriendOverview({ page: 1, search, append: false, mode: "search" });
  },

  loadMoreAvailableUsers: async () => {
    const {
      hasMoreAvailableUsers,
      isPeopleLoading,
      availableUsersPage,
      availableUsersSearch,
    } = get();

    if (!hasMoreAvailableUsers || isPeopleLoading) return;

    await get().getFriendOverview({
      page: availableUsersPage + 1,
      search: availableUsersSearch,
      append: true,
      mode: "append",
    });
  },

  sendFriendRequest: async (userId) => {
    set({ activeRequestId: userId });
    try {
      const requestedUser = get().availableUsers.find((user) => user._id === userId);
      await axiosInstance.post(`/friends/request/${userId}`);
      if (requestedUser) {
        set({
          availableUsers: get().availableUsers.filter((user) => user._id !== userId),
          outgoingRequests: [requestedUser, ...get().outgoingRequests],
        });
      }
      toast.success("Friend request sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send request");
    } finally {
      set({ activeRequestId: null });
    }
  },

  acceptFriendRequest: async (userId) => {
    set({ activeRequestId: userId });
    try {
      set({
        incomingRequests: get().incomingRequests.filter((user) => user._id !== userId),
      });
      await axiosInstance.post(`/friends/accept/${userId}`);
      toast.success("Friend request accepted");
      await useChatStore.getState().getUsers();
    } catch (error) {
      await get().getFriendOverview({
        page: 1,
        search: get().availableUsersSearch,
        append: false,
        mode: "refresh",
      });
      toast.error(error.response?.data?.message || "Could not accept request");
    } finally {
      set({ activeRequestId: null });
    }
  },

  rejectFriendRequest: async (userId) => {
    set({ activeRequestId: userId });
    try {
      set({
        incomingRequests: get().incomingRequests.filter((user) => user._id !== userId),
      });
      await axiosInstance.post(`/friends/reject/${userId}`);
      toast.success("Friend request rejected");
    } catch (error) {
      await get().getFriendOverview({
        page: 1,
        search: get().availableUsersSearch,
        append: false,
        mode: "refresh",
      });
      toast.error(error.response?.data?.message || "Could not reject request");
    } finally {
      set({ activeRequestId: null });
    }
  },
}));
