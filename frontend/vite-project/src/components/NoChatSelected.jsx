import { MessageSquare } from "lucide-react";

export const NoChatSelected = () => {
  return (
    <div className="hidden w-full flex-1 flex-col items-center justify-center bg-base-100/50 p-8 md:flex md:p-16">
      <div className="max-w-md space-y-6 text-center">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce"
            >
              <MessageSquare className="w-8 h-8 text-primary " />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold">Welcome to GargX</h2>
        <p className="text-base-content/60">
          Select a friend or group from the sidebar, or add friends first to create a new group
        </p>
      </div>
    </div>
  );
};
