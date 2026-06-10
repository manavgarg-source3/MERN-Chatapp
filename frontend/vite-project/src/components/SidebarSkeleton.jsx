import { Users } from "lucide-react";

export const SidebarSkeleton = () => {
  // Create 8 skeleton items
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside className="flex h-full w-full flex-col border-r border-white/5 transition-all duration-200 md:w-80 lg:w-96">
      {/* Header */}
      <div className="w-full border-b border-white/5 p-5">
        <div className="flex items-center gap-2.5">
          <div className="brand-gradient-soft flex size-8 items-center justify-center rounded-xl border border-white/10">
            <Users className="size-4 text-primary" />
          </div>
          <span className="font-semibold">Messages</span>
        </div>
      </div>

      {/* Skeleton Contacts */}
      <div className="w-full overflow-y-auto px-2 py-3">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="flex w-full items-center gap-3 p-2.5">
            {/* Avatar skeleton */}
            <div className="relative">
              <div className="skeleton size-12 rounded-2xl" />
            </div>

            {/* User info skeleton */}
            <div className="min-w-0 flex-1 text-left">
              <div className="skeleton mb-2 h-4 w-32 rounded-lg" />
              <div className="skeleton h-3 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

