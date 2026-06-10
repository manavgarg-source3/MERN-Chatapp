import React, { useState } from "react";
import { THEMES } from "../constants/index";
import { useThemeStore } from "../store/useThemeStore";
import { usePrefsStore } from "../store/usePrefsStore";
import { AVATAR_RINGS, getWallpaperById } from "../constants/personalization";
import { WallpaperPicker } from "../components/WallpaperPicker";
import { Check, Image as ImageIcon, Send, Sparkles } from "lucide-react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const prettyName = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { avatarRing, setAvatarRing, defaultWallpaper } = usePrefsStore();
  const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);
  const isAurora = theme === "business";
  const defaultWallpaperName =
    defaultWallpaper === "custom" ? "Custom" : getWallpaperById(defaultWallpaper).name;

  return (
    <div className="app-aurora min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 pb-16 pt-20">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tightish">Appearance</h2>
            <p className="text-sm text-base-content/55">
              Pick a theme for your chat interface — Aurora Violet is the signature look.
            </p>
          </div>

          {/* Featured Aurora theme */}
          <button
            type="button"
            onClick={() => setTheme("business")}
            className={`glass edge-light flex w-full flex-col gap-4 rounded-3xl p-5 text-left transition-all sm:flex-row sm:items-center sm:justify-between ${
              isAurora ? "ring-2 ring-primary/50" : "hover:ring-1 hover:ring-white/10"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="brand-gradient flex size-12 items-center justify-center rounded-2xl shadow-glow-sm">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Aurora Violet</h3>
                  {isAurora && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      <Check className="size-3" /> Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-base-content/55">
                  Dark glass · violet→indigo accents · 2026 edition
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {["#7c5cff", "#6366f1", "#c084fc", "#15151f"].map((c) => (
                <span
                  key={c}
                  className="size-6 rounded-lg ring-1 ring-white/10"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </button>

          {/* All themes */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-base-content/70">More themes</h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {THEMES.map((t) => (
                <button
                  key={t}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors ${
                    theme === t ? "bg-white/10 ring-1 ring-primary/40" : "hover:bg-white/5"
                  }`}
                  onClick={() => setTheme(t)}
                >
                  <div
                    className="relative h-8 w-full overflow-hidden rounded-lg ring-1 ring-white/5"
                    data-theme={t}
                  >
                    <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                      <div className="rounded bg-primary"></div>
                      <div className="rounded bg-secondary"></div>
                      <div className="rounded bg-accent"></div>
                      <div className="rounded bg-neutral"></div>
                    </div>
                  </div>
                  <span className="w-full truncate text-center text-[11px] font-medium">
                    {prettyName(t)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Personalization */}
          <div className="flex flex-col gap-1 pt-2">
            <h2 className="text-xl font-bold tracking-tightish">Personalization</h2>
            <p className="text-sm text-base-content/55">
              Make GargX yours — animated profile ring and chat wallpapers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Animated profile ring */}
            <div className="glass edge-light rounded-2xl p-5">
              <h3 className="mb-3 text-sm font-semibold">Animated profile ring</h3>
              <div className="flex flex-wrap gap-2">
                {AVATAR_RINGS.map((r) => {
                  const ringClass =
                    r.id !== "none" ? `avatar-ring avatar-ring-${r.id}` : "";
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAvatarRing(r.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl p-2 transition-colors ${
                        avatarRing === r.id ? "bg-white/10 ring-1 ring-primary/40" : "hover:bg-white/5"
                      }`}
                    >
                      <span className={`${ringClass} rounded-full`}>
                        <span className="brand-gradient flex size-10 items-center justify-center rounded-full text-xs font-bold text-white">
                          You
                        </span>
                      </span>
                      <span className="text-[11px] text-base-content/60">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Default chat wallpaper */}
            <div className="glass edge-light flex flex-col justify-between rounded-2xl p-5">
              <div>
                <h3 className="mb-1 text-sm font-semibold">Default chat wallpaper</h3>
                <p className="text-xs text-base-content/50">
                  Applied to chats without their own wallpaper. Set a per-chat one from the chat header.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className="flex h-12 flex-1 items-center rounded-xl border border-white/10 px-3 text-sm"
                  style={defaultWallpaper === "custom" ? {} : getWallpaperById(defaultWallpaper).style}
                >
                  {defaultWallpaperName}
                </span>
                <button
                  type="button"
                  onClick={() => setIsWallpaperOpen(true)}
                  className="btn btn-sm gap-2 rounded-xl border-white/10 bg-white/5"
                >
                  <ImageIcon className="size-4" />
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <h3 className="text-lg font-semibold tracking-tightish">Preview</h3>
          <div className="glass edge-light overflow-hidden rounded-3xl shadow-soft">
            <div className="bg-base-200/30 p-4 sm:p-6">
              <div className="mx-auto max-w-lg">
                <div className="glass-strong overflow-hidden rounded-2xl">
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
                    <div className="accent-gradient flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-primary-content">
                      J
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">John Doe</h3>
                      <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <span className="presence-dot size-1.5 rounded-full" /> Online
                      </p>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="max-h-[220px] min-h-[200px] space-y-3 overflow-y-auto bg-base-200/30 p-4">
                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                            message.isSent
                              ? "accent-gradient rounded-br-md text-primary-content shadow-glow-sm"
                              : "rounded-bl-md border border-white/10 bg-base-100/80 text-base-content"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p
                            className={`mt-1.5 text-[10px] ${
                              message.isSent ? "text-primary-content/70" : "text-base-content/50"
                            }`}
                          >
                            12:00 PM
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="border-t border-white/5 p-4">
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-base-200/60 px-2 py-1.5">
                      <input
                        type="text"
                        className="flex-1 border-0 bg-transparent px-2 text-sm outline-none placeholder:text-base-content/40"
                        placeholder="Type a message…"
                        value="This is a preview"
                        readOnly
                      />
                      <button className="btn btn-primary btn-circle btn-sm">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WallpaperPicker open={isWallpaperOpen} onClose={() => setIsWallpaperOpen(false)} />
    </div>
  );
};
