import { useEffect, useRef, useState } from "react";
import { Check, Clock3, LoaderCircle, Search, UserPlus, Users, X } from "lucide-react";
import { useFriendStore } from "../store/useFriendStore";

export const FriendRequestsModal = ({ open, onClose }) => {
  const {
    availableUsers,
    incomingRequests,
    outgoingRequests,
    isLoading,
    isPeopleLoading,
    hasMoreAvailableUsers,
    activeRequestId,
    getFriendOverview,
    searchAvailableUsers,
    loadMoreAvailableUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useFriendStore();
  const [searchValue, setSearchValue] = useState("");
  const loadMoreRef = useRef(null);
  const skipNextSearchEffectRef = useRef(false);

  useEffect(() => {
    if (open) {
      skipNextSearchEffectRef.current = true;
      setSearchValue("");
      getFriendOverview({ page: 1, search: "", append: false, mode: "initial" });
    }
  }, [open, getFriendOverview]);

  useEffect(() => {
    if (!open) return undefined;
    if (skipNextSearchEffectRef.current) {
      skipNextSearchEffectRef.current = false;
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      searchAvailableUsers(searchValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [open, searchValue, searchAvailableUsers]);

  useEffect(() => {
    if (!open || !loadMoreRef.current) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreAvailableUsers();
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [open, loadMoreAvailableUsers, availableUsers.length, hasMoreAvailableUsers]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-base-300 bg-base-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Friend Requests</h2>
            <p className="text-sm text-base-content/60">
              Send requests, accept people, and start chatting after approval.
            </p>
          </div>
          <button type="button" className="btn btn-circle btn-sm" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          {isLoading && incomingRequests.length === 0 && outgoingRequests.length === 0 && availableUsers.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <LoaderCircle className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <h3 className="font-semibold">Incoming Requests</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {incomingRequests.length}
                  </span>
                </div>

                {incomingRequests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-base-300 p-4 text-sm text-base-content/60">
                    No pending requests right now.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {incomingRequests.map((user) => (
                      <div
                        key={user._id}
                        className="flex flex-col gap-3 rounded-xl border border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePic || "/avatar.png"}
                            alt={user.fullName}
                            className="size-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-base-content/60">{user.email}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptFriendRequest(user._id)}
                            disabled={activeRequestId === user._id}
                          >
                            {activeRequestId === user._id ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <Check className="size-4" />
                            )}
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => rejectFriendRequest(user._id)}
                            disabled={activeRequestId === user._id}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-primary" />
                  <h3 className="font-semibold">Sent Requests</h3>
                  <span className="rounded-full bg-base-200 px-2 py-0.5 text-xs">
                    {outgoingRequests.length}
                  </span>
                </div>

                {outgoingRequests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-base-300 p-4 text-sm text-base-content/60">
                    No outgoing requests yet.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {outgoingRequests.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between rounded-xl border border-base-300 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePic || "/avatar.png"}
                            alt={user.fullName}
                            className="size-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-base-content/60">{user.email}</p>
                          </div>
                        </div>

                        <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-4 text-primary" />
                  <h3 className="font-semibold">Find People</h3>
                </div>

                <label className="input input-bordered flex items-center gap-2">
                  <Search className="size-4 text-base-content/50" />
                  <input
                    type="text"
                    className="grow"
                    placeholder="Search by name or email"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </label>

                {!isLoading && availableUsers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-base-300 p-4 text-sm text-base-content/60">
                    {searchValue.trim()
                      ? "No users matched your search."
                      : "No more users are available to add right now."}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableUsers.map((user) => (
                      <div key={user._id} className="rounded-xl border border-base-300 p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePic || "/avatar.png"}
                            alt={user.fullName}
                            className="size-12 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{user.fullName}</p>
                            <p className="truncate text-sm text-base-content/60">{user.email}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline btn-primary btn-sm mt-4 w-full"
                          onClick={() => sendFriendRequest(user._id)}
                          disabled={activeRequestId === user._id}
                        >
                          {activeRequestId === user._id ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <UserPlus className="size-4" />
                          )}
                          Send Request
                        </button>
                      </div>
                    ))}

                    {isPeopleLoading && (
                      <div className="col-span-full flex items-center justify-center py-4">
                        <LoaderCircle className="size-6 animate-spin text-primary" />
                      </div>
                    )}

                    {hasMoreAvailableUsers && (
                      <div ref={loadMoreRef} className="col-span-full h-2" aria-hidden="true" />
                    )}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
