import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, CheckCircle2, Loader, Mail, ShieldCheck, User } from "lucide-react";
import { toast } from "react-hot-toast";

export const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [error, setError] = useState(null);

  const memberSince = authUser?.createdAt
    ? new Date(authUser.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const hasNameChanged = fullName.trim() && fullName.trim() !== (authUser?.fullName || "");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB.");
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    await updateProfile({ fullName: fullName.trim() });
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser?.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 bg-gray-200"
                onError={(e) => (e.target.src = "/avatar.png")}
              />
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-all duration-200 
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none opacity-50" : "bg-base-content hover:scale-105"}
                `}
              >
                {isUpdatingProfile ? (
                  <Loader className="w-5 h-5 animate-spin text-base-200" />
                ) : (
                  <Camera className="w-5 h-5 text-base-200" />
                )}
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>

            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <input
                type="text"
                className="input input-bordered w-full"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email || "N/A"}</p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUpdatingProfile || !hasNameChanged}
            >
              {isUpdatingProfile ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </form>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Member Since
                </span>
                <span>{memberSince}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  Account Status
                </span>
                <span className="text-green-500">Active</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Email Verification</span>
                <span className={authUser?.isVerified ? "text-green-500" : "text-amber-500"}>
                  {authUser?.isVerified ? "Verified" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
