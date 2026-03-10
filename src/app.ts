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
import meetingUploadController from "./controller/custom/meetingUpload.controller";
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
app.use("/api/meeting", meetingUploadController);
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
    "register-user",
    ({ userId, role }: { userId: string; role?: string }) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
      if (role && role.toLowerCase() === "admin") {
        socket.join("admin");
      }
    },
  );

  socket.on(
    "join-room",
    ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.join(roomId);
      users.push({ socketId: socket.id, userId, roomId });
      console.log(`${userId} joined room ${roomId}`);

      const existingUsers = users
        .filter((u) => u.roomId === roomId && u.socketId !== socket.id)
        .map((u) => u.socketId);
      socket.emit("room-users", existingUsers);

      // Notify others in the room
      socket.to(roomId).emit("new-participant", socket.id);
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
      const target = users.find((u) => u.socketId === to);
      if (target) io.to(target.socketId).emit("offer", { sdp, from });
    },
  );

  socket.on(
    "answer",
    ({ sdp, to }: { sdp: RTCSessionDescriptionInit; to: string }) => {
      const target = users.find((u) => u.socketId === to);
      if (target) io.to(target.socketId).emit("answer", { sdp });
    },
  );

  socket.on(
    "ice-candidate",
    ({ candidate, from }: { candidate: RTCIceCandidateInit; from: string }) => {
      const sender = users.find((u) => u.socketId === from);
      if (!sender) return;
      const roomUsers = users.filter(
        (u) => u.roomId === sender.roomId && u.socketId !== from,
      );
      roomUsers.forEach((u) =>
        io.to(u.socketId).emit("ice-candidate", { candidate }),
      );
    },
  );

  socket.on("disconnect", () => {
    const idx = users.findIndex((u) => u.socketId === socket.id);
    if (idx !== -1) {
      const roomId = users[idx].roomId;
      users.splice(idx, 1);
      if (roomId) {
        socket.to(roomId).emit("participant-left", socket.id);
      }
    }
    console.log("Socket disconnected:", socket.id);
  });

  socket.on(
    "meeting-started",
    async ({ bookingId, userId }: { bookingId: string; userId: string }) => {
      try {
        const Booking = sequelize.models.Booking;
        const ClientProfile = sequelize.models.ClientProfile;
        const ProfessionalProfile = sequelize.models.ProfessionalProfile;
        const Notification = sequelize.models.Notification;

        const booking = await Booking.findByPk(bookingId);
        if (!booking) return;

        const clientProfile = await ClientProfile.findByPk(
          (booking as any).client_id,
        );
        const professionalProfile = (booking as any).professional_id
          ? await ProfessionalProfile.findByPk(
              (booking as any).professional_id,
            )
          : null;

        const clientUserId = (clientProfile as any)?.user_id;
        const professionalUserId = (professionalProfile as any)?.user_id;

        const targetUserId =
          userId === clientUserId ? professionalUserId : clientUserId;
        if (!targetUserId) return;

        await Notification.create({
          user_id: targetUserId,
          title: "Meeting started",
          message:
            "Your meeting has started. Please open the meeting page to join.",
        });
        io.to(`user:${targetUserId}`).emit("notification", {
          title: "Meeting started",
          message:
            "Your meeting has started. Please open the meeting page to join.",
        });
      } catch (err) {
        console.error("meeting-started notification failed", err);
      }
    },
  );
});

// Sync DB and start server
const shouldSync = process.env.NODE_ENV !== "production";
const syncPromise = shouldSync
  ? sequelize.sync({ alter: true })
  : Promise.resolve();

syncPromise
  .then(() => {
    if (shouldSync) console.log("Database synced");
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("📖 Swagger Docs available at http://localhost:3002/api-docs");
    });
  })
  .catch((err) => {
    console.error("Database sync failed:", err);
    process.exit(1);
  });

