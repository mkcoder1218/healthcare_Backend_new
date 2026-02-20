// server.ts
import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";

// Import your modules
import router from "./routes/route";
import swagger from "./swagger/swaggerIndex";
import fileController from "./controller/custom/file.controller";
import sequelize from "./model/db";

// Initialize Express
const app = express();
const PORT = 3002;

// Enable CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Middleware
app.use(bodyParser.json());
app.use("/api", router);
app.use("/api/file/upload", fileController);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Swagger setup
swagger(app);

// Create HTTP server for Socket.IO
const httpServer = http.createServer(app);

// Socket.IO setup
interface IUser {
  socketId: string;
  userId: string;
  roomId: string;
}

const users: IUser[] = [];

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  socket.on(
    "join-room",
    ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.join(roomId);
      users.push({ socketId: socket.id, userId, roomId });
      console.log(`${userId} joined room ${roomId}`);

      // Notify others in the room
      socket.to(roomId).emit("new-participant", userId);
    },
  );

  socket.on(
    "offer",
    ({
      sdp,
      to,
      from,
    }: {
      sdp: RTCSessionDescriptionInit;
      to: string;
      from: string;
    }) => {
      const target = users.find((u) => u.userId === to);
      if (target) io.to(target.socketId).emit("offer", { sdp, from });
    },
  );

  socket.on(
    "answer",
    ({ sdp, to }: { sdp: RTCSessionDescriptionInit; to: string }) => {
      const target = users.find((u) => u.userId === to);
      if (target) io.to(target.socketId).emit("answer", { sdp });
    },
  );

  socket.on(
    "ice-candidate",
    ({ candidate, from }: { candidate: RTCIceCandidateInit; from: string }) => {
      const sender = users.find((u) => u.userId === from);
      if (!sender) return;
      const roomUsers = users.filter(
        (u) => u.roomId === sender.roomId && u.userId !== from,
      );
      roomUsers.forEach((u) =>
        io.to(u.socketId).emit("ice-candidate", { candidate }),
      );
    },
  );

  socket.on("disconnect", () => {
    const idx = users.findIndex((u) => u.socketId === socket.id);
    if (idx !== -1) users.splice(idx, 1);
    console.log("Socket disconnected:", socket.id);
  });
});

// Sync DB and start server
sequelize.sync().then(() => {
  console.log("Database synced");
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("📖 Swagger Docs available at http://localhost:3002/api-docs");
  });
});
