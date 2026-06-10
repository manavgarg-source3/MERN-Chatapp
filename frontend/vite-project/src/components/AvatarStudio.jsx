import { useState } from "react";
import { Dices, Loader, Sparkles, X } from "lucide-react";
import { AVATAR_STYLES, dicebearUrl } from "../constants/personalization";
import { useAuthStore } from "../store/useAuthStore";

const randomSeed = () => Math.random().toString(36).slice(2, 10);

/**
 * AI-generated avatar studio (DiceBear, free, no key).
 * Previews are crisp SVGs; the saved avatar uses the PNG endpoint so the
 * existing Cloudinary upload in updateProfile stores it cleanly.
 */
export const AvatarStudio = ({ open, onClose }) => {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const [style, setStyle] = useState(AVATAR_STYLES[0].id);
  const [seed, setSeed] = useState(authUser?.fullName?.trim() || "GargX");
  const [selectedSeed, setSelectedSeed] = useState(`${authUser?.fullName?.trim() || "GargX"}-0`);

  if (!open) return null;

  const variations = Array.from({ length: 12 }, (_, i) => `${seed || "GargX"}-${i}`);

  const handleSave = async () => {
    await updateProfile({ profilePic: dicebearUrl(style, selectedSeed, "png") });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="glass-strong animate-pop-in flex w-full max-w-xl flex-col rounded-3xl shadow-soft">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="brand-gradient flex size-8 items-center justify-center rounded-xl">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold tracking-tightish">Generate avatar</h3>
              <p className="text-xs text-base-content/55">AI-style avatars · free</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-circle btn-sm btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {/* Style tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {AVATAR_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  style === s.id
                    ? "bg-primary text-primary-content"
                    : "border border-white/10 bg-white/5 text-base-content/70 hover:bg-white/10"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Seed input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={seed}
              onChange={(e) => {
                setSeed(e.target.value);
                setSelectedSeed(`${e.target.value || "GargX"}-0`);
              }}
              placeholder="Type anything (your name, a word…)"
              className="input input-bordered flex-1 rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const s = randomSeed();
                setSeed(s);
                setSelectedSeed(`${s}-0`);
              }}
              className="btn btn-sm gap-2 rounded-xl border-white/10 bg-white/5"
            >
              <Dices className="size-4" />
              Random
            </button>
          </div>

          {/* Variations grid */}
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {variations.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSelectedSeed(v)}
                className={`aspect-square overflow-hidden rounded-2xl border bg-base-200 p-1 transition-all ${
                  selectedSeed === v
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <img
                  src={dicebearUrl(style, v, "svg")}
                  alt="avatar option"
                  className="size-full rounded-xl"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={dicebearUrl(style, selectedSeed, "svg")}
              alt="selected avatar"
              className="size-12 rounded-2xl ring-1 ring-white/10"
            />
            <span className="text-sm text-base-content/55">Your new avatar</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdatingProfile}
            className="btn btn-primary gap-2"
          >
            {isUpdatingProfile ? <Loader className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Use avatar
          </button>
        </div>
      </div>
    </div>
  );
};
