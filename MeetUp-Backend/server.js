const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const dbConnect = require("./src/config/db");

const app = express();
const server = http.createServer(app);

// DB
dbConnect();

// Middleware
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3000",
      process.env.CLIENT_URL
    ],
    credentials: true,
  })
);
app.use(express.json());

// Routes
const authRoutes = require("./src/routes/authRoutes");
const meetingRoutes = require("./src/routes/meetingRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "MeetUp Backend running 🚀",
  });
});

// ---------------- SOCKET.IO ----------------

const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3000",
      process.env.CLIENT_URL
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store online users and all known users with last seen
const onlineUsers = new Map();
const allUsers = new Map(); // Stores all users with their last seen time
const rooms = new Map(); // Store active rooms

// Helper function to check if socket is host
const isHost = (socket, roomId) => {
  const room = rooms.get(roomId);
  return room && room.host && room.host.socketId === socket.id;
};

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // User comes online
  socket.on("user-joined", (user) => {
    console.log("👤 User joined:", user.username, socket.id);

    // Add to online users
    onlineUsers.set(socket.id, {
      ...user,
      socketId: socket.id,
    });

    // Update all users map (track by unique user id)
    allUsers.set(user.id, {
      id: user.id,
      username: user.username,
      socketId: socket.id,
      isOnline: true,
      lastSeen: null,
    });

    // Send updated users list to ALL clients
    const usersList = Array.from(allUsers.values());

    io.emit("users-list", usersList);
    console.log("📋 Users list sent to all:", usersList.length, "users");
  });

  // ================= ROOM MANAGEMENT =================

  // Join a room
  socket.on("join-room", ({ roomId, userInfo }) => {
    console.log("🚪 User", userInfo.username, "joining room:", roomId);

    socket.join(roomId);

    // Get or create room
    if (!rooms.has(roomId)) {
      // First user to join becomes the host
      rooms.set(roomId, {
        participants: [],
        host: {
          id: userInfo.id,
          username: userInfo.username,
          socketId: socket.id,
        },
        createdAt: new Date(),
        locked: false,
        removedUsers: new Set(),
        settings: {
          allowScreenShare: true,
          allowChat: true,
        },
      });
      console.log("🏠 Room created with host:", userInfo.username);
    }

    const room = rooms.get(roomId);

    // Check if user was removed
    if (room.removedUsers.has(userInfo.id)) {
      socket.emit("join-rejected", {
        reason: "You have been removed from this meeting",
      });
      console.log("❌ User", userInfo.username, "was removed from room:", roomId);
      return;
    }

    // Check if meeting is locked (only for non-hosts)
    if (room.locked && room.host.id !== userInfo.id) {
      socket.emit("join-rejected", {
        reason: "This meeting is locked by the host",
      });
      console.log("🔒 User", userInfo.username, "cannot join locked room:", roomId);
      return;
    }

    room.participants.push({
      socketId: socket.id,
      ...userInfo,
    });

    // Notify others in room
    socket.to(roomId).emit("user-joined-room", {
      socketId: socket.id,
      userInfo,
    });

    // Send current participants and host info to the new user
    socket.emit("room-participants", room.participants.filter(p => p.socketId !== socket.id));
    socket.emit("room-host", room.host);

    console.log("📋 Room", roomId, "now has", room.participants.length, "participants");
  });

  // Leave room
  socket.on("leave-room", ({ roomId }) => {
    console.log("🚪 User leaving room:", roomId);
    socket.leave(roomId);

    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.participants = room.participants.filter(p => p.socketId !== socket.id);

      // Notify others
      socket.to(roomId).emit("user-left-room", { socketId: socket.id });

      // Delete room if empty
      if (room.participants.length === 0) {
        rooms.delete(roomId);
      }
    }
  });

  // ================= CALL SIGNALING =================

  // Call someone
  socket.on("call-user", ({ to, callerInfo }) => {
    console.log("📞 Call from", socket.id, "to", to);
    io.to(to).emit("incoming-call", {
      from: socket.id,
      callerInfo: callerInfo,
    });
  });

  // Call accepted
  socket.on("call-accepted", ({ to }) => {
    console.log("✅ Call accepted, notifying:", to);
    io.to(to).emit("call-accepted", {
      from: socket.id,
    });
  });

  // Call rejected
  socket.on("call-rejected", ({ to }) => {
    console.log("❌ Call rejected, notifying:", to);
    io.to(to).emit("call-rejected", {
      from: socket.id,
    });
  });

  // Call ended
  socket.on("call-ended", ({ to }) => {
    console.log("📴 Call ended, notifying:", to);
    io.to(to).emit("call-ended", {
      from: socket.id,
    });
  });

  // WebRTC Offer
  socket.on("webrtc-offer", ({ to, offer }) => {
    console.log("� WebRTC offer from", socket.id, "to", to);
    io.to(to).emit("webrtc-offer", {
      from: socket.id,
      offer,
    });
  });

  // WebRTC Answer
  socket.on("webrtc-answer", ({ to, answer }) => {
    console.log("📥 WebRTC answer from", socket.id, "to", to);
    io.to(to).emit("webrtc-answer", {
      from: socket.id,
      answer,
    });
  });

  // ICE Candidate
  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", {
      from: socket.id,
      candidate,
    });
  });

  // ================= CHAT MESSAGES =================

  // Send chat message during call
  socket.on("chat-message", ({ to, message, senderName }) => {
    console.log("💬 [Backend] Chat message from", senderName, "to", to);

    if (!to || !message || !senderName) {
      console.log("❌ [Backend] Invalid chat message data:", { to, message, senderName });
      return;
    }

    // Broadcast message to the destination (room or user)
    // The sender already has the message in their UI
    console.log("💬 [Backend] Broadcasting message to:", to);
    socket.to(to).emit("chat-message", {
      from: socket.id,
      senderName,
      message,
      timestamp: new Date().toISOString(),
    });
    
    console.log("✅ [Backend] Message sent successfully");
  });

  // ================= DISCONNECT HANDLER =================

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);

    // Update online users
    const disconnectedUser = onlineUsers.get(socket.id);
    if (disconnectedUser) {
      onlineUsers.delete(socket.id);

      // Update all users map with last seen
      if (allUsers.has(disconnectedUser.id)) {
        allUsers.set(disconnectedUser.id, {
          ...allUsers.get(disconnectedUser.id),
          isOnline: false,
          lastSeen: new Date().toISOString(),
          socketId: null,
        });
      }
    }

    // Clean up from all rooms
    rooms.forEach((room, roomId) => {
      const participantIndex = room.participants.findIndex(p => p.socketId === socket.id);
      if (participantIndex !== -1) {
        room.participants.splice(participantIndex, 1);

        // Notify other participants in the room
        socket.to(roomId).emit("user-left-room", { socketId: socket.id });

        console.log("📋 User removed from room", roomId, "- Remaining:", room.participants.length);

        // Delete room if empty
        if (room.participants.length === 0) {
          rooms.delete(roomId);
          console.log("🗑️ Room", roomId, "deleted (empty)");
        }
      }
    });

    // Notify all users about updated user list
    const usersList = Array.from(allUsers.values());
    io.emit("users-list", usersList);

    // Notify others that user left (global)
    socket.broadcast.emit("user-left", socket.id);
  });

  // ================= INVITES =================

  // Invite user to room
  socket.on("invite-to-room", ({ roomId, targetSocketId, inviterName }) => {
    console.log("📩 Invite from", inviterName, "to", targetSocketId, "for room", roomId);
    io.to(targetSocketId).emit("room-invite", {
      roomId,
      inviterName,
    });
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
