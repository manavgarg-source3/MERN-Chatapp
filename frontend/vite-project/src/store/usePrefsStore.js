import { create } from "zustand";

/**
 * Client-side personalization preferences, persisted to localStorage.
 * Kept out of the backend on purpose so wallpapers / rings work instantly with
 * no server round-trip. (AI avatars DO persist server-side via updateProfile.)
 */

const STORAGE_KEY = "gargx-prefs";

const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
};

const persist = (prefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage may be full (e.g. large custom wallpaper) — ignore */
  }
};

const initial = loadPrefs();

export const usePrefsStore = create((set, get) => ({
  // wallpaper applied when a chat has no specific override
  defaultWallpaper: initial.defaultWallpaper || "aurora",
  // { [chatId]: wallpaperId } overrides
  chatWallpapers: initial.chatWallpapers || {},
  // custom uploaded wallpaper data URLs, keyed "global" or chatId
  customWallpapers: initial.customWallpapers || {},
  // animated avatar ring style id
  avatarRing: initial.avatarRing || "none",

  _save: () => {
    const { defaultWallpaper, chatWallpapers, customWallpapers, avatarRing } = get();
    persist({ defaultWallpaper, chatWallpapers, customWallpapers, avatarRing });
  },

  setDefaultWallpaper: (id) => {
    set({ defaultWallpaper: id });
    get()._save();
  },

  setChatWallpaper: (chatId, id) => {
    if (!chatId) return;
    set((s) => ({ chatWallpapers: { ...s.chatWallpapers, [chatId]: id } }));
    get()._save();
  },

  clearChatWallpaper: (chatId) => {
    set((s) => {
      const next = { ...s.chatWallpapers };
      delete next[chatId];
      return { chatWallpapers: next };
    });
    get()._save();
  },

  // key = "global" or a chatId
  setCustomWallpaper: (key, dataUrl) => {
    set((s) => ({ customWallpapers: { ...s.customWallpapers, [key]: dataUrl } }));
    get()._save();
  },

  setAvatarRing: (id) => {
    set({ avatarRing: id });
    get()._save();
  },

  // Resolve the effective wallpaper id for a chat (override → global default)
  resolveWallpaperId: (chatId) => {
    const { chatWallpapers, defaultWallpaper } = get();
    return (chatId && chatWallpapers[chatId]) || defaultWallpaper || "default";
  },
}));
