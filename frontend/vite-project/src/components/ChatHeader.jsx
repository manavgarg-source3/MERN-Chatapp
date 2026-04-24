import { useMemo, useState } from "react";
import { ChevronRight, Users, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { GroupDetailsModal } from "./GroupDetailsModal";

const getInitials = (value = "") =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const ChatHeader = () => {
  const { selectedChat, setSelectedChat, typingUsers, groupTypingUsers } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);

  const isDirectChat = selectedChat?.type === "direct";
  const isTyping = isDirectChat ? typingUsers[selectedChat._id] : false;
  const activeGroupTypers = useMemo(
    () =>
      selectedChat?.type === "group"
        ? (groupTypingUsers[selectedChat._id] || []).filter((user) => user._id !== authUser?._id)
        : [],
    [selectedChat?._id, selectedChat?.type, groupTypingUsers, authUser?._id]
  );

  if (!selectedChat) return null;

  const groupTypingLabel =
    activeGroupTypers.length === 0
      ? null
      : activeGroupTypers.length === 1
        ? `${activeGroupTypers[0].fullName} is typing...`
        : `${activeGroupTypers.slice(0, 2).map((user) => user.fullName).join(", ")} are typing...`;

  return (
    <>
      <div className="border-b border-base-300 p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className={`flex min-w-0 items-center gap-3 rounded-2xl px-1 py-1 text-left ${
                selectedChat.type === "group" ? "hover:bg-base-200" : ""
              }`}
              onClick={() => selectedChat.type === "group" && setIsGroupDetailsOpen(true)}
            >
              <div className="avatar">
                <div className="relative flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {selectedChat.profilePic ? (
                    <img
                      src={selectedChat.profilePic}
                      alt={selectedChat.fullName || selectedChat.name}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : isDirectChat ? (
                    getInitials(selectedChat.fullName) || "U"
                  ) : (
                    <Users className="size-4" />
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="truncate font-medium">{selectedChat.fullName || selectedChat.name}</h3>
                <p className="truncate text-sm text-base-content/70">
                  {isDirectChat
                    ? isTyping
                      ? "typing..."
                      : onlineUsers.includes(selectedChat._id)
                        ? "Online"
                        : "Offline"
                    : groupTypingLabel ||
                      `${selectedChat.memberCount} members • ${selectedChat.isAdmin ? "You are admin" : "Tap to see details"}`}
                </p>
              </div>

              {selectedChat.type === "group" && <ChevronRight className="size-4 text-base-content/45" />}
            </button>
          </div>

          <button onClick={() => setSelectedChat(null)} type="button" aria-label="Close conversation">
            <X />
          </button>
        </div>
      </div>

      <GroupDetailsModal
        open={isGroupDetailsOpen}
        onClose={() => setIsGroupDetailsOpen(false)}
      />
    </>
  );
};
