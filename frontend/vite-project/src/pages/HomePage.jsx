import React from 'react'
import { useChatStore } from '../store/useChatStore'
import { Sidebar } from '../components/Sidebar';
import { NoChatSelected } from '../components/NoChatSelected';
import { ChatContainer } from '../components/ChatContainer';


export const HomePage = () => {
  const { selectedChat } = useChatStore();

  return (
    <div className="min-h-screen bg-base-200 pt-16">
      <div className="h-[calc(100dvh-4rem)] px-0 sm:px-4 sm:py-4">
        <div className="h-full w-full bg-base-100 sm:rounded-3xl sm:shadow-xl sm:ring-1 sm:ring-base-300/60 sm:max-w-6xl sm:mx-auto">
          <div className="flex h-full overflow-hidden sm:rounded-3xl">
            <div className={`${selectedChat ? "hidden md:flex" : "flex"} h-full w-full md:w-auto`}>
              <Sidebar />
            </div>

            <div className={`${selectedChat ? "flex" : "hidden md:flex"} min-w-0 flex-1 h-full`}>
              {!selectedChat ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
