import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const userSocketMap: Record<string, string> = {};
const getReceiverSocketId = (receiverSocketId: string): string | undefined => {
  return userSocketMap[receiverSocketId];
};
io.on("connection", (socket: Socket) => {
  console.log("User Connected", socket.id);

  const userId = socket.handshake.query.userId as string | undefined;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User${userId} mapped to socket ${socket.id}`);
  }
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  // if the user is logged in, then join the room
  if (userId) {
    socket.join(userId);
    console.log(`User ${userId} joined the room`);
  }
  socket.on("typing", (data) => {
    console.log(`user with ${data.userId} is typing in chat ${data.chatId}`);
    socket.to(data.chatId).emit("userTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });
  socket.on("stopTyping", (data) => {
    console.log(
      `user with ${data.userId} stopped typing in chat ${data.chatId}`
    );
    socket.to(data.chatId).emit("userStoppedTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`User ${userId} joined the chat room ${chatId}`);
  });
  socket.on("leaveRoom", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${userId} left the chat Room ${chatId}}`);
  });
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);

    if (userId) {
      delete userSocketMap[userId];
      console.log(`user  with this id ${userId} removed from the online users`);
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("connect_error", (error) => {
    console.log("Socket connection error 👎", error);
  });
});
export { app, server, io, getReceiverSocketId };
