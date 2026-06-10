import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { usePrefsStore } from "../store/usePrefsStore";
import { Camera, CheckCircle2, Loader, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { AvatarStudio } from "../components/AvatarStudio";

export const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const avatarRing = usePrefsStore((s) => s.avatarRing);
  const [selectedImg, setSelectedImg] = useState(null);
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [error, setError] = useState(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const memberSince = authUser?.createdAt
    ? new Date(authUser.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const hasNameChanged = fullName.trim() && fullName.trim() !== (authUser?.fullName || "");
  const ringClass =
    avatarRing && avatarRing !== "none" ? `avatar-ring avatar-ring-${avatarRing}` : "";

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
    <div className="app-aurora min-h-screen pt-20">
      <div className="mx-auto max-w-2xl p-4 py-8">
        <div className="glass edge-light space-y-8 rounded-3xl p-6 shadow-soft">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tightish">Profile</h1>
            <p className="mt-1 text-sm text-base-content/55">Your profile information</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className={`${ringClass} rounded-full`}>
              <div className="relative">
                <img
                  src={selectedImg || authUser?.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="size-32 rounded-full bg-base-200 object-cover ring-2 ring-white/10"
                  onError={(e) => (e.target.src = "/avatar.png")}
                />
                <label
                  htmlFor="avatar-upload"
                  className={`absolute bottom-0 right-0 cursor-pointer rounded-full p-2 transition-all duration-200 ${
                    isUpdatingProfile
                      ? "pointer-events-none animate-pulse opacity-50"
                      : "bg-base-content hover:scale-105"
                  }`}
                >
                  {isUpdatingProfile ? (
                    <Loader className="h-5 w-5 animate-spin text-base-200" />
                  ) : (
                    <Camera className="h-5 w-5 text-base-200" />
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
            </div>

            <button
              type="button"
              onClick={() => setIsStudioOpen(true)}
              className="btn btn-sm gap-2 rounded-xl border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Sparkles className="size-4" />
              Generate with AI
            </button>

            <p className="text-sm text-base-content/50">
              {isUpdatingProfile ? "Uploading..." : "Upload a photo or generate an AI avatar"}
            </p>
            {error && <p className="text-sm text-error">{error}</p>}
          </div>

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-base-content/55">
                <User className="h-4 w-4" />
                Full Name
              </div>
              <input
                type="text"
                className="input input-bordered w-full rounded-xl"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-base-content/55">
                <Mail className="h-4 w-4" />
                Email Address
              </div>
              <p className="rounded-xl border border-white/10 bg-base-200/60 px-4 py-2.5">
                {authUser?.email || "N/A"}
              </p>
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

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-lg font-semibold">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-white/5 py-2">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Member Since
                </span>
                <span>{memberSince}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 py-2">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  Account Status
                </span>
                <span className="text-emerald-400">Active</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Email Verification</span>
                <span className={authUser?.isVerified ? "text-emerald-400" : "text-amber-400"}>
                  {authUser?.isVerified ? "Verified" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AvatarStudio open={isStudioOpen} onClose={() => setIsStudioOpen(false)} />
    </div>
  );
};
