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

const GroupAvatar = ({ group }) => (
  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
    {group.profilePic ? (
      <img
        src={group.profilePic}
        alt={group.name}
        className="size-12 rounded-full object-cover"
      />
    ) : (
      getInitials(group.name) || "G"
    )}
  </div>
);

const UnreadBadge = ({ count }) => {
  if (!count) return null;

  return (
    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold leading-none text-primary-content">
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
      showOnlineOnly ? directUsers.filter((user) => onlineUsers.includes(user._id)) : directUsers,
    [showOnlineOnly, directUsers, onlineUsers]
  );

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full border-r-0 border-base-300 md:w-80 md:border-r lg:w-96">
      <div className="flex h-full flex-col bg-base-100">
        <div className="w-full border-b border-base-300 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="size-5 sm:size-6" />
              <span className="font-medium">Chats & Groups</span>
            </div>
            <span className="text-xs text-zinc-500">
              {filteredDirectUsers.length + groups.length} chats
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-base-200 px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Online only</span>
            </label>
            <span className="text-xs text-zinc-500">
              {filteredDirectUsers.length + groups.length} total
            </span>
          </div>
        </div>

        <div className="overflow-y-auto px-2 py-3 sm:px-3">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-base-content/45">
            Friends
          </div>

          {filteredDirectUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedChat({ ...user, type: "direct" })}
              className={`mb-1.5 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-base-300 ${
                selectedChat?._id === user._id && selectedChat?.type === "direct"
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 rounded-full object-cover"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-base-100" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-medium">{user.fullName}</div>
                  <UnreadBadge count={user.unreadCount} />
                </div>
                <div
                  className={`truncate text-sm ${user.unreadCount ? "font-medium text-primary" : "text-zinc-400"}`}
                >
                  {user.unreadCount
                    ? `${user.unreadCount} new message${user.unreadCount === 1 ? "" : "s"}`
                    : onlineUsers.includes(user._id)
                      ? "Online"
                      : "Offline"}
                </div>
              </div>
            </button>
          ))}

          <div className="mb-2 mt-5 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-base-content/45">
            Groups
          </div>

          {groups.map((group) => (
            <button
              key={group._id}
              onClick={() => setSelectedChat(group)}
              className={`mb-1.5 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-base-300 ${
                selectedChat?._id === group._id && selectedChat?.type === "group"
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }`}
            >
              <div className="relative shrink-0">
                <GroupAvatar group={group} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-medium">{group.name}</div>
                  <UnreadBadge count={group.unreadCount} />
                </div>
                <div
                  className={`truncate text-sm ${group.unreadCount ? "font-medium text-primary" : "text-zinc-400"}`}
                >
                  {group.unreadCount
                    ? `${group.unreadCount} new message${group.unreadCount === 1 ? "" : "s"}`
                    : `${group.memberCount} member${group.memberCount === 1 ? "" : "s"}`}
                </div>
              </div>
            </button>
          ))}

          {filteredDirectUsers.length === 0 && groups.length === 0 && (
            <div className="px-5 py-8 text-center text-zinc-500">
              <p className="font-medium">No conversations yet</p>
              <p className="mt-1 text-sm">
                Accept some friends first, then start a direct chat or create a group.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
