import { create } from "zustand";

// "business" carries the GargX 2026 "Aurora Violet" brand look (its palette is
// overridden in index.css). It's the default, but users can switch to any of
// the DaisyUI themes from Settings — the choice persists in localStorage.
const DEFAULT_THEME = "business";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || DEFAULT_THEME,
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
}));

// Apply the saved (or default) theme on page load
document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("chat-theme") || DEFAULT_THEME
);
