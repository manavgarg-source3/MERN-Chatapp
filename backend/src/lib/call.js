import crypto from "crypto";
import User from "../models/user.model.js";

/**
 * 1:1 WebRTC call signaling relay.
 *
 * The server never touches media — it only relays SDP offers/answers and ICE
 * candidates between the two participants' private rooms (each socket joins a
 * room named by its userId), plus a little presence/busy bookkeeping so a
 * second caller gets a clean "busy" instead of a broken call.
 *
 * State is module-level (single process) and therefore shared across every
 * connection, which is what we want for a global call registry.
 */

const activeCalls = new Map(); // callId -> { callerId, calleeId, callType }
const busyUsers = new Set(); // userIds currently ringing or in a call

const normalizeId = (value) => (value == null ? "" : String(value));
const normalizeCallType = (type) => (type === "video" ? "video" : "audio");

const otherParty = (call, me) =>
  normalizeId(call.callerId) === me ? normalizeId(call.calleeId) : normalizeId(call.callerId);

const releaseCall = (callId) => {
  const call = activeCalls.get(callId);
  if (!call) return;
  busyUsers.delete(normalizeId(call.callerId));
  busyUsers.delete(normalizeId(call.calleeId));
  activeCalls.delete(callId);
};

export function registerCallHandlers(io, socket, { userId, isUserOnline }) {
  const me = normalizeId(userId);
  if (!me) return;

  // Caller starts a call by sending its SDP offer.
  socket.on("call:offer", async ({ toUserId, callType, sdp }) => {
    const target = normalizeId(toUserId);
    if (!target || !sdp || target === me) return;

    if (typeof isUserOnline === "function" && !isUserOnline(target)) {
      socket.emit("call:unavailable", { toUserId: target, reason: "offline" });
      return;
    }

    if (busyUsers.has(target)) {
      socket.emit("call:unavailable", { toUserId: target, reason: "busy" });
      return;
    }

    const callId = crypto.randomUUID();
    const type = normalizeCallType(callType);

    activeCalls.set(callId, { callerId: me, calleeId: target, callType: type });
    busyUsers.add(me);
    busyUsers.add(target);

    let from = { _id: me, fullName: "Someone", profilePic: "" };
    try {
      const user = await User.findById(me).select("fullName profilePic");
      if (user) {
        from = { _id: me, fullName: user.fullName, profilePic: user.profilePic || "" };
      }
    } catch {
      // best-effort identity; signaling still proceeds
    }

    io.to(target).emit("call:incoming", { callId, from, callType: type, sdp });
    socket.emit("call:ringing", { callId, toUserId: target });
  });

  // Callee accepts and returns its SDP answer.
  socket.on("call:answer", ({ callId, sdp }) => {
    const call = activeCalls.get(callId);
    if (!call || !sdp) return;
    if (normalizeId(call.calleeId) !== me) return; // only the callee may answer
    io.to(normalizeId(call.callerId)).emit("call:answered", { callId, sdp });
  });

  // Trickle ICE candidates both ways.
  socket.on("call:ice", ({ callId, candidate }) => {
    const call = activeCalls.get(callId);
    if (!call || !candidate) return;
    const other = otherParty(call, me);
    if (!other) return;
    io.to(other).emit("call:ice", { callId, candidate });
  });

  // ICE-restart renegotiation relay (keeps calls alive across network changes).
  socket.on("call:renegotiate", ({ callId, sdp }) => {
    const call = activeCalls.get(callId);
    if (!call || !sdp) return;
    const other = otherParty(call, me);
    if (other) io.to(other).emit("call:renegotiate", { callId, sdp });
  });

  socket.on("call:renegotiate-answer", ({ callId, sdp }) => {
    const call = activeCalls.get(callId);
    if (!call || !sdp) return;
    const other = otherParty(call, me);
    if (other) io.to(other).emit("call:renegotiate-answer", { callId, sdp });
  });

  // Callee declines a ringing call.
  socket.on("call:reject", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call) return;
    if (me !== normalizeId(call.callerId) && me !== normalizeId(call.calleeId)) return;
    io.to(otherParty(call, me)).emit("call:rejected", { callId });
    releaseCall(callId);
  });

  // Either side hangs up (also covers the caller cancelling before answer).
  socket.on("call:end", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call) return;
    if (me !== normalizeId(call.callerId) && me !== normalizeId(call.calleeId)) return;
    io.to(otherParty(call, me)).emit("call:ended", { callId });
    releaseCall(callId);
  });

  // If a participant drops, tear down any call they were in.
  socket.on("disconnect", () => {
    for (const [callId, call] of activeCalls.entries()) {
      if (normalizeId(call.callerId) === me || normalizeId(call.calleeId) === me) {
        io.to(otherParty(call, me)).emit("call:ended", { callId, reason: "disconnected" });
        releaseCall(callId);
      }
    }
  });
}
