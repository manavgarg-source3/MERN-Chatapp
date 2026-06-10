import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { SidebarSkeleton } from "./SidebarSkeleton";

const getInitials = (value = "") =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const isUserOnline = (onlineUsers = [], userId) => onlineUsers.includes(String(userId));

const GroupAvatar = ({ group }) => (
  <div className="brand-gradient-soft flex size-12 items-center justify-center rounded-2xl border border-white/10 text-sm font-semibold text-primary">
    {group.profilePic ? (
      <img
        src={group.profilePic}
        alt={group.name}
        className="size-12 rounded-2xl object-cover"
      />
    ) : (
      getInitials(group.name) || "G"
    )}
  </div>
);

const UnreadBadge = ({ count }) => {
  if (!count) return null;

  return (
    <span className="brand-gradient inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-glow-sm">
      {count > 99 ? "99+" : count}
    </span>
  );
};

export const Sidebar = () => {
  const {
    getConversations,
    directUsers,
    groups,
    selectedChat,
    setSelectedChat,
    applyConversationUnreadCountUpdate,
    isUsersLoading,
    isGroupsLoading,
  } = useChatStore();
  const { onlineUsers, socket } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleFriendsUpdated = () => {
      getConversations();
    };

    const handleGroupsUpdated = () => {
      getConversations();
    };

    const handleUnreadCountUpdated = (payload) => {
      applyConversationUnreadCountUpdate(payload);
    };

    socket.on("friendsUpdated", handleFriendsUpdated);
    socket.on("groupsUpdated", handleGroupsUpdated);
    socket.on("conversationUnreadCountUpdated", handleUnreadCountUpdated);

    return () => {
      socket.off("friendsUpdated", handleFriendsUpdated);
      socket.off("groupsUpdated", handleGroupsUpdated);
      socket.off("conversationUnreadCountUpdated", handleUnreadCountUpdated);
    };
  }, [socket, getConversations, applyConversationUnreadCountUpdate]);

  const filteredDirectUsers = useMemo(
    () =>
      showOnlineOnly ? directUsers.filter((user) => isUserOnline(onlineUsers, user._id)) : directUsers,
    [showOnlineOnly, directUsers, onlineUsers]
  );

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full border-r-0 border-white/5 md:w-80 md:border-r lg:w-96">
      <div className="flex h-full flex-col bg-base-100/40">
        <div className="w-full border-b border-white/5 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="brand-gradient-soft flex size-8 items-center justify-center rounded-xl border border-white/10">
                <Users className="size-4 text-primary" />
              </div>
              <span className="text-[15px] font-semibold tracking-tightish">Messages</span>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-base-content/60">
              {filteredDirectUsers.length + groups.length}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-white/5 bg-base-200/60 px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm checkbox-primary"
              />
              <span className="text-sm text-base-content/80">Online only</span>
            </label>
            <span className="flex items-center gap-1.5 text-xs text-base-content/50">
              <span className="presence-dot size-2 rounded-full" />
              live
            </span>
          </div>
        </div>

        <div className="overflow-y-auto px-2 py-3 sm:px-3">
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-base-content/40">
            Friends
          </div>

          {filteredDirectUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedChat({ ...user, type: "direct" })}
              className={`group mb-1 flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all duration-150 hover:bg-white/[0.06] ${
                selectedChat?._id === user._id && selectedChat?.type === "direct"
                  ? "border border-primary/30 bg-primary/10 shadow-glow-sm"
                  : "border border-transparent"
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 rounded-2xl object-cover ring-1 ring-white/10"
                />
                {isUserOnline(onlineUsers, user._id) && (
                  <span className="presence-dot absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-[15px] font-semibold">{user.fullName}</div>
                  <UnreadBadge count={user.unreadCount} />
                </div>
                <div
                  className={`truncate text-[13px] ${user.unreadCount ? "font-medium text-primary" : "text-base-content/45"}`}
                >
                  {user.unreadCount
                    ? `${user.unreadCount} new message${user.unreadCount === 1 ? "" : "s"}`
                    : isUserOnline(onlineUsers, user._id)
                      ? "Online now"
                      : "Offline"}
                </div>
              </div>
            </button>
          ))}

          <div className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-base-content/40">
            Groups
          </div>

          {groups.map((group) => (
            <button
              key={group._id}
              onClick={() => setSelectedChat(group)}
              className={`group mb-1 flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all duration-150 hover:bg-white/[0.06] ${
                selectedChat?._id === group._id && selectedChat?.type === "group"
                  ? "border border-primary/30 bg-primary/10 shadow-glow-sm"
                  : "border border-transparent"
              }`}
            >
              <div className="relative shrink-0">
                <GroupAvatar group={group} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-[15px] font-semibold">{group.name}</div>
                  <UnreadBadge count={group.unreadCount} />
                </div>
                <div
                  className={`truncate text-[13px] ${group.unreadCount ? "font-medium text-primary" : "text-base-content/45"}`}
                >
                  {group.unreadCount
                    ? `${group.unreadCount} new message${group.unreadCount === 1 ? "" : "s"}`
                    : `${group.memberCount} member${group.memberCount === 1 ? "" : "s"}`}
                </div>
              </div>
            </button>
          ))}

          {filteredDirectUsers.length === 0 && groups.length === 0 && (
            <div className="mx-2 mt-4 rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center">
              <div className="brand-gradient-soft mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border border-white/10">
                <Users className="size-5 text-primary" />
              </div>
              <p className="font-semibold">No conversations yet</p>
              <p className="mt-1 text-sm text-base-content/50">
                Accept some friends first, then start a direct chat or create a group.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
