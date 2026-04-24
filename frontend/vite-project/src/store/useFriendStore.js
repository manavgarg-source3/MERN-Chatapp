import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "./useChatStore";

export const useFriendStore = create((set, get) => ({
  availableUsers: [],
  incomingRequests: [],
  outgoingRequests: [],
  isLoading: false,
  activeRequestId: null,

  getFriendOverview: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/friends");
      set({
        availableUsers: res.data.availableUsers || [],
        incomingRequests: res.data.incomingRequests || [],
        outgoingRequests: res.data.outgoingRequests || [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load friend requests");
    } finally {
      set({ isLoading: false });
    }
  },

  sendFriendRequest: async (userId) => {
    set({ activeRequestId: userId });
    try {
      await axiosInstance.post(`/friends/request/${userId}`);
      toast.success("Friend request sent");
      await Promise.all([get().getFriendOverview(), useChatStore.getState().getUsers()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send request");
    } finally {
      set({ activeRequestId: null });
    }
  },

  acceptFriendRequest: async (userId) => {
    set({ activeRequestId: userId });
    try {
      await axiosInstance.post(`/friends/accept/${userId}`);
      toast.success("Friend request accepted");
      await Promise.all([get().getFriendOverview(), useChatStore.getState().getUsers()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not accept request");
    } finally {
      set({ activeRequestId: null });
    }
  },

  rejectFriendRequest: async (userId) => {
    set({ activeRequestId: userId });
    try {
      await axiosInstance.post(`/friends/reject/${userId}`);
      toast.success("Friend request rejected");
      await get().getFriendOverview();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not reject request");
    } finally {
      set({ activeRequestId: null });
    }
  },
}));
