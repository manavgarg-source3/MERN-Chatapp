import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { FriendRequestsModal } from "./FriendRequestsModal";
import { CreateGroupModal } from "./CreateGroupModal";

export const Navbar = () => {
  const { logout, authUser, socket } = useAuthStore();
  const { incomingRequests, getFriendOverview } = useFriendStore();
  const { directUsers } = useChatStore();
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const userInitial = authUser?.fullName?.charAt(0)?.toUpperCase() || "U";

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

  return (
    <>
      <header
        className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
      backdrop-blur-lg bg-base-100/80"
      >
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-lg font-bold">GargX</h1>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {authUser && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm gap-2"
                    onClick={() => setIsCreateGroupOpen(true)}
                    disabled={directUsers.length === 0}
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">New Group</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm gap-2"
                    onClick={() => setIsRequestsOpen(true)}
                  >
                    <UserPlus className="size-4" />
                    <span className="hidden sm:inline">Friend Requests</span>
                    {incomingRequests.length > 0 && (
                      <span className="rounded-full bg-primary-content px-1.5 py-0.5 text-[10px] text-primary">
                        {incomingRequests.length}
                      </span>
                    )}
                  </button>

                  <div className="dropdown dropdown-end">
                    <button
                      type="button"
                      tabIndex={0}
                      className="btn btn-ghost btn-circle avatar"
                      aria-label="Open profile menu"
                    >
                      {authUser.profilePic ? (
                        <div className="w-10 rounded-full border border-base-300">
                          <img src={authUser.profilePic} alt={authUser.fullName} />
                        </div>
                      ) : (
                        <div className="w-10 rounded-full border border-base-300 bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {userInitial}
                        </div>
                      )}
                    </button>

                    <ul
                      tabIndex={0}
                      className="dropdown-content menu z-[60] mt-3 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
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
