import { useEffect, useRef, useState } from "react";
import { EMOJI_PACKS } from "../constants/personalization";

/**
 * Custom emoji-pack picker. Renders as a popover above the trigger.
 * Calls `onSelect(emoji)` when an emoji is tapped; `onClose` to dismiss.
 */
export const EmojiPicker = ({ onSelect, onClose }) => {
  const [activePack, setActivePack] = useState(EMOJI_PACKS[0].id);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const handleEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const pack = EMOJI_PACKS.find((p) => p.id === activePack) || EMOJI_PACKS[0];

  return (
    <div
      ref={ref}
      className="glass-strong animate-pop-in absolute bottom-14 left-0 z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl p-2 shadow-soft sm:w-80"
    >
      {/* Pack tabs */}
      <div className="mb-2 flex items-center gap-1 overflow-x-auto border-b border-white/5 pb-2">
        {EMOJI_PACKS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePack(p.id)}
            title={p.name}
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-lg transition-colors ${
              activePack === p.id ? "bg-primary/20 ring-1 ring-primary/40" : "hover:bg-white/10"
            }`}
          >
            {p.icon}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid max-h-44 grid-cols-7 gap-0.5 overflow-y-auto sm:grid-cols-8">
        {pack.emojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            type="button"
            onClick={() => onSelect?.(emoji)}
            className="flex size-9 items-center justify-center rounded-lg text-xl transition-transform hover:scale-110 hover:bg-white/10"
          >
            {emoji}
          </button>
        ))}
      </div>

      <p className="mt-1.5 px-1 text-center text-[11px] text-base-content/40">{pack.name}</p>
    </div>
  );
};
