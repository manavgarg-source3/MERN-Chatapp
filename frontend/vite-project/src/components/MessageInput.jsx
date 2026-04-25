import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import {
  FileText,
  LoaderCircle,
  Mic,
  Music,
  Paperclip,
  Send,
  Square,
  Video,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const SUPPORTED_ATTACHMENT_TYPES =
  "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar";

const getAttachmentKind = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";

  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar)$/i.test(file.name)) {
    return "document";
  }

  return "document";
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsDataURL(file);
  });

export const MessageInput = () => {
  const [text, setText] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const { sendMessage, sendTypingStatus, selectedChat } = useChatStore();

  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new window.Image();

        image.onload = () => {
          const maxWidth = 1440;
          const maxHeight = 1440;
          let { width, height } = image;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };

        image.onerror = () => reject(new Error("Image processing failed"));
        image.src = reader.result;
      };

      reader.onerror = () => reject(new Error("Image reading failed"));
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current?.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      sendTypingStatus(false);
    };
  }, [selectedChat?._id, sendTypingStatus]);

  useEffect(() => {
    return () => {
      if (selectedAttachment?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedAttachment.previewUrl);
      }
    };
  }, [selectedAttachment]);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (!value.trim()) {
      sendTypingStatus(false);
      return;
    }

    sendTypingStatus(true);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 1200);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Please choose a file smaller than 15MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const attachmentKind = getAttachmentKind(file);
      const attachmentData =
        attachmentKind === "image" ? await compressImage(file) : await readFileAsDataUrl(file);
      const previewUrl =
        attachmentKind === "image" ||
        attachmentKind === "video" ||
        attachmentKind === "audio"
          ? URL.createObjectURL(file)
          : null;

      setSelectedAttachment((currentAttachment) => {
        if (currentAttachment?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(currentAttachment.previewUrl);
        }

        return {
          data: attachmentData,
          previewUrl,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          kind: attachmentKind,
        };
      });
    } catch {
      toast.error("Could not process file");
    }
  };

  const removeAttachment = () => {
    if (selectedAttachment?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedAttachment.previewUrl);
    }

    setSelectedAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatRecordingDuration = (durationInSeconds) => {
    const minutes = Math.floor(durationInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (durationInSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  };

  const stopActiveRecordingTracks = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice recording is not supported on this device");
      return;
    }

    try {
      if (selectedAttachment) {
        removeAttachment();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }

        setIsRecording(false);

        if (!chunks.length) {
          stopActiveRecordingTracks();
          return;
        }

        const audioBlob = new Blob(chunks, {
          type: (mediaRecorder.mimeType || "audio/webm").split(";")[0],
        });
        const extension = audioBlob.type.includes("mp4") ? "m4a" : "webm";
        const previewUrl = URL.createObjectURL(audioBlob);
        const attachmentData = await readFileAsDataUrl(audioBlob);

        setSelectedAttachment((currentAttachment) => {
          if (currentAttachment?.previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(currentAttachment.previewUrl);
          }

          return {
            data: attachmentData,
            previewUrl,
            fileName: `voice-note-${Date.now()}.${extension}`,
            mimeType: audioBlob.type || "audio/webm",
            kind: "audio",
          };
        });

        setRecordingDuration(0);
        stopActiveRecordingTracks();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingDuration(0);
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((currentValue) => currentValue + 1);
      }, 1000);
    } catch (error) {
      stopActiveRecordingTracks();
      toast.error("Could not access microphone");
      console.error("Voice recording error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      stopActiveRecordingTracks();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedAttachment) return;

    try {
      setIsSending(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);

      await sendMessage({
        text: text.trim(),
        attachment: selectedAttachment,
      });

      setText("");
      removeAttachment();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const renderAttachmentPreview = () => {
    if (!selectedAttachment) return null;

    if (selectedAttachment.kind === "image") {
      return (
        <img
          src={selectedAttachment.previewUrl || selectedAttachment.data}
          alt="Preview"
          className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
        />
      );
    }

    if (selectedAttachment.kind === "video") {
      return (
        <video
          src={selectedAttachment.previewUrl}
          className="w-28 h-20 rounded-lg border border-zinc-700 object-cover"
          muted
        />
      );
    }

    if (selectedAttachment.kind === "audio") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-base-300 bg-base-200 px-3 py-2">
          <Music className="size-4 text-primary" />
          <span className="max-w-40 truncate text-sm">{selectedAttachment.fileName}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 rounded-lg border border-base-300 bg-base-200 px-3 py-2">
        <FileText className="size-4 text-primary" />
        <span className="max-w-40 truncate text-sm">{selectedAttachment.fileName}</span>
      </div>
    );
  };

  const attachmentIcon =
    selectedAttachment?.kind === "video" ? (
      <Video size={18} />
    ) : selectedAttachment?.kind === "audio" ? (
      <Music size={18} />
    ) : selectedAttachment?.kind === "document" ? (
      <FileText size={18} />
    ) : (
      <Paperclip size={18} />
    );

  return (
    <div className="w-full border-t border-base-300 bg-base-100 p-3 sm:p-4">
      {selectedAttachment && (
        <div className="mb-3 flex items-center gap-2 overflow-x-auto">
          <div className="relative">
            {renderAttachmentPreview()}
            <button
              onClick={removeAttachment}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-end gap-2">
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            className="min-h-[44px] w-full input input-bordered rounded-2xl px-4 text-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
            disabled={isSending || isRecording}
          />
          <input
            type="file"
            accept={SUPPORTED_ATTACHMENT_TYPES}
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isSending || isRecording}
          />

          <button
            type="button"
            className={`btn btn-circle btn-sm sm:btn-md ${
              selectedAttachment ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isRecording}
            aria-label="Attach file"
          >
            {attachmentIcon}
          </button>

          <button
            type="button"
            className={`btn btn-circle btn-sm sm:btn-md ${
              isRecording ? "btn-error text-white" : "text-zinc-400"
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending}
            aria-label={isRecording ? "Stop recording" : "Record voice note"}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-sm btn-circle min-h-[44px] min-w-[44px] sm:btn-md"
          disabled={isSending || isRecording || (!text.trim() && !selectedAttachment)}
        >
          {isSending ? <LoaderCircle size={20} className="animate-spin" /> : <Send size={22} />}
        </button>
      </form>

      {isRecording && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-error/10 px-3 py-2 text-sm text-error">
          <span className="size-2 rounded-full bg-error animate-pulse" />
          <span>Recording voice note... {formatRecordingDuration(recordingDuration)}</span>
        </div>
      )}
    </div>
  );
};
