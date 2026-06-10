import { useRef } from "react";
import { Check, ImagePlus, RotateCcw, X } from "lucide-react";
import toast from "react-hot-toast";
import { WALLPAPERS } from "../constants/personalization";
import { usePrefsStore } from "../store/usePrefsStore";

const MAX_WALLPAPER_BYTES = 2 * 1024 * 1024;

/**
 * Wallpaper picker. If `chatId` is provided it sets a per-chat wallpaper,
 * otherwise it sets the global default.
 */
export const WallpaperPicker = ({ open, onClose, chatId = null, chatName = "" }) => {
  const fileRef = useRef(null);
  const {
    defaultWallpaper,
    chatWallpapers,
    setDefaultWallpaper,
    setChatWallpaper,
    clearChatWallpaper,
    setCustomWallpaper,
  } = usePrefsStore();

  if (!open) return null;

  const currentId = chatId ? chatWallpapers[chatId] || defaultWallpaper : defaultWallpaper;

  const apply = (id) => {
    if (chatId) setChatWallpaper(chatId, id);
    else setDefaultWallpaper(id);
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_WALLPAPER_BYTES) {
      toast.error("Please choose an image under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCustomWallpaper(chatId || "global", reader.result);
      apply("custom");
      toast.success("Custom wallpaper applied");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="glass-strong animate-pop-in w-full max-w-lg rounded-3xl shadow-soft">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <h3 className="font-semibold tracking-tightish">Chat wallpaper</h3>
            <p className="text-sm text-base-content/55">
              {chatId ? `For your chat with ${chatName || "this contact"}` : "Default for all chats"}
            </p>
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

        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {WALLPAPERS.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => apply(w.id)}
                className={`group relative aspect-[4/5] overflow-hidden rounded-2xl border bg-base-200 transition-all ${
                  currentId === w.id
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <span className="absolute inset-0" style={w.style} />
                {currentId === w.id && (
                  <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="size-3" />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1 text-left text-[11px] font-medium text-white">
                  {w.name}
                </span>
              </button>
            ))}

            {/* Custom upload tile */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed text-center transition-colors ${
                currentId === "custom"
                  ? "border-primary text-primary ring-2 ring-primary/40"
                  : "border-white/15 text-base-content/60 hover:border-white/30"
              }`}
            >
              <ImagePlus className="size-6" />
              <span className="text-[11px] font-medium">Upload</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>

        {chatId && (
          <div className="flex justify-end border-t border-white/5 px-5 py-3">
            <button
              type="button"
              onClick={() => {
                clearChatWallpaper(chatId);
                toast.success("Reset to default wallpaper");
              }}
              className="btn btn-ghost btn-sm gap-2"
            >
              <RotateCcw className="size-4" />
              Reset to default
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
