import daisyui from "daisyui";

/**
 * GargX 2026 — "Aurora Violet" look.
 * We register DaisyUI's dark "business" theme so every component gets a full
 * variable set, then override the palette to the Aurora Violet brand in
 * src/index.css. One locked look: dark-glass + violet/indigo accents.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.35), 0 8px 30px -8px rgba(124,92,255,0.55)",
        "glow-sm": "0 6px 20px -6px rgba(124,92,255,0.45)",
        soft: "0 18px 50px -24px rgba(0,0,0,0.75)",
      },
      animation: {
        "spin-slow": "spin 4s linear infinite",
        glow: "glowEffect 3s infinite ease-in-out",
        "fade-up": "fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "pop-in": "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both",
        "aurora-pulse": "auroraPulse 9s ease-in-out infinite",
      },
      keyframes: {
        glowEffect: {
          "0%, 100%": { backgroundColor: "rgba(255,255,255,0.05)" },
          "50%": { backgroundColor: "rgba(255,255,255,0.15)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        auroraPulse: {
          "0%, 100%": { opacity: "0.55", transform: "translate3d(0,0,0) scale(1)" },
          "50%": { opacity: "0.9", transform: "translate3d(0,-3%,0) scale(1.08)" },
        },
      },
    },
  },
  plugins: [
    daisyui({
      themes: [
        "business --default",
        "light",
        "dark",
        "cupcake",
        "bumblebee",
        "emerald",
        "corporate",
        "retro",
        "cyberpunk",
        "valentine",
        "halloween",
        "garden",
        "forest",
        "aqua",
        "pastel",
        "fantasy",
        "wireframe",
        "black",
        "luxury",
        "dracula",
        "cmyk",
        "autumn",
        "acid",
        "lemonade",
        "night",
        "coffee",
        "winter",
        "dim",
        "sunset",
      ],
      logs: false,
    }),
  ],
};
