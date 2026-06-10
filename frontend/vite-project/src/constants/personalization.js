// Shared personalization data: chat wallpapers, AI-avatar styles, avatar rings,
// and custom emoji packs. Pure data — no logic — so it can be imported anywhere.

/* ----------------------------- Chat wallpapers ----------------------------- */
// `style` is applied inline to the chat background layer. `thumb` is the same
// look shrunk for the picker swatch.
export const WALLPAPERS = [
  { id: "default", name: "Default", style: {} },
  {
    id: "aurora",
    name: "Aurora",
    style: {
      backgroundImage:
        "radial-gradient(60% 60% at 20% 10%, rgba(124,92,255,0.30), transparent 60%), radial-gradient(60% 60% at 85% 30%, rgba(99,102,241,0.26), transparent 60%), radial-gradient(70% 70% at 60% 100%, rgba(192,132,252,0.22), transparent 60%)",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    style: {
      backgroundImage:
        "linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%), radial-gradient(40% 40% at 80% 0%, rgba(56,189,248,0.18), transparent 60%)",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    style: {
      backgroundImage:
        "linear-gradient(160deg, rgba(251,113,133,0.28), transparent 55%), linear-gradient(20deg, rgba(251,191,36,0.22), transparent 55%)",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    style: {
      backgroundImage:
        "linear-gradient(160deg, rgba(45,212,191,0.24), transparent 55%), linear-gradient(20deg, rgba(56,189,248,0.22), transparent 55%)",
    },
  },
  {
    id: "forest",
    name: "Forest",
    style: {
      backgroundImage:
        "linear-gradient(160deg, rgba(52,211,153,0.24), transparent 55%), linear-gradient(20deg, rgba(132,204,22,0.18), transparent 55%)",
    },
  },
  {
    id: "dots",
    name: "Dots",
    style: {
      backgroundImage: "radial-gradient(rgba(255,255,255,0.10) 1.4px, transparent 1.4px)",
      backgroundSize: "20px 20px",
    },
  },
  {
    id: "grid",
    name: "Grid",
    style: {
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
      backgroundSize: "26px 26px",
    },
  },
  {
    id: "bubbles",
    name: "Bubbles",
    style: {
      backgroundImage:
        "radial-gradient(circle at 15% 20%, rgba(124,92,255,0.16) 0 14px, transparent 15px), radial-gradient(circle at 70% 60%, rgba(99,102,241,0.14) 0 22px, transparent 23px), radial-gradient(circle at 40% 85%, rgba(192,132,252,0.12) 0 18px, transparent 19px)",
      backgroundSize: "260px 260px",
    },
  },
];

export const getWallpaperById = (id) =>
  WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0];

/* --------------------------- AI-generated avatars -------------------------- */
// DiceBear (free, no API key). PNG endpoint so the existing Cloudinary upload
// in updateProfile stores it cleanly.
export const DICEBEAR_BASE = "https://api.dicebear.com/9.x";

export const AVATAR_STYLES = [
  { id: "bottts", name: "Bots" },
  { id: "avataaars", name: "Avatars" },
  { id: "pixel-art", name: "Pixel" },
  { id: "lorelei", name: "Lorelei" },
  { id: "notionists", name: "Notion" },
  { id: "adventurer", name: "Adventurer" },
  { id: "fun-emoji", name: "Emoji" },
  { id: "thumbs", name: "Thumbs" },
  { id: "shapes", name: "Shapes" },
  { id: "identicon", name: "Identicon" },
];

export const dicebearUrl = (style, seed, format = "svg") =>
  `${DICEBEAR_BASE}/${style}/${format}?seed=${encodeURIComponent(seed)}`;

/* ----------------------------- Animated rings ------------------------------ */
export const AVATAR_RINGS = [
  { id: "none", name: "None" },
  { id: "aurora", name: "Aurora spin" },
  { id: "pulse", name: "Pulse glow" },
  { id: "rainbow", name: "Rainbow" },
];

/* ----------------------------- Custom emoji packs -------------------------- */
export const EMOJI_PACKS = [
  {
    id: "smileys",
    name: "Smileys",
    icon: "😀",
    emojis: [
      "😀", "😁", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌",
      "😍", "🥰", "😘", "😎", "🤩", "🥳", "😏", "😋", "🤔", "🤨",
      "😴", "😪", "😵", "🤯", "😳", "🥺", "😭", "😤", "😡", "🤬",
    ],
  },
  {
    id: "hearts",
    name: "Love",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💕",
      "💞", "💓", "💗", "💖", "💘", "💝", "💟", "❣️", "💔", "❤️‍🔥",
    ],
  },
  {
    id: "hands",
    name: "Gestures",
    icon: "👍",
    emojis: [
      "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👏", "🙌", "🙏",
      "👋", "🤝", "💪", "🫶", "✊", "👊", "🤙", "👇", "👆", "🫡",
    ],
  },
  {
    id: "fun",
    name: "Fun",
    icon: "🔥",
    emojis: [
      "🔥", "✨", "🎉", "🎊", "💯", "⚡", "🌈", "⭐", "🌟", "💫",
      "🎯", "🚀", "🏆", "🥂", "🍻", "🎁", "💎", "👑", "🪩", "🎮",
    ],
  },
  {
    id: "animals",
    name: "Animals",
    icon: "🐶",
    emojis: [
      "🐶", "🐱", "🦊", "🐼", "🐨", "🦁", "🐯", "🐵", "🐸", "🐧",
      "🦄", "🐢", "🐙", "🦋", "🐝", "🐬", "🦉", "🐰", "🐹", "🦴",
    ],
  },
  {
    id: "food",
    name: "Food",
    icon: "🍕",
    emojis: [
      "🍕", "🍔", "🍟", "🌮", "🍣", "🍜", "🍩", "🍪", "🍰", "🎂",
      "🍫", "🍿", "☕", "🍵", "🧋", "🍺", "🍷", "🍓", "🥑", "🍎",
    ],
  },
];
