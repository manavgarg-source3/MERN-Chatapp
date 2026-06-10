import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image, Phone, Users, Video, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { GroupDetailsModal } from "./GroupDetailsModal";
import { WallpaperPicker } from "./WallpaperPicker";

const getInitials = (value = "") =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const isUserOnline = (onlineUsers = [], userId) => onlineUsers.includes(String(userId));

export const ChatHeader = () => {
  const { selectedChat, setSelectedChat, typingUsers, groupTypingUsers } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { startCall, status: callStatus } = useCallStore();
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
  const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);

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
      <div className="glass-strong edge-light border-x-0 border-t-0 border-b border-white/5 px-3 py-2.5 sm:px-4">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle md:hidden"
              onClick={() => setSelectedChat(null)}
              aria-label="Back to chats"
            >
              <ChevronLeft className="size-5" />
            </button>

            <button
              type="button"
              className={`flex min-w-0 items-center gap-3 rounded-2xl px-1.5 py-1 text-left transition-colors ${
                selectedChat.type === "group" ? "hover:bg-white/5" : ""
              }`}
              onClick={() => selectedChat.type === "group" && setIsGroupDetailsOpen(true)}
            >
              <div className="avatar">
                <div className="brand-gradient-soft relative flex size-10 items-center justify-center rounded-2xl border border-white/10 text-sm font-semibold text-primary">
                  {selectedChat.profilePic ? (
                    <img
                      src={selectedChat.profilePic}
                      alt={selectedChat.fullName || selectedChat.name}
                      className="size-10 rounded-2xl object-cover"
                    />
                  ) : isDirectChat ? (
                    getInitials(selectedChat.fullName) || "U"
                  ) : (
                    <Users className="size-4" />
                  )}
                  {isDirectChat && isUserOnline(onlineUsers, selectedChat._id) && (
                    <span className="presence-dot absolute -bottom-0.5 -right-0.5 size-3 rounded-full" />
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold tracking-tightish">
                  {selectedChat.fullName || selectedChat.name}
                </h3>
                <p
                  className={`truncate text-xs sm:text-[13px] ${
                    (isDirectChat && (isTyping || isUserOnline(onlineUsers, selectedChat._id))) ||
                    (!isDirectChat && groupTypingLabel)
                      ? "text-emerald-400"
                      : "text-base-content/55"
                  }`}
                >
                  {isDirectChat
                    ? isTyping
                      ? "typing…"
                      : isUserOnline(onlineUsers, selectedChat._id)
                        ? "Online"
                        : "Offline"
                    : groupTypingLabel ||
                      `${selectedChat.memberCount} members • ${selectedChat.isAdmin ? "You are admin" : "Tap to see details"}`}
                </p>
              </div>

              {selectedChat.type === "group" && <ChevronRight className="size-4 text-base-content/40" />}
            </button>
          </div>

          <div className="flex items-center gap-1">
            {isDirectChat && (
              <>
                <button
                  type="button"
                  aria-label="Start voice call"
                  title="Voice call"
                  disabled={callStatus !== "idle"}
                  onClick={() => startCall(selectedChat, "audio")}
                  className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-primary disabled:opacity-40"
                >
                  <Phone className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Start video call"
                  title="Video call"
                  disabled={callStatus !== "idle"}
                  onClick={() => startCall(selectedChat, "video")}
                  className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-primary disabled:opacity-40"
                >
                  <Video className="size-5" />
                </button>
              </>
            )}

            <button
              type="button"
              aria-label="Change chat wallpaper"
              title="Chat wallpaper"
              onClick={() => setIsWallpaperOpen(true)}
              className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-primary"
            >
              <Image className="size-5" />
            </button>

            <button
              onClick={() => setSelectedChat(null)}
              type="button"
              aria-label="Close conversation"
              className="btn btn-ghost btn-sm btn-circle hidden md:inline-flex"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <GroupDetailsModal
        open={isGroupDetailsOpen}
        onClose={() => setIsGroupDetailsOpen(false)}
      />

      <WallpaperPicker
        open={isWallpaperOpen}
        onClose={() => setIsWallpaperOpen(false)}
        chatId={selectedChat._id}
        chatName={selectedChat.fullName || selectedChat.name}
      />
    </>
  );
};
