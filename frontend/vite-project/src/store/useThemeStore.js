import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "coffee",
  setTheme: (theme) => {
    console.log("Changing theme to:", theme); // Debugging log
    localStorage.setItem("chat-theme", theme);
    set({ theme });
    document.documentElement.setAttribute("data-theme", theme);
  },
}));

// Apply theme on page load
document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("chat-theme") || "coffee"
);
