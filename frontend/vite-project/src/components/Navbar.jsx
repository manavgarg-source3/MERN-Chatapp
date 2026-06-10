import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  User,
  UserPlus,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { usePrefsStore } from "../store/usePrefsStore";
import { FriendRequestsModal } from "./FriendRequestsModal";
import { CreateGroupModal } from "./CreateGroupModal";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, authUser, socket } = useAuthStore();
  const { incomingRequests, getFriendOverview } = useFriendStore();
  const { directUsers } = useChatStore();
  const avatarRing = usePrefsStore((s) => s.avatarRing);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const userInitial = authUser?.fullName?.charAt(0)?.toUpperCase() || "U";
  const ringClass =
    avatarRing && avatarRing !== "none" ? `avatar-ring avatar-ring-${avatarRing}` : "";

  useEffect(() => {
    if (!authUser) return;
    getFriendOverview();
  }, [authUser, getFriendOverview]);

  useEffect(() => {
    if (!socket || !authUser) return undefined;

    const handleFriendsUpdated = () => {
      getFriendOverview();
    };

    socket.on("friendsUpdated", handleFriendsUpdated);

    return () => {
      socket.off("friendsUpdated", handleFriendsUpdated);
    };
  }, [socket, authUser, getFriendOverview]);

  useEffect(() => {
    if (!authUser) return;

    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("friendRequests") === "1") {
      setIsRequestsOpen(true);
      searchParams.delete("friendRequests");
      navigate(
        {
          pathname: location.pathname,
          search: searchParams.toString() ? `?${searchParams.toString()}` : "",
        },
        { replace: true }
      );
    }
  }, [authUser, location.pathname, location.search, navigate]);

  return (
    <>
      <header
        className="glass-strong edge-light fixed top-0 z-40 w-full border-x-0 border-t-0 border-b border-white/5"
      >
        <div className="mx-auto h-16 max-w-7xl px-3 sm:px-4">
          <div className="flex items-center justify-between h-full">
            <div className="flex min-w-0 items-center gap-4">
              <Link to="/" className="group flex items-center gap-2.5 transition-all">
                <div className="brand-gradient flex size-9 items-center justify-center rounded-xl shadow-glow-sm transition-transform duration-200 group-hover:scale-105">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-lg font-bold tracking-tightish">
                  <span className="text-gradient">Garg</span>
                  <span className="text-base-content">X</span>
                </h1>
              </Link>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {authUser && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    className="btn btn-sm gap-2 rounded-xl border-white/10 bg-white/5 px-2 hover:bg-white/10 sm:px-3"
                    onClick={() => setIsCreateGroupOpen(true)}
                    disabled={directUsers.length === 0}
                    aria-label="Create group"
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">New Group</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm gap-2 rounded-xl px-2 sm:px-3"
                    onClick={() => setIsRequestsOpen(true)}
                    aria-label="Open friend requests"
                  >
                    <UserPlus className="size-4" />
                    <span className="hidden sm:inline">Friend Requests</span>
                    {incomingRequests.length > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {incomingRequests.length}
                      </span>
                    )}
                  </button>

                  <div className="dropdown dropdown-end">
                    <button
                      type="button"
                      tabIndex={0}
                      className="btn btn-ghost btn-circle avatar transition-transform hover:scale-105"
                      aria-label="Open profile menu"
                    >
                      <span className={`${ringClass} rounded-full`}>
                        {authUser.profilePic ? (
                          <div className="w-10 overflow-hidden rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-base-100">
                            <img src={authUser.profilePic} alt={authUser.fullName} />
                          </div>
                        ) : (
                          <div className="brand-gradient flex w-10 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100">
                            {userInitial}
                          </div>
                        )}
                      </span>
                    </button>

                    <ul
                      tabIndex={0}
                      className="dropdown-content menu glass-strong z-[60] mt-3 w-56 rounded-2xl p-2 shadow-soft"
                    >
                      <li className="menu-title px-2 py-1">
                        <span>{authUser.fullName}</span>
                        <span className="text-xs font-normal text-base-content/60">
                          {authUser.email}
                        </span>
                      </li>
                      <li>
                        <Link to="/profile" className="gap-2">
                          <User className="size-4" />
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link to="/settings" className="gap-2">
                          <Settings className="size-4" />
                          Settings
                        </Link>
                      </li>
                      <li>
                        <button type="button" className="gap-2" onClick={logout}>
                          <LogOut className="size-4" />
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <FriendRequestsModal open={isRequestsOpen} onClose={() => setIsRequestsOpen(false)} />
      <CreateGroupModal open={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
    </>
  );
};
