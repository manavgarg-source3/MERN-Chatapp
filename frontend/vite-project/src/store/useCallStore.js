import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

/**
 * 1:1 WebRTC calling.
 *
 * The store holds UI-facing state (status, streams, toggles). The non-reactive
 * WebRTC plumbing (RTCPeerConnection, buffered ICE candidates, recorder, audio
 * graph, ringtone, timer) lives in the module-level `engine` object so it never
 * triggers re-renders. Signaling is relayed by the server (see backend
 * lib/call.js); media is pure peer-to-peer over Google STUN.
 */

// ICE servers: STUN finds your public address; TURN relays media when a direct
// P2P path is impossible (strict/symmetric NAT on corporate/cellular networks).
// Defaults include free best-effort public servers. For guaranteed reliability,
// drop your own TURN creds (e.g. free metered.ca, 50GB/mo) into the frontend env:
//   VITE_TURN_URLS="turn:your.turn:3478,turns:your.turn:5349"
//   VITE_TURN_USERNAME="..."  VITE_TURN_CREDENTIAL="..."
const buildIceServers = () => {
  const servers = [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
    // Free best-effort public TURN (Open Relay). Works for many cross-NAT cases.
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ];

  const envUrls = import.meta.env.VITE_TURN_URLS;
  if (envUrls) {
    servers.push({
      urls: envUrls
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean),
      username: import.meta.env.VITE_TURN_USERNAME || undefined,
      credential: import.meta.env.VITE_TURN_CREDENTIAL || undefined,
    });
  }

  return servers;
};

const ICE_SERVERS = buildIceServers();

const PC_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

// Mic with browser DSP: echo cancellation + background-noise suppression + AGC.
const buildMediaConstraints = (callType) => ({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video:
    callType === "video"
      ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
      : false,
});

const engine = {
  pc: null,
  pendingOffer: null, // remote SDP offer awaiting accept (callee side)
  remoteCandidates: [], // ICE that arrived before remoteDescription was set
  localCandidates: [], // ICE generated before we learned the callId (caller side)
  recorder: null,
  recordedChunks: [],
  audioCtx: null,
  ring: null, // ringtone controller
  timer: null,
  recoveryTimer: null, // pending ICE-restart attempt on a flaky connection
};

const getSocket = () => useAuthStore.getState().socket;

const emit = (event, payload) => {
  const socket = getSocket();
  if (socket?.connected) socket.emit(event, payload);
};

/* ---------------- Ringtone (WebAudio, no asset needed) ---------------- */
const startRingtone = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 480;
    osc.connect(gain);
    osc.start();

    let on = false;
    const pulse = setInterval(() => {
      on = !on;
      gain.gain.setTargetAtTime(on ? 0.08 : 0, ctx.currentTime, 0.02);
    }, 600);

    engine.ring = {
      stop: () => {
        clearInterval(pulse);
        try {
          osc.stop();
          ctx.close();
        } catch {
          /* noop */
        }
      },
    };
  } catch {
    /* ringtone is best-effort */
  }
};

const stopRingtone = () => {
  engine.ring?.stop();
  engine.ring = null;
};

/* ---------------- Teardown ---------------- */
const teardown = () => {
  stopRingtone();
  if (engine.timer) {
    clearInterval(engine.timer);
    engine.timer = null;
  }
  if (engine.recoveryTimer) {
    clearTimeout(engine.recoveryTimer);
    engine.recoveryTimer = null;
  }
  // stop recording (finalizes download via recorder.onstop)
  if (engine.recorder && engine.recorder.state !== "inactive") {
    try {
      engine.recorder.stop();
    } catch {
      /* noop */
    }
  }
  engine.recorder = null;

  const { localStream, remoteStream } = useCallStore.getState();
  localStream?.getTracks().forEach((t) => t.stop());
  remoteStream?.getTracks().forEach((t) => t.stop());

  if (engine.pc) {
    engine.pc.onicecandidate = null;
    engine.pc.ontrack = null;
    engine.pc.onconnectionstatechange = null;
    try {
      engine.pc.close();
    } catch {
      /* noop */
    }
  }
  engine.pc = null;
  engine.pendingOffer = null;
  engine.remoteCandidates = [];
  engine.localCandidates = [];

  if (engine.audioCtx) {
    try {
      engine.audioCtx.close();
    } catch {
      /* noop */
    }
    engine.audioCtx = null;
  }
};

export const useCallStore = create((set, get) => ({
  status: "idle", // idle | outgoing | incoming | active
  callId: null,
  callType: "audio", // audio | video
  peer: null, // { _id, fullName, profilePic }
  isCaller: false, // the offerer drives ICE-restart renegotiation
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  isRecording: false,
  isReconnecting: false,
  durationSec: 0,

  /* ---- build the RTCPeerConnection and wire its events ---- */
  _createPeer: () => {
    const pc = new RTCPeerConnection(PC_CONFIG);

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const { callId } = get();
      if (callId) {
        emit("call:ice", { callId, candidate: event.candidate });
      } else {
        // caller generated ICE before the server assigned a callId — buffer it
        engine.localCandidates.push(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) set({ remoteStream: stream });
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;

      if (state === "connected") {
        if (engine.recoveryTimer) {
          clearTimeout(engine.recoveryTimer);
          engine.recoveryTimer = null;
        }
        set({ isReconnecting: false });
        return;
      }

      // "disconnected" is often transient (e.g. Wi-Fi → cellular). Try to heal
      // via an ICE restart (driven by the caller) before giving up.
      if (state === "disconnected" || state === "failed") {
        if (get().status !== "active") return;
        set({ isReconnecting: true });

        if (engine.recoveryTimer) return; // already scheduled
        const delay = state === "failed" ? 0 : 2500;
        engine.recoveryTimer = setTimeout(() => {
          engine.recoveryTimer = null;
          const cs = engine.pc?.connectionState;
          if (cs === "connected" || cs === "completed") {
            set({ isReconnecting: false });
            return;
          }
          if (get().isCaller) {
            get()._restartIce();
          }
          // final safety net: if still broken a while later, end the call
          engine.recoveryTimer = setTimeout(() => {
            engine.recoveryTimer = null;
            const finalState = engine.pc?.connectionState;
            if (finalState && finalState !== "connected" && finalState !== "completed") {
              toast.error("Lost connection");
              get().endCall();
            } else {
              set({ isReconnecting: false });
            }
          }, 8000);
        }, delay);
      }
    };

    engine.pc = pc;
    return pc;
  },

  // Caller-driven ICE restart: renegotiate a fresh set of candidates on the
  // existing connection without dropping the call.
  _restartIce: async () => {
    const pc = engine.pc;
    if (!pc) return;
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      emit("call:renegotiate", { callId: get().callId, sdp: pc.localDescription });
    } catch (error) {
      console.error("ICE restart failed:", error);
    }
  },

  _startTimer: () => {
    if (engine.timer) clearInterval(engine.timer);
    set({ durationSec: 0 });
    engine.timer = setInterval(() => {
      set((s) => ({ durationSec: s.durationSec + 1 }));
    }, 1000);
  },

  _flushRemoteCandidates: async () => {
    const pc = engine.pc;
    if (!pc) return;
    const buffered = engine.remoteCandidates;
    engine.remoteCandidates = [];
    for (const candidate of buffered) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* ignore late/duplicate candidates */
      }
    }
  },

  /* ---------------- Caller ---------------- */
  startCall: async (targetUser, callType = "audio") => {
    if (get().status !== "idle") return;
    if (!targetUser?._id) return;

    const socket = getSocket();
    if (!socket?.connected) {
      toast.error("You're offline — can't start a call");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        buildMediaConstraints(callType)
      );

      set({
        status: "outgoing",
        callType,
        peer: targetUser,
        isCaller: true,
        localStream: stream,
        isMuted: false,
        isCameraOff: false,
        isReconnecting: false,
      });

      const pc = get()._createPeer();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      emit("call:offer", {
        toUserId: targetUser._id,
        callType,
        sdp: pc.localDescription,
      });
    } catch (error) {
      console.error("startCall error:", error);
      toast.error(
        error?.name === "NotAllowedError"
          ? "Allow microphone/camera access to call"
          : "Could not start the call"
      );
      teardown();
      set({ status: "idle", peer: null, localStream: null, remoteStream: null });
    }
  },

  /* ---------------- Callee ---------------- */
  acceptCall: async () => {
    const { status, callType } = get();
    if (status !== "incoming" || !engine.pendingOffer) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        buildMediaConstraints(callType)
      );

      set({
        localStream: stream,
        isCaller: false,
        isMuted: false,
        isCameraOff: false,
        isReconnecting: false,
      });

      const pc = get()._createPeer();
      await pc.setRemoteDescription(engine.pendingOffer);
      engine.pendingOffer = null;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      emit("call:answer", { callId: get().callId, sdp: pc.localDescription });

      await get()._flushRemoteCandidates();

      stopRingtone();
      set({ status: "active" });
      get()._startTimer();
    } catch (error) {
      console.error("acceptCall error:", error);
      toast.error(
        error?.name === "NotAllowedError"
          ? "Allow microphone/camera access to answer"
          : "Could not answer the call"
      );
      get().rejectCall();
    }
  },

  rejectCall: () => {
    const { callId } = get();
    if (callId) emit("call:reject", { callId });
    teardown();
    set({ status: "idle", callId: null, peer: null, localStream: null, remoteStream: null });
  },

  endCall: () => {
    const { callId, status } = get();
    if (status === "idle") return;
    if (callId) emit("call:end", { callId });
    teardown();
    set({
      status: "idle",
      callId: null,
      peer: null,
      isCaller: false,
      localStream: null,
      remoteStream: null,
      isRecording: false,
      isReconnecting: false,
      durationSec: 0,
    });
  },

  /* ---------------- In-call controls ---------------- */
  toggleMute: () => {
    const { localStream, isMuted } = get();
    const next = !isMuted;
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !next));
    set({ isMuted: next });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff, callType } = get();
    if (callType !== "video") return;
    const next = !isCameraOff;
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !next));
    set({ isCameraOff: next });
  },

  toggleRecording: () => {
    const { isRecording } = get();
    if (isRecording) {
      if (engine.recorder && engine.recorder.state !== "inactive") {
        engine.recorder.stop();
      }
      set({ isRecording: false });
      return;
    }

    const { localStream, remoteStream, callType, peer } = get();
    if (!localStream) return;

    try {
      // Mix both participants' audio into one track via WebAudio
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new Ctx();
      engine.audioCtx = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();

      [localStream, remoteStream].forEach((stream) => {
        const audioTrack = stream?.getAudioTracks?.()[0];
        if (audioTrack) {
          const src = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
          src.connect(dest);
        }
      });

      const tracks = [...dest.stream.getAudioTracks()];
      // For video calls, capture the remote participant's video
      const remoteVideo = callType === "video" ? remoteStream?.getVideoTracks?.()[0] : null;
      if (remoteVideo) tracks.push(remoteVideo);

      const mixed = new MediaStream(tracks);

      const candidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "audio/webm",
      ];
      const mimeType =
        candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";

      const recorder = mimeType
        ? new MediaRecorder(mixed, { mimeType })
        : new MediaRecorder(mixed);

      engine.recordedChunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) engine.recordedChunks.push(e.data);
      };
      recorder.onstop = () => {
        const isVideo = recorder.mimeType?.startsWith("video");
        const blob = new Blob(engine.recordedChunks, {
          type: recorder.mimeType || (isVideo ? "video/webm" : "audio/webm"),
        });
        engine.recordedChunks = [];
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const stamp = new Date().toISOString().replace(/[:.]/g, "-");
          const who = (peer?.fullName || "call").replace(/\s+/g, "-").toLowerCase();
          a.href = url;
          a.download = `gargx-call-${who}-${stamp}.${isVideo ? "webm" : "webm"}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          toast.success("Recording saved");
        }
        if (engine.audioCtx) {
          try {
            engine.audioCtx.close();
          } catch {
            /* noop */
          }
          engine.audioCtx = null;
        }
      };

      engine.recorder = recorder;
      recorder.start(1000);
      set({ isRecording: true });
      toast.success("Recording started");
    } catch (error) {
      console.error("recording error:", error);
      toast.error("Could not start recording");
      set({ isRecording: false });
    }
  },

  /* ---------------- Socket event wiring (called once from App) ---------------- */
  bindSocketEvents: (socket) => {
    if (!socket) return () => {};

    const onIncoming = ({ callId, from, callType, sdp }) => {
      // Already busy on this client → auto-decline so the caller gets a clean signal
      if (get().status !== "idle") {
        socket.emit("call:reject", { callId });
        return;
      }
      engine.pendingOffer = sdp;
      set({ status: "incoming", callId, callType, peer: from });
      startRingtone();
    };

    const onRinging = ({ callId }) => {
      if (get().status !== "outgoing") return;
      set({ callId });
      // flush ICE candidates that were generated before we knew the callId
      const buffered = engine.localCandidates;
      engine.localCandidates = [];
      buffered.forEach((candidate) => socket.emit("call:ice", { callId, candidate }));
    };

    const onAnswered = async ({ callId, sdp }) => {
      if (get().callId !== callId || !engine.pc) return;
      try {
        await engine.pc.setRemoteDescription(sdp);
        await get()._flushRemoteCandidates();
        stopRingtone();
        set({ status: "active" });
        get()._startTimer();
      } catch (error) {
        console.error("onAnswered error:", error);
        get().endCall();
      }
    };

    const onIce = async ({ callId, candidate }) => {
      if (get().callId !== callId) return;
      const pc = engine.pc;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          /* ignore */
        }
      } else {
        engine.remoteCandidates.push(candidate);
      }
    };

    // Caller's ICE-restart offer arrives here (receiver answers it)
    const onRenegotiate = async ({ callId, sdp }) => {
      if (get().callId !== callId || !engine.pc) return;
      try {
        await engine.pc.setRemoteDescription(sdp);
        const answer = await engine.pc.createAnswer();
        await engine.pc.setLocalDescription(answer);
        socket.emit("call:renegotiate-answer", { callId, sdp: engine.pc.localDescription });
      } catch (error) {
        console.error("onRenegotiate error:", error);
      }
    };

    const onRenegotiateAnswer = async ({ callId, sdp }) => {
      if (get().callId !== callId || !engine.pc) return;
      try {
        await engine.pc.setRemoteDescription(sdp);
      } catch (error) {
        console.error("onRenegotiateAnswer error:", error);
      }
    };

    const onRejected = () => {
      stopRingtone();
      toast("Call declined", { icon: "📵" });
      teardown();
      set({ status: "idle", callId: null, peer: null, localStream: null, remoteStream: null });
    };

    const onUnavailable = ({ reason }) => {
      stopRingtone();
      toast.error(reason === "busy" ? "User is on another call" : "User is offline");
      teardown();
      set({ status: "idle", callId: null, peer: null, localStream: null, remoteStream: null });
    };

    const onEnded = () => {
      stopRingtone();
      const wasActive = get().status === "active";
      teardown();
      set({
        status: "idle",
        callId: null,
        peer: null,
        localStream: null,
        remoteStream: null,
        isRecording: false,
        durationSec: 0,
      });
      if (wasActive) toast("Call ended", { icon: "👋" });
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:ringing", onRinging);
    socket.on("call:answered", onAnswered);
    socket.on("call:ice", onIce);
    socket.on("call:renegotiate", onRenegotiate);
    socket.on("call:renegotiate-answer", onRenegotiateAnswer);
    socket.on("call:rejected", onRejected);
    socket.on("call:unavailable", onUnavailable);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:ringing", onRinging);
      socket.off("call:answered", onAnswered);
      socket.off("call:ice", onIce);
      socket.off("call:renegotiate", onRenegotiate);
      socket.off("call:renegotiate-answer", onRenegotiateAnswer);
      socket.off("call:rejected", onRejected);
      socket.off("call:unavailable", onUnavailable);
      socket.off("call:ended", onEnded);
    };
  },
}));
