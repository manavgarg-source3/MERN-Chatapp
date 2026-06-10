import { useEffect, useRef } from "react";
import {
  Circle,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Square,
  Video,
  VideoOff,
} from "lucide-react";
import { useCallStore } from "../store/useCallStore";

const getInitials = (value = "") =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const formatDuration = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const Avatar = ({ peer, ringing }) => (
  <div className={`relative ${ringing ? "animate-call-ring" : ""} rounded-full`}>
    {peer?.profilePic ? (
      <img
        src={peer.profilePic}
        alt={peer.fullName}
        className="size-28 rounded-full object-cover ring-4 ring-white/10"
      />
    ) : (
      <div className="brand-gradient flex size-28 items-center justify-center rounded-full text-3xl font-semibold text-white ring-4 ring-white/10">
        {getInitials(peer?.fullName) || "?"}
      </div>
    )}
  </div>
);

const ControlButton = ({ onClick, active, danger, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`flex size-14 items-center justify-center rounded-full border transition-all active:scale-95 ${
      danger
        ? "border-transparent bg-error text-white hover:brightness-110"
        : active
          ? "border-transparent bg-white text-black"
          : "border-white/15 bg-white/10 text-white hover:bg-white/20"
    }`}
  >
    {children}
  </button>
);

export const CallOverlay = () => {
  const {
    status,
    callType,
    peer,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isRecording,
    isReconnecting,
    durationSec,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleRecording,
  } = useCallStore();

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream, status]);

  useEffect(() => {
    if (localVideoRef.current && localVideoRef.current.srcObject !== localStream) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream, status]);

  if (status === "idle") return null;

  const isVideo = callType === "video";
  const isActive = status === "active";
  const showRemoteVideo = isVideo && isActive && remoteStream;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-xl">
      {/* Remote video (also carries remote audio for voice calls — hidden then) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 h-full w-full bg-black object-cover ${
          showRemoteVideo ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Ambient gradient for non-video states */}
      {!showRemoteVideo && <div className="app-aurora absolute inset-0 -z-0" />}

      {/* Local preview (video only) */}
      {isVideo && localStream && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`absolute bottom-28 right-4 z-20 h-40 w-28 rounded-2xl border border-white/15 object-cover shadow-soft sm:bottom-32 sm:h-48 sm:w-36 ${
            isCameraOff ? "hidden" : ""
          }`}
        />
      )}

      {/* Recording badge */}
      {isRecording && (
        <div className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-full bg-error/90 px-3 py-1.5 text-sm font-medium text-white shadow-lg">
          <span className="size-2.5 animate-pulse rounded-full bg-white" />
          REC
        </div>
      )}

      {/* Center content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center text-white">
        {!showRemoteVideo && (
          <>
            <Avatar peer={peer} ringing={status === "outgoing" || status === "incoming"} />
            <div>
              <h2 className="text-2xl font-bold tracking-tightish">
                {peer?.fullName || "Unknown"}
              </h2>
              <p className={`mt-1 ${isReconnecting ? "text-amber-400" : "text-white/70"}`}>
                {status === "incoming"
                  ? `Incoming ${isVideo ? "video" : "voice"} call…`
                  : status === "outgoing"
                    ? "Calling…"
                    : isReconnecting
                      ? "Reconnecting…"
                      : formatDuration(durationSec)}
              </p>
            </div>
          </>
        )}

        {showRemoteVideo && (
          <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-sm font-medium backdrop-blur">
            {peer?.fullName} · {isReconnecting ? (
              <span className="text-amber-400">Reconnecting…</span>
            ) : (
              formatDuration(durationSec)
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-30 flex flex-col items-center gap-4 px-6 pb-10 pt-4">
        {status === "incoming" ? (
          <div className="flex items-center gap-10">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={rejectCall}
                aria-label="Decline call"
                className="flex size-16 items-center justify-center rounded-full bg-error text-white shadow-lg transition active:scale-95 hover:brightness-110"
              >
                <PhoneOff className="size-7" />
              </button>
              <span className="text-xs text-white/70">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={acceptCall}
                aria-label="Accept call"
                className="flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition active:scale-95 hover:brightness-110"
              >
                {isVideo ? <Video className="size-7" /> : <Phone className="size-7" />}
              </button>
              <span className="text-xs text-white/70">Accept</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4">
            {isActive && (
              <>
                <ControlButton
                  onClick={toggleMute}
                  active={isMuted}
                  label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
                </ControlButton>

                {isVideo && (
                  <ControlButton
                    onClick={toggleCamera}
                    active={isCameraOff}
                    label={isCameraOff ? "Turn camera on" : "Turn camera off"}
                  >
                    {isCameraOff ? (
                      <VideoOff className="size-6" />
                    ) : (
                      <Video className="size-6" />
                    )}
                  </ControlButton>
                )}

                <ControlButton
                  onClick={toggleRecording}
                  active={isRecording}
                  label={isRecording ? "Stop recording" : "Record call"}
                >
                  {isRecording ? (
                    <Square className="size-5" />
                  ) : (
                    <Circle className="size-6" />
                  )}
                </ControlButton>
              </>
            )}

            <button
              type="button"
              onClick={endCall}
              aria-label="End call"
              className="flex size-16 items-center justify-center rounded-full bg-error text-white shadow-lg transition active:scale-95 hover:brightness-110"
            >
              <PhoneOff className="size-7" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
