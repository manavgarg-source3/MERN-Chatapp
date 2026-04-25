import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const getChatTitle = (chat) => chat?.fullName || chat?.name || "Conversation";

const withUnreadCount = (conversation) => ({
  ...conversation,
  unreadCount: Number(conversation?.unreadCount || 0),
});

const upsertGroup = (groups, group) => {
  const normalizedGroup = withUnreadCount(group);
  const nextGroups = groups.some((item) => item._id === normalizedGroup._id)
    ? groups.map((item) => (item._id === normalizedGroup._id ? normalizedGroup : item))
    : [...groups, normalizedGroup];

  return nextGroups.sort((firstGroup, secondGroup) =>
    getChatTitle(firstGroup).localeCompare(getChatTitle(secondGroup))
  );
};

const removeGroupTypingUser = (typingState, groupId, userId) => ({
  ...typingState,
  [groupId]: (typingState[groupId] || []).filter((user) => user._id !== userId),
});

const updateConversationUnreadCount = (conversations, chatId, unreadCount) =>
  conversations.map((conversation) =>
    String(conversation._id) === String(chatId)
      ? { ...conversation, unreadCount: Math.max(0, Number(unreadCount || 0)) }
      : conversation
  );

export const useChatStore = create((set, get) => ({
  messages: [],
  directUsers: [],
  groups: [],
  selectedChat: null,
  typingUsers: {},
  groupTypingUsers: {},
  activeConversationUserId: null,
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,
  isCreatingGroup: false,
  isUpdatingGroup: false,
  isManagingGroupMembers: false,
  activeDeletingMessageId: null,

  applyConversationUnreadCountUpdate: ({ chatType, chatId, unreadCount }) => {
    if (!chatId) return;

    set({
      directUsers:
        chatType === "direct"
          ? updateConversationUnreadCount(get().directUsers, chatId, unreadCount)
          : get().directUsers,
      groups:
        chatType === "group"
          ? updateConversationUnreadCount(get().groups, chatId, unreadCount)
          : get().groups,
    });
  },

  getUsers: async () => {
    set({ isUsersLoading: get().directUsers.length === 0 });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ directUsers: (res.data || []).map(withUnreadCount) });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load friends");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: get().groups.length === 0 });
    try {
      const res = await axiosInstance.get("/messages/groups");
      const groups = (res.data || []).map(withUnreadCount);
      const currentSelectedChat = get().selectedChat;
      const refreshedSelectedGroup =
        currentSelectedChat?.type === "group"
          ? groups.find((group) => group._id === currentSelectedChat._id) || null
          : currentSelectedChat;

      set({
        groups,
        selectedChat:
          currentSelectedChat?.type === "group" ? refreshedSelectedGroup : currentSelectedChat,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  getConversations: async () => {
    await Promise.all([get().getUsers(), get().getGroups()]);
  },

  createGroup: async ({ name, members, groupImage }) => {
    set({ isCreatingGroup: true });
    try {
      const res = await axiosInstance.post("/messages/groups", { name, members, groupImage });
      set({
        groups: upsertGroup(get().groups, res.data),
      });
      toast.success("Group created");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create group");
      throw error;
    } finally {
      set({ isCreatingGroup: false });
    }
  },

  getGroupDetails: async (groupId) => {
    const res = await axiosInstance.get(`/messages/groups/${groupId}`);
    const group = res.data;
    set({
      groups: upsertGroup(get().groups, group),
      selectedChat:
        get().selectedChat?._id === groupId && get().selectedChat?.type === "group"
          ? group
          : get().selectedChat,
    });
    return group;
  },

  updateGroup: async (groupId, payload) => {
    set({ isUpdatingGroup: true });
    try {
      const res = await axiosInstance.patch(`/messages/groups/${groupId}`, payload);
      set({
        groups: upsertGroup(get().groups, res.data),
        selectedChat:
          get().selectedChat?._id === groupId && get().selectedChat?.type === "group"
            ? res.data
            : get().selectedChat,
      });
      toast.success("Group updated");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update group");
      throw error;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  addGroupMembers: async (groupId, members) => {
    set({ isManagingGroupMembers: true });
    try {
      const res = await axiosInstance.post(`/messages/groups/${groupId}/members`, { members });
      set({
        groups: upsertGroup(get().groups, res.data),
        selectedChat:
          get().selectedChat?._id === groupId && get().selectedChat?.type === "group"
            ? res.data
            : get().selectedChat,
      });
      toast.success("Members added");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add members");
      throw error;
    } finally {
      set({ isManagingGroupMembers: false });
    }
  },

  removeGroupMember: async (groupId, memberId) => {
    set({ isManagingGroupMembers: true });
    try {
      const res = await axiosInstance.delete(`/messages/groups/${groupId}/members/${memberId}`);
      set({
        groups: upsertGroup(get().groups, res.data),
        selectedChat:
          get().selectedChat?._id === groupId && get().selectedChat?.type === "group"
            ? res.data
            : get().selectedChat,
      });
      toast.success("Member removed");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not remove member");
      throw error;
    } finally {
      set({ isManagingGroupMembers: false });
    }
  },

  getMessages: async (chat) => {
    if (!chat?._id) return;

    set({ isMessagesLoading: true, messages: [] });
    try {
      const endpoint =
        chat.type === "group" ? `/messages/group/${chat._id}` : `/messages/direct/${chat._id}`;
      const res = await axiosInstance.get(endpoint);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  markMessagesAsRead: async (userId) => {
    try {
      const res = await axiosInstance.patch(`/messages/read/${userId}`);
      const readMessageIds = new Set((res.data.messageIds || []).map(String));

      if (readMessageIds.size > 0 && res.data.readAt) {
        set({
          messages: get().messages.map((message) =>
            readMessageIds.has(String(message._id))
              ? { ...message, readAt: res.data.readAt }
              : message
          ),
          directUsers: updateConversationUnreadCount(get().directUsers, userId, 0),
        });
      }
    } catch (error) {
      console.log("Error marking direct messages as read:", error);
    }
  },

  markGroupMessagesAsRead: async (groupId) => {
    try {
      const res = await axiosInstance.patch(`/messages/group/read/${groupId}`);
      const readMessageIds = new Set((res.data.messageIds || []).map(String));
      const authUser = useAuthStore.getState().authUser;

      if (readMessageIds.size > 0 && res.data.readAt && authUser) {
        set({
          messages: get().messages.map((message) =>
            readMessageIds.has(String(message._id))
              ? {
                  ...message,
                  readBy: [
                    ...(message.readBy || []).filter(
                      (entry) => String(entry.userId?._id || entry.userId) !== String(authUser._id)
                    ),
                    {
                      userId: {
                        _id: authUser._id,
                        fullName: authUser.fullName,
                        email: authUser.email,
                        profilePic: authUser.profilePic,
                      },
                      readAt: res.data.readAt,
                    },
                  ],
                }
              : message
          ),
          groups: updateConversationUnreadCount(get().groups, groupId, 0),
        });
      }
    } catch (error) {
      console.log("Error marking group messages as read:", error);
    }
  },

  sendMessage: async (messageData) => {
    const { selectedChat } = get();
    const authUser = useAuthStore.getState().authUser;
    const tempId = `temp-${Date.now()}`;
    const optimisticAttachment = messageData.attachment
      ? {
          url: messageData.attachment.previewUrl || messageData.attachment.data,
          fileName: messageData.attachment.fileName,
          mimeType: messageData.attachment.mimeType,
          kind: messageData.attachment.kind,
        }
      : null;

    const optimisticMessage = {
      _id: tempId,
      senderId: selectedChat?.type === "group" ? authUser : authUser?._id,
      receiverId: selectedChat?.type === "direct" ? selectedChat?._id : null,
      groupId: selectedChat?.type === "group" ? selectedChat?._id : null,
      text: messageData.text,
      image: optimisticAttachment?.kind === "image" ? optimisticAttachment.url : null,
      attachment: optimisticAttachment,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
      readBy:
        selectedChat?.type === "group"
          ? [
              {
                userId: {
                  _id: authUser._id,
                  fullName: authUser.fullName,
                  email: authUser.email,
                  profilePic: authUser.profilePic,
                },
                readAt: new Date().toISOString(),
              },
            ]
          : [],
      status: "sending",
    };

    try {
      get().sendTypingStatus(false);
      set({ messages: [...get().messages, optimisticMessage] });

      const requestBody = {
        text: messageData.text,
        attachment: messageData.attachment
          ? {
              data: messageData.attachment.data,
              fileName: messageData.attachment.fileName,
              mimeType: messageData.attachment.mimeType,
              kind: messageData.attachment.kind,
            }
          : null,
      };

      const endpoint =
        selectedChat.type === "group"
          ? `/messages/send/group/${selectedChat._id}`
          : `/messages/send/direct/${selectedChat._id}`;
      const res = await axiosInstance.post(endpoint, requestBody);

      set({
        messages: get().messages.map((message) =>
          message._id === tempId ? { ...res.data, status: "sent" } : message
        ),
      });
      return res.data;
    } catch (error) {
      set({
        messages: get().messages.filter((message) => message._id !== tempId),
      });
      toast.error(error.response?.data?.message || "Could not send message");
      throw error;
    }
  },

  deleteDirectMessageForMe: async (messageId) => {
    set({ activeDeletingMessageId: messageId });
    try {
      await axiosInstance.patch(`/messages/direct/delete/me/${messageId}`);
      set({
        messages: get().messages.filter((message) => String(message._id) !== String(messageId)),
      });
      toast.success("Message deleted from your chat");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete message");
      throw error;
    } finally {
      set({ activeDeletingMessageId: null });
    }
  },

  deleteDirectMessageForEveryone: async (messageId) => {
    set({ activeDeletingMessageId: messageId });
    try {
      const res = await axiosInstance.patch(`/messages/direct/delete/everyone/${messageId}`);
      set({
        messages: get().messages.map((message) =>
          String(message._id) === String(messageId)
            ? {
                ...message,
                ...res.data,
                text: "This message was deleted",
                image: null,
                attachment: null,
              }
            : message
        ),
      });
      toast.success("Message deleted for both sides");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete message for everyone");
      throw error;
    } finally {
      set({ activeDeletingMessageId: null });
    }
  },

  deleteGroupMessageForEveryone: async (messageId) => {
    set({ activeDeletingMessageId: messageId });
    try {
      const res = await axiosInstance.patch(`/messages/group/delete/everyone/${messageId}`);
      set({
        messages: get().messages.map((message) =>
          String(message._id) === String(messageId) ? { ...message, ...res.data } : message
        ),
      });
      toast.success("Message deleted for everyone");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete group message");
      throw error;
    } finally {
      set({ activeDeletingMessageId: null });
    }
  },

  adminDeleteGroupMessage: async (messageId) => {
    set({ activeDeletingMessageId: messageId });
    try {
      const res = await axiosInstance.patch(`/messages/group/delete/admin/${messageId}`);
      set({
        messages: get().messages.map((message) =>
          String(message._id) === String(messageId) ? { ...message, ...res.data } : message
        ),
      });
      toast.success("Message deleted by admin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete this message");
      throw error;
    } finally {
      set({ activeDeletingMessageId: null });
    }
  },

  sendTypingStatus: (isTyping) => {
    const { selectedChat } = get();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (!socket || !selectedChat?._id) return;

    if (selectedChat.type === "direct") {
      socket.emit(isTyping ? "typing:start" : "typing:stop", {
        receiverId: selectedChat._id,
      });
      return;
    }

    if (selectedChat.type === "group" && authUser) {
      socket.emit(isTyping ? "groupTyping:start" : "groupTyping:stop", {
        groupId: selectedChat._id,
        user: {
          _id: authUser._id,
          fullName: authUser.fullName,
          email: authUser.email,
          profilePic: authUser.profilePic,
        },
      });
    }
  },

  subscribeToMessages: () => {
    const { selectedChat } = get();
    if (!selectedChat) return;

    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("messagesDelivered");
    socket.off("messagesRead");
    socket.off("messageDeletedForEveryone");
    socket.off("groupMessageDeleted");
    socket.off("userTyping");
    socket.off("groupTyping");
    socket.off("groupMessagesRead");
    socket.off("groupsUpdated");
    socket.on("newMessage", (newMessage) => {
      if (selectedChat.type !== "direct") return;

      const isMessageSentFromSelectedUser = newMessage.senderId === selectedChat._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });

      if (document.visibilityState === "visible") {
        get().markMessagesAsRead(selectedChat._id);
      }
    });

    socket.on("newGroupMessage", (newMessage) => {
      if (selectedChat.type !== "group") return;
      if (newMessage.groupId !== selectedChat._id) return;

      set({
        messages: [...get().messages, newMessage],
        groupTypingUsers: removeGroupTypingUser(
          get().groupTypingUsers,
          selectedChat._id,
          String(newMessage.senderId?._id || newMessage.senderId)
        ),
      });

      if (
        document.visibilityState === "visible" &&
        String(newMessage.senderId?._id || newMessage.senderId) !== String(authUser?._id)
      ) {
        get().markGroupMessagesAsRead(selectedChat._id);
      }
    });

    socket.on("messagesDelivered", ({ messageIds, deliveredAt }) => {
      const deliveredMessageIds = new Set((messageIds || []).map(String));

      set({
        messages: get().messages.map((message) =>
          deliveredMessageIds.has(String(message._id))
            ? { ...message, deliveredAt, status: "delivered" }
            : message
        ),
      });
    });

    socket.on("messagesRead", ({ messageIds, readAt }) => {
      const readMessageIds = new Set((messageIds || []).map(String));

      set({
        messages: get().messages.map((message) =>
          readMessageIds.has(String(message._id))
            ? { ...message, readAt, status: "read" }
            : message
        ),
      });
    });

    socket.on("messageDeletedForEveryone", ({ messageId }) => {
      set({
        messages: get().messages.map((message) =>
          String(message._id) === String(messageId)
            ? {
                ...message,
                deletedForEveryone: true,
                text: "This message was deleted",
                image: null,
                attachment: null,
              }
            : message
        ),
      });
    });

    socket.on("groupMessageDeleted", (updatedMessage) => {
      set({
        messages:
          selectedChat.type === "group" && selectedChat._id === updatedMessage.groupId
            ? get().messages.map((message) =>
                String(message._id) === String(updatedMessage._id)
                  ? { ...message, ...updatedMessage }
                  : message
              )
            : get().messages,
      });
    });

    socket.on("userTyping", ({ userId, isTyping }) => {
      set({
        typingUsers: {
          ...get().typingUsers,
          [userId]: isTyping,
        },
      });
    });

    socket.on("groupTyping", ({ groupId, user, isTyping }) => {
      if (!user?._id) return;

      if (isTyping) {
        set({
          groupTypingUsers: {
            ...get().groupTypingUsers,
            [groupId]: [
              ...(get().groupTypingUsers[groupId] || []).filter(
                (typingUser) => typingUser._id !== user._id
              ),
              user,
            ],
          },
        });
      } else {
        set({
          groupTypingUsers: removeGroupTypingUser(get().groupTypingUsers, groupId, user._id),
        });
      }
    });

    socket.on("groupMessagesRead", ({ groupId, messageIds, user, readAt }) => {
      const readMessageIds = new Set((messageIds || []).map(String));
      if (!user?._id) return;

      set({
        messages:
          selectedChat.type === "group" && selectedChat._id === groupId
            ? get().messages.map((message) =>
                readMessageIds.has(String(message._id))
                  ? {
                      ...message,
                      readBy: [
                        ...(message.readBy || []).filter(
                          (entry) =>
                            String(entry.userId?._id || entry.userId) !== String(user._id)
                        ),
                        {
                          userId: user,
                          readAt,
                        },
                      ],
                    }
                  : message
              )
            : get().messages,
      });
    });

    socket.on("groupsUpdated", () => {
      get().getGroups();
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("messagesDelivered");
    socket.off("messagesRead");
    socket.off("messageDeletedForEveryone");
    socket.off("groupMessageDeleted");
    socket.off("userTyping");
    socket.off("groupTyping");
    socket.off("groupMessagesRead");
    socket.off("groupsUpdated");
  },

  setActiveConversation: (otherUserId) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      if (otherUserId) {
        socket.emit("conversation:open", { otherUserId });
      } else {
        socket.emit("conversation:close");
      }
    }

    set({ activeConversationUserId: otherUserId || null });
  },

  setSelectedChat: (selectedChat) => {
    get().sendTypingStatus(false);
    set((state) => ({
      selectedChat,
      directUsers:
        selectedChat?.type === "direct"
          ? updateConversationUnreadCount(state.directUsers, selectedChat._id, 0)
          : state.directUsers,
      groups:
        selectedChat?.type === "group"
          ? updateConversationUnreadCount(state.groups, selectedChat._id, 0)
          : state.groups,
      typingUsers: selectedChat ? state.typingUsers : {},
      groupTypingUsers:
        selectedChat?.type === "group"
          ? {
              ...state.groupTypingUsers,
              [selectedChat._id]: state.groupTypingUsers[selectedChat._id] || [],
            }
          : state.groupTypingUsers,
    }));
  },
}));
