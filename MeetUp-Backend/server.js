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
app.use("/api/auth", authRoutes);

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
      /\.vercel\.app$/  // Allow all Vercel preview URLs
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store online users (Phase-1 simple)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // User comes online
  socket.on("user-joined", (user) => {
    console.log("👤 User joined:", user.username, socket.id);
    
    onlineUsers.set(socket.id, {
      ...user,
      socketId: socket.id,
    });

    // Send updated users list to ALL clients (including socketId)
    const usersList = Array.from(onlineUsers.values()).map((u) => ({
      id: u.id,
      username: u.username,
      socketId: u.socketId,
    }));
    
    // Broadcast to ALL connected clients
    io.emit("users-list", usersList);
    console.log("📋 Users list sent to all:", usersList.length, "users");
    console.log("📋 Users:", usersList.map(u => u.username).join(", "));
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

  // Disconnect
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);

    onlineUsers.delete(socket.id);

    // Send updated users list
    const usersList = Array.from(onlineUsers.values()).map((u) => ({
      id: u.id,
      username: u.username,
      socketId: u.socketId,
    }));
    
    io.emit("users-list", usersList);
    
    // Notify others that user left
    socket.broadcast.emit("user-left", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
