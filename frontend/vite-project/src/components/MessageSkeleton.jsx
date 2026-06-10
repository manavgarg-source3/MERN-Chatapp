export const MessageSkeleton = () => {
    // Create an array of 6 items for skeleton messages
    const skeletonMessages = Array(6).fill(null);
  
    return (
      <div className="flex-1 space-y-4 overflow-y-auto bg-base-200/30 p-4 sm:px-6">
        {skeletonMessages.map((_, idx) => (
          <div key={idx} className={`chat ${idx % 2 === 0 ? "chat-start" : "chat-end"}`}>
            <div className="chat-image avatar">
              <div className="size-10 overflow-hidden rounded-2xl">
                <div className="skeleton h-full w-full rounded-2xl" />
              </div>
            </div>

            <div className="chat-header mb-1">
              <div className="skeleton h-3 w-16 rounded-lg" />
            </div>

            <div className="chat-bubble bg-transparent p-0">
              <div className="skeleton h-16 w-[200px] rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  