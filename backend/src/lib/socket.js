import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import { isOriginAllowed } from "./runtime.js";
import { getSocketUserId } from "./socket-auth.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(isOriginAllowed(origin) ? null : new Error("Socket origin not allowed"), true);
    },
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 10e6,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

// used to store online users
const userSocketMap = {}; // {userId: [socketId]}
const getGroupRoomId = (groupId) => `group:${groupId}`;

const syncSocketToUserGroups = async (socket, userId) => {
  const groups = await Group.find({ members: userId }).select("_id");
  const allowedGroupRooms = new Set(
    groups.map((group) => getGroupRoomId(group._id.toString()))
  );

  Array.from(socket.rooms)
    .filter((roomId) => roomId.startsWith("group:") && !allowedGroupRooms.has(roomId))
    .forEach((roomId) => {
      socket.leave(roomId);
    });

  allowedGroupRooms.forEach((groupRoomId) => {
    socket.join(groupRoomId);
  });
};

const emitDeliveredUpdates = (groupedUpdates) => {
  groupedUpdates.forEach(({ senderId, messageIds, deliveredAt }) => {
    io.to(senderId).emit("messagesDelivered", {
      messageIds,
      deliveredAt,
    });
  });
};

const markUserMessagesAsDelivered = async (userId) => {
  const undeliveredMessages = await Message.find({
    receiverId: userId,
    deliveredAt: null,
  }).select("_id senderId");

  if (!undeliveredMessages.length) return;

  const deliveredAt = new Date();
  const messageIds = undeliveredMessages.map((message) => message._id);

  await Message.updateMany(
    { _id: { $in: messageIds } },
    { $set: { deliveredAt } }
  );

  const groupedUpdates = Array.from(
    undeliveredMessages.reduce((accumulator, message) => {
      const senderId = message.senderId.toString();

      if (!accumulator.has(senderId)) {
        accumulator.set(senderId, {
          senderId,
          deliveredAt,
          messageIds: [],
        });
      }

      accumulator.get(senderId).messageIds.push(message._id);
      return accumulator;
    }, new Map()).values()
  );

  emitDeliveredUpdates(groupedUpdates);
};

export function isUserOnline(userId) {
  return Boolean(userSocketMap[userId]?.length);
}

export function isUserViewingConversation(userId, otherUserId) {
  return (userSocketMap[userId] || []).some((socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    return socket?.data?.activeChatUserId === otherUserId;
  });
}

export async function syncUserGroupRooms(userId) {
  const socketIds = userSocketMap[userId] || [];
  if (!socketIds.length) return;

  socketIds.forEach((socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) return;
    syncSocketToUserGroups(socket, userId).catch((error) => {
      console.log("Error syncing group rooms:", error.message);
    });
  });
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = getSocketUserId(socket);
  if (!userId) {
    socket.disconnect(true);
    return;
  }

  socket.data.userId = userId;
  if (userId) {
    socket.join(userId);
    userSocketMap[userId] = Array.from(new Set([...(userSocketMap[userId] || []), socket.id]));
    syncSocketToUserGroups(socket, userId).catch((error) => {
      console.log("Error joining group rooms:", error.message);
    });
    markUserMessagesAsDelivered(userId).catch((error) => {
      console.log("Error marking messages as delivered:", error.message);
    });
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing:start", ({ receiverId }) => {
    if (!userId || !receiverId) return;
    io.to(receiverId).emit("userTyping", { userId, isTyping: true });
  });

  socket.on("typing:stop", ({ receiverId }) => {
    if (!userId || !receiverId) return;
    io.to(receiverId).emit("userTyping", { userId, isTyping: false });
  });

  socket.on("groupTyping:start", ({ groupId, user }) => {
    if (!userId || !groupId || !user?._id) return;
    io.to(getGroupRoomId(groupId))
      .except(socket.id)
      .emit("groupTyping", { groupId, user, isTyping: true });
  });

  socket.on("groupTyping:stop", ({ groupId, user }) => {
    if (!userId || !groupId || !user?._id) return;
    io.to(getGroupRoomId(groupId))
      .except(socket.id)
      .emit("groupTyping", { groupId, user, isTyping: false });
  });

  socket.on("conversation:open", ({ otherUserId }) => {
    socket.data.activeChatUserId = otherUserId || null;
  });

  socket.on("conversation:close", () => {
    socket.data.activeChatUserId = null;
  });

  socket.on("disconnect", (reason) => {
    console.log("A user disconnected", socket.id, reason);
    if (userId) {
      userSocketMap[userId] = (userSocketMap[userId] || []).filter(
        (socketId) => socketId !== socket.id
      );
      if (userSocketMap[userId].length === 0) delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server, getGroupRoomId };
