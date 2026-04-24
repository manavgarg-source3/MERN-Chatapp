import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Crown,
  LoaderCircle,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

export const GroupDetailsModal = ({ open, onClose }) => {
  const {
    selectedChat,
    directUsers,
    getGroupDetails,
    updateGroup,
    addGroupMembers,
    removeGroupMember,
    isUpdatingGroup,
    isManagingGroupMembers,
  } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  const [groupName, setGroupName] = useState("");
  const [pendingImage, setPendingImage] = useState("");
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState([]);
  const fileInputRef = useRef(null);
  const selectedGroupId = selectedChat?._id;
  const selectedGroupType = selectedChat?.type;
  const selectedGroupName = selectedChat?.name;
  const selectedGroupProfilePic = selectedChat?.profilePic;

  useEffect(() => {
    if (!open || selectedGroupType !== "group" || !selectedGroupId) return;

    setGroupName(selectedGroupName || "");
    setPendingImage(selectedGroupProfilePic || "");
    setSelectedMembersToAdd([]);
    getGroupDetails(selectedGroupId).catch(() => {});
  }, [
    open,
    selectedGroupId,
    selectedGroupName,
    selectedGroupProfilePic,
    selectedGroupType,
    getGroupDetails,
  ]);

  useEffect(() => {
    if (!selectedChat || selectedGroupType !== "group") return;
    setGroupName(selectedGroupName || "");
    setPendingImage(selectedGroupProfilePic || "");
  }, [selectedChat, selectedGroupName, selectedGroupProfilePic, selectedGroupType]);

  const availableFriendsToAdd = useMemo(() => {
    const currentMemberIds = new Set((selectedChat?.members || []).map((member) => member._id));
    return directUsers.filter((user) => !currentMemberIds.has(user._id));
  }, [directUsers, selectedChat?.members]);

  if (!open || !selectedChat || selectedChat.type !== "group") return null;

  const handleGroupImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageData = await readFileAsDataUrl(file);
    setPendingImage(imageData);
  };

  const handleSaveGroupInfo = async () => {
    const payload = {};

    if (groupName.trim() && groupName.trim() !== selectedChat.name) {
      payload.name = groupName.trim();
    }

    if (pendingImage && pendingImage !== selectedChat.profilePic) {
      payload.groupImage = pendingImage;
    }

    if (Object.keys(payload).length) {
      await updateGroup(selectedChat._id, payload);
    }
  };

  const toggleMemberToAdd = (userId) => {
    setSelectedMembersToAdd((currentMembers) =>
      currentMembers.includes(userId)
        ? currentMembers.filter((memberId) => memberId !== userId)
        : [...currentMembers, userId]
    );
  };

  const handleAddMembers = async () => {
    if (!selectedMembersToAdd.length) return;
    await addGroupMembers(selectedChat._id, selectedMembersToAdd);
    setSelectedMembersToAdd([]);
  };

  const handleRemoveMember = async (memberId) => {
    await removeGroupMember(selectedChat._id, memberId);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-base-300 bg-base-100 shadow-2xl">
        <div className="flex items-start justify-between border-b border-base-300 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold">Group Details</h2>
            <p className="text-sm text-base-content/60">
              View members, manage the group, and update the group profile.
            </p>
          </div>
          <button type="button" className="btn btn-circle btn-sm" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section className="rounded-3xl border border-base-300 bg-base-200/50 p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <button
                type="button"
                className={`relative mx-auto sm:mx-0 ${selectedChat.isAdmin ? "cursor-pointer" : "cursor-default"}`}
                onClick={() => selectedChat.isAdmin && fileInputRef.current?.click()}
              >
                <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border border-base-300 bg-base-100">
                  {pendingImage ? (
                    <img src={pendingImage} alt={selectedChat.name} className="size-full object-cover" />
                  ) : (
                    <Users className="size-10 text-base-content/40" />
                  )}
                </div>
                {selectedChat.isAdmin && (
                  <div className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-content shadow-lg">
                    <Camera className="size-4" />
                  </div>
                )}
              </button>

              <div className="flex-1 space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleGroupImageChange}
                />

                {selectedChat.isAdmin ? (
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="input input-bordered w-full"
                    maxLength={80}
                  />
                ) : (
                  <h3 className="text-2xl font-semibold">{selectedChat.name}</h3>
                )}

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-base-100 px-3 py-1 text-sm text-base-content/70">
                    {selectedChat.memberCount} members
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    Admin:{" "}
                    {selectedChat.members.find((member) => member._id === selectedChat.adminId)
                      ?.fullName || "Group admin"}
                  </span>
                </div>

                {selectedChat.isAdmin && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveGroupInfo}
                    disabled={isUpdatingGroup}
                  >
                    {isUpdatingGroup ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Group Info"
                    )}
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-base-300 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h3 className="font-semibold">Members</h3>
            </div>

            <div className="space-y-3">
              {selectedChat.members.map((member) => {
                const isAdmin = member._id === selectedChat.adminId;
                const isCurrentUser = member._id === authUser?._id;

                return (
                  <div
                    key={member._id}
                    className="flex flex-col gap-3 rounded-2xl border border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.profilePic || "/avatar.png"}
                        alt={member.fullName}
                        className="size-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">
                            {member.fullName}
                            {isCurrentUser ? " (You)" : ""}
                          </p>
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              <Crown className="size-3" />
                              Admin
                            </span>
                          )}
                          {onlineUsers.includes(member._id) && (
                            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
                              Online
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-base-content/60">{member.email}</p>
                      </div>
                    </div>

                    {selectedChat.isAdmin && !isAdmin && (
                      <button
                        type="button"
                        className="btn btn-sm btn-error btn-outline"
                        onClick={() => handleRemoveMember(member._id)}
                        disabled={isManagingGroupMembers}
                      >
                        {isManagingGroupMembers ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {selectedChat.isAdmin && (
            <section className="rounded-3xl border border-base-300 p-5">
              <div className="mb-4 flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                <h3 className="font-semibold">Add Members</h3>
              </div>

              {availableFriendsToAdd.length === 0 ? (
                <div className="rounded-2xl bg-base-200 px-4 py-5 text-sm text-base-content/60">
                  All your accepted friends are already in this group.
                </div>
              ) : (
                <>
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-base-300 p-2">
                    {availableFriendsToAdd.map((user) => (
                      <label
                        key={user._id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-base-200"
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedMembersToAdd.includes(user._id)}
                          onChange={() => toggleMemberToAdd(user._id)}
                        />
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName}
                          className="size-10 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.fullName}</p>
                          <p className="truncate text-sm text-base-content/60">{user.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddMembers}
                      disabled={isManagingGroupMembers || selectedMembersToAdd.length === 0}
                    >
                      {isManagingGroupMembers ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Selected Friends"
                      )}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
