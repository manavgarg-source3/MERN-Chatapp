import { usePrefsStore } from "../store/usePrefsStore";

const getInitials = (value = "") =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

/**
 * Avatar with an optional animated personalization ring.
 * Pass `useOwnRing` to apply the signed-in user's chosen ring (from prefs);
 * otherwise pass an explicit `ring` id, or none.
 */
export const AnimatedAvatar = ({
  src,
  name = "",
  size = 40,
  ring,
  useOwnRing = false,
  rounded = "rounded-full",
  className = "",
}) => {
  const ownRing = usePrefsStore((s) => s.avatarRing);
  const activeRing = useOwnRing ? ownRing : ring;
  const ringClass =
    activeRing && activeRing !== "none" ? `avatar-ring avatar-ring-${activeRing}` : "";

  const dimension = { width: size, height: size };

  const inner = src ? (
    <img
      src={src}
      alt={name || "avatar"}
      style={dimension}
      className={`${rounded} object-cover ${className}`}
      onError={(e) => {
        e.currentTarget.src = "/avatar.png";
      }}
    />
  ) : (
    <div
      style={dimension}
      className={`brand-gradient flex items-center justify-center ${rounded} font-semibold text-white ${className}`}
    >
      {getInitials(name) || "?"}
    </div>
  );

  if (!ringClass) return inner;

  return <span className={`${ringClass} ${rounded}`}>{inner}</span>;
};
