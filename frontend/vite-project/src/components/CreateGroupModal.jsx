import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, LoaderCircle, Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

export const CreateGroupModal = ({ open, onClose }) => {
  const { directUsers, createGroup, isCreatingGroup, setSelectedChat } = useChatStore();
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupImage, setGroupImage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setGroupName("");
      setSelectedMembers([]);
      setGroupImage("");
    }
  }, [open]);

  const sortedFriends = useMemo(
    () => [...directUsers].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [directUsers]
  );

  const toggleMember = (userId) => {
    setSelectedMembers((currentMembers) =>
      currentMembers.includes(userId)
        ? currentMembers.filter((memberId) => memberId !== userId)
        : [...currentMembers, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    const newGroup = await createGroup({
      name: groupName.trim(),
      members: selectedMembers,
      groupImage,
    });

    setSelectedChat(newGroup);
    onClose();
  };

  const handleGroupImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageData = await readFileAsDataUrl(file);
    setGroupImage(imageData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-base-300 bg-base-100 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-base-300 px-6 py-4">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Create Group</h2>
            <p className="text-sm text-base-content/60">
              Only accepted friends can be added to the group.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateGroup} className="px-6 py-5">
          <div className="mb-5 flex justify-center">
            <button
              type="button"
              className="relative"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border border-base-300 bg-base-200">
                {groupImage ? (
                  <img src={groupImage} alt="Group preview" className="size-full object-cover" />
                ) : (
                  <Users className="size-10 text-base-content/45" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-content shadow-lg">
                <Camera className="size-4" />
              </div>
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleGroupImageChange}
            />
          </div>

          <label className="form-control">
            <span className="label-text mb-2 font-medium">Group name</span>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Weekend Plans"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={80}
            />
          </label>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">Select members</span>
              <span className="text-sm text-base-content/60">
                {selectedMembers.length} selected
              </span>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-base-300 p-2">
              {sortedFriends.map((user) => (
                <label
                  key={user._id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-base-200"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selectedMembers.includes(user._id)}
                    onChange={() => toggleMember(user._id)}
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

              {sortedFriends.length === 0 && (
                <div className="rounded-xl bg-base-200 px-4 py-6 text-center text-sm text-base-content/60">
                  Add some friends first, then you can create a group with them.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreatingGroup || !groupName.trim() || selectedMembers.length === 0}
            >
              {isCreatingGroup ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
