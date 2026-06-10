import { MessageSquare, Sparkles } from "lucide-react";

export const NoChatSelected = () => {
  return (
    <div className="relative hidden w-full flex-1 flex-col items-center justify-center overflow-hidden bg-base-200/30 p-8 md:flex md:p-16">
      {/* Ambient aurora glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-0 h-72 w-72 -translate-x-1/2 animate-aurora-pulse rounded-full bg-primary/25 blur-[90px]" />

      <div className="relative z-10 max-w-md space-y-6 text-center">
        {/* Icon Display */}
        <div className="mb-2 flex justify-center">
          <div className="relative">
            <div className="brand-gradient flex h-20 w-20 items-center justify-center rounded-[1.6rem] shadow-glow">
              <MessageSquare className="h-9 w-9 text-white" />
            </div>
            <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border border-white/15 bg-base-100 text-accent shadow-soft">
              <Sparkles className="size-3.5" />
            </span>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold tracking-tightish">
          Welcome to <span className="text-gradient">GargX</span>
        </h2>
        <p className="mx-auto max-w-sm text-base-content/55">
          Select a friend or group from the sidebar — or add friends first to spin up a new group.
        </p>

        <div className="flex items-center justify-center gap-2 pt-1 text-xs text-base-content/40">
          <span className="presence-dot size-2 rounded-full" />
          End-to-end realtime messaging
        </div>
      </div>
    </div>
  );
};
