import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronRight,
  Download,
  Ellipsis,
  ExternalLink,
  FileText,
  LoaderCircle,
  Music,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageSkeleton } from "./MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const getMessageAttachment = (message) => {
  if (message.attachment?.url) {
    return message.attachment;
  }

  if (message.image) {
    return {
      url: message.image,
      kind: "image",
      fileName: "image",
      mimeType: "image/jpeg",
    };
  }

  return null;
};

const openFileInNewTab = (fileUrl) => {
  const link = document.createElement("a");
  link.href = fileUrl;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const getAttachmentLabel = (attachment) => {
  if (attachment.kind === "video") return "Video";
  if (attachment.kind === "audio") return "Audio";
  if (attachment.kind === "document") return "Document";
  return "Image";
};

const getSenderDetails = (message, authUser) => {
  const sender = message.senderId;

  if (sender && typeof sender === "object" && sender._id) {
    return sender;
  }

  if (String(sender) === String(authUser._id)) {
    return authUser;
  }

  return null;
};

const getReadByEntries = (message, authUser) =>
  (message.readBy || []).filter(
    (entry) => String(entry.userId?._id || entry.userId) !== String(authUser._id)
  );

const GroupMessageAvatar = ({ sender, fallbackIcon = false }) => (
  <div className="size-10 rounded-full border border-base-300">
    {sender?.profilePic ? (
      <img
        src={sender.profilePic}
        alt={sender.fullName || "Member"}
        className="size-10 rounded-full object-cover"
      />
    ) : (
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {fallbackIcon ? (
          <Users className="size-4" />
        ) : (
          sender?.fullName?.charAt(0)?.toUpperCase() || "U"
        )}
      </div>
    )}
  </div>
);

export const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedChat,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
    markGroupMessagesAsRead,
    setActiveConversation,
    deleteDirectMessageForEveryone,
    deleteDirectMessageForMe,
    deleteGroupMessageForEveryone,
    adminDeleteGroupMessage,
    activeDeletingMessageId,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedSeenByMessage, setSelectedSeenByMessage] = useState(null);
  const [selectedMessageMenu, setSelectedMessageMenu] = useState(null);

  const downloadFile = async (fileUrl, fileName = "attachment") => {
    const link = document.createElement("a");
    link.download = fileName;

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      openFileInNewTab(fileUrl);
    }
  };

  useEffect(() => {
    if (!selectedChat?._id) return undefined;

    getMessages(selectedChat);

    if (selectedChat.type === "direct") {
      markMessagesAsRead(selectedChat._id);
    } else {
      markGroupMessagesAsRead(selectedChat._id);
    }

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [
    selectedChat,
    getMessages,
    markMessagesAsRead,
    markGroupMessagesAsRead,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (!selectedChat?._id || selectedChat.type !== "direct") return undefined;

    const syncActiveConversation = () => {
      if (document.visibilityState === "visible") {
        setActiveConversation(selectedChat._id);
        markMessagesAsRead(selectedChat._id);
      } else {
        setActiveConversation(null);
      }
    };

    syncActiveConversation();
    window.addEventListener("focus", syncActiveConversation);
    document.addEventListener("visibilitychange", syncActiveConversation);

    return () => {
      window.removeEventListener("focus", syncActiveConversation);
      document.removeEventListener("visibilitychange", syncActiveConversation);
      setActiveConversation(null);
    };
  }, [selectedChat?._id, selectedChat?.type, setActiveConversation, markMessagesAsRead]);

  useEffect(() => {
    if (!selectedChat?._id || selectedChat.type !== "group") return undefined;

    const syncGroupReadState = () => {
      if (document.visibilityState === "visible") {
        markGroupMessagesAsRead(selectedChat._id);
      }
    };

    syncGroupReadState();
    window.addEventListener("focus", syncGroupReadState);
    document.addEventListener("visibilitychange", syncGroupReadState);

    return () => {
      window.removeEventListener("focus", syncGroupReadState);
      document.removeEventListener("visibilitychange", syncGroupReadState);
    };
  }, [selectedChat?._id, selectedChat?.type, markGroupMessagesAsRead]);

  useEffect(() => {
    if (selectedChat?.type !== "direct") {
      setActiveConversation(null);
    }
  }, [selectedChat?.type, setActiveConversation]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleCloseMenus = () => {
      setSelectedMessageMenu(null);
    };

    document.addEventListener("click", handleCloseMenus);
    return () => document.removeEventListener("click", handleCloseMenus);
  }, []);

  const renderAttachment = (message) => {
    const attachment = getMessageAttachment(message);
    if (!attachment) return null;

    if (attachment.kind === "image") {
      return (
        <button
          type="button"
          className={`mb-2 block ${message.status === "sending" ? "opacity-80" : ""}`}
          onClick={() => setPreviewImage(attachment.url)}
          disabled={message.status === "sending"}
        >
          <div className="relative">
            <img
              src={attachment.url}
              alt={attachment.fileName || "Attachment"}
              className="max-h-72 w-full max-w-[260px] rounded-md object-cover"
            />
            {message.status === "sending" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/35">
                <LoaderCircle className="size-5 animate-spin text-white" />
              </div>
            )}
          </div>
        </button>
      );
    }

    if (attachment.kind === "video") {
      return (
        <div className="mb-2">
          <div className="relative">
            <video
              src={attachment.url}
              controls
              className="max-h-72 w-full max-w-[260px] rounded-md object-cover"
            />
            {message.status === "sending" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/35">
                <LoaderCircle className="size-5 animate-spin text-white" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (attachment.kind === "audio") {
      return (
        <div className="mb-2 rounded-lg bg-base-200 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Music className="size-4 text-primary" />
            <span className="max-w-[220px] truncate text-sm font-medium">
              {attachment.fileName || "Audio message"}
            </span>
            {message.status === "sending" && (
              <LoaderCircle className="ml-auto size-4 animate-spin text-zinc-400" />
            )}
          </div>
          <audio controls src={attachment.url} className="max-w-[240px]" />
        </div>
      );
    }

    return (
      <div className="mb-2 flex max-w-[260px] items-start gap-3 rounded-lg bg-base-200 p-3">
        <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment.fileName || "Document"}</p>
          <p className="text-xs text-base-content/60">{getAttachmentLabel(attachment)}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              onClick={() => openFileInNewTab(attachment.openUrl || attachment.url)}
              disabled={message.status === "sending"}
            >
              <ExternalLink className="size-3" />
              Open
            </button>
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              onClick={() =>
                downloadFile(attachment.downloadUrl || attachment.url, attachment.fileName)
              }
              disabled={message.status === "sending"}
            >
              <Download className="size-3" />
              Download
            </button>
            {message.status === "sending" && (
              <LoaderCircle className="ml-auto size-4 animate-spin text-zinc-400" />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isMessagesLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => {
          const sender = getSenderDetails(message, authUser);
          const senderId = sender?._id || message.senderId;
          const isOwnMessage = String(senderId) === String(authUser._id);
          const readByEntries =
            selectedChat?.type === "group" && isOwnMessage
              ? getReadByEntries(message, authUser)
              : [];
          const canDeleteFromMe =
            selectedChat?.type === "direct" &&
            isOwnMessage &&
            !message.deletedForEveryone &&
            message.status !== "sending";
          const canDeleteFromEveryone =
            canDeleteFromMe && !message.readAt;
          const canOpenSeenBy =
            selectedChat?.type === "group" &&
            isOwnMessage &&
            !message.deletedForEveryone &&
            readByEntries.length > 0;
          const canDeleteGroupFromEveryone =
            selectedChat?.type === "group" &&
            isOwnMessage &&
            !message.deletedForEveryone &&
            message.status !== "sending";
          const canAdminDeleteGroupMessage =
            selectedChat?.type === "group" &&
            selectedChat?.isAdmin &&
            !isOwnMessage &&
            !message.deletedForEveryone &&
            message.status !== "sending";
          const hasBubbleMenu =
            canDeleteFromMe ||
            canOpenSeenBy ||
            canDeleteGroupFromEveryone ||
            canAdminDeleteGroupMessage;
          const isMessageMenuOpen = selectedMessageMenu === message._id;
          const isDeletingThisMessage =
            String(activeDeletingMessageId) === String(message._id);

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <GroupMessageAvatar
                  sender={sender}
                  fallbackIcon={selectedChat?.type === "group" && !sender}
                />
              </div>

              <div className="chat-header mb-1 ml-1 flex items-center gap-1 text-xs opacity-70">
                {selectedChat?.type === "group" && !isOwnMessage && (
                  <span className="font-medium opacity-90">{sender?.fullName || "Member"}</span>
                )}
                <time className="ml-1 opacity-70">{formatMessageTime(message.createdAt)}</time>
                {selectedChat?.type === "direct" && isOwnMessage && (
                  <>
                    {message.status === "sending" ? (
                      <LoaderCircle className="size-4 animate-spin text-zinc-400" />
                    ) : message.readAt ? (
                      <CheckCheck className="size-4 text-sky-400" />
                    ) : message.deliveredAt ? (
                      <CheckCheck className="size-4 text-zinc-400" />
                    ) : (
                      <Check className="size-4 text-zinc-400" />
                    )}
                  </>
                )}
              </div>

              <div className="group/message relative">
                {hasBubbleMenu && (
                  <>
                    <button
                      type="button"
                      className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-base-100/90 text-base-content/70 shadow-sm transition-all duration-150 hover:bg-base-100 focus-visible:opacity-100 md:opacity-0 md:group-hover/message:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMessageMenu((currentValue) =>
                          currentValue === message._id ? null : message._id
                        );
                      }}
                      aria-label="Message options"
                    >
                      <Ellipsis className="size-3 shrink-0" />
                    </button>

                    {isMessageMenuOpen && (
                      <div
                        className={`absolute top-11 z-20 w-52 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl ${
                          isOwnMessage ? "right-2" : "left-2"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canOpenSeenBy && (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-base-200"
                            onClick={() => {
                              setSelectedSeenByMessage({
                                messageId: message._id,
                                readByEntries,
                              });
                              setSelectedMessageMenu(null);
                            }}
                          >
                            <ChevronRight className="size-4" />
                            Seen by
                          </button>
                        )}

                        {canDeleteFromMe && (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-base-200"
                            disabled={isDeletingThisMessage}
                            onClick={async () => {
                              try {
                                await deleteDirectMessageForMe(message._id);
                                setSelectedMessageMenu(null);
                              } catch (error) {
                                return error;
                              }
                            }}
                          >
                            {isDeletingThisMessage ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            Delete from me
                          </button>
                        )}

                        {canDeleteFromEveryone && (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-error/10"
                            disabled={isDeletingThisMessage}
                            onClick={async () => {
                              try {
                                await deleteDirectMessageForEveryone(message._id);
                                setSelectedMessageMenu(null);
                              } catch (error) {
                                return error;
                              }
                            }}
                          >
                            {isDeletingThisMessage ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            Delete from both
                          </button>
                        )}

                        {canDeleteGroupFromEveryone && (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-error/10"
                            disabled={isDeletingThisMessage}
                            onClick={async () => {
                              try {
                                await deleteGroupMessageForEveryone(message._id);
                                setSelectedMessageMenu(null);
                              } catch (error) {
                                return error;
                              }
                            }}
                          >
                            {isDeletingThisMessage ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            Delete from everyone
                          </button>
                        )}

                        {canAdminDeleteGroupMessage && (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-error/10"
                            disabled={isDeletingThisMessage}
                            onClick={async () => {
                              try {
                                await adminDeleteGroupMessage(message._id);
                                setSelectedMessageMenu(null);
                              } catch (error) {
                                return error;
                              }
                            }}
                          >
                            {isDeletingThisMessage ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            Delete by admin
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div
                  className={`chat-bubble flex flex-col ${
                    hasBubbleMenu
                      ? "pr-10"
                      : ""
                  }`}
                >
                  {renderAttachment(message)}
                  {message.text && (
                    <p
                      className={
                        message.deletedForEveryone
                          ? "italic text-base-content/65"
                          : ""
                      }
                    >
                      {message.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />

      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 p-4">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              type="button"
              className="btn btn-circle btn-sm"
              onClick={() => downloadFile(previewImage, `attachment-${Date.now()}`)}
              aria-label="Download image"
            >
              <Download className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-circle btn-sm"
              onClick={() => setPreviewImage(null)}
              aria-label="Close preview"
            >
              <X className="size-4" />
            </button>
          </div>
          <button
            type="button"
            className="flex h-full w-full items-center justify-center"
            onClick={() => setPreviewImage(null)}
            aria-label="Close preview"
          >
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[88vh] max-w-full rounded-md object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </button>
        </div>
      )}

      {selectedSeenByMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-base-300 bg-base-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
              <div>
                <h3 className="font-semibold">Seen By</h3>
                <p className="text-sm text-base-content/60">
                  {selectedSeenByMessage.readByEntries.length} member
                  {selectedSeenByMessage.readByEntries.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-circle btn-sm"
                onClick={() => setSelectedSeenByMessage(null)}
                aria-label="Close seen by list"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {selectedSeenByMessage.readByEntries.map((entry) => (
                  <div
                    key={entry.userId?._id || entry.userId}
                    className="flex items-center gap-3 rounded-2xl border border-base-300 p-3"
                  >
                    <img
                      src={entry.userId?.profilePic || "/avatar.png"}
                      alt={entry.userId?.fullName || "Member"}
                      className="size-11 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{entry.userId?.fullName || "Member"}</p>
                      <p className="text-sm text-base-content/60">
                        Seen at {formatMessageTime(entry.readAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
