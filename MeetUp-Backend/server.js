const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const dbConnect = require("./src/config/db")

const app = express();
const server = http.createServer(app);

dbConnect();

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Store online users and active calls
const onlineUsers = new Map();
const activeCalls = new Map();
const callRooms = new Map();

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MeetUp Backend Server is running!',
    onlineUsers: onlineUsers.size,
    activeCalls: activeCalls.size
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins the platform
  socket.on('user-joined', (user) => {
    console.log(`User joined: ${user.username} (${socket.id})`);
    
    // Store user info
    const userInfo = {
      ...user,
      socketId: socket.id,
      joinedAt: new Date().toISOString()
    };
    
    onlineUsers.set(socket.id, userInfo);
    
    // Send updated users list to all clients
    const usersList = Array.from(onlineUsers.values()).map(u => ({
      id: u.id,
      username: u.username,
      joinedAt: u.joinedAt
    }));
    
    io.emit('users-list', usersList);
    
    // Notify others about new user
    socket.broadcast.emit('user-joined', {
      id: user.id,
      username: user.username,
      joinedAt: userInfo.joinedAt
    });
  });

  // Start a call
  socket.on('start-call', (callData) => {
    console.log(`Call started by ${callData.initiator.username}:`, callData.id);
    
    // Store call info
    activeCalls.set(callData.id, {
      ...callData,
      participants: new Map([[socket.id, callData.initiator]]),
      createdAt: new Date().toISOString()
    });

    // Join the call room
    socket.join(callData.id);
    
    // Notify participants about the call
    callData.participants.forEach(participant => {
      if (participant.id !== callData.initiator.id) {
        const participantSocket = findSocketByUserId(participant.id);
        if (participantSocket) {
          participantSocket.emit('incoming-call', {
            callId: callData.id,
            initiator: callData.initiator,
            isVideo: callData.isVideo
          });
        }
      }
    });

    // Confirm call started to initiator
    socket.emit('call-started', { callId: callData.id });
  });

  // Join an existing call
  socket.on('join-call', ({ callId, user }) => {
    console.log(`${user.username} joining call: ${callId}`);
    
    const call = activeCalls.get(callId);
    if (call) {
      // Add user to call participants
      call.participants.set(socket.id, user);
      socket.join(callId);
      
      // Notify all participants in the call
      socket.to(callId).emit('user-joined-call', {
        callId,
        user,
        participants: Array.from(call.participants.values())
      });
      
      // Send current participants to the new user
      socket.emit('call-participants', {
        callId,
        participants: Array.from(call.participants.values())
      });
    } else {
      socket.emit('call-not-found', { callId });
    }
  });

  // Leave a call
  socket.on('leave-call', ({ callId, userId }) => {
    console.log(`User ${userId} leaving call: ${callId}`);
    
    const call = activeCalls.get(callId);
    if (call) {
      call.participants.delete(socket.id);
      socket.leave(callId);
      
      // Notify remaining participants
      socket.to(callId).emit('user-left-call', {
        callId,
        userId,
        participants: Array.from(call.participants.values())
      });
      
      // If no participants left, end the call
      if (call.participants.size === 0) {
        activeCalls.delete(callId);
        console.log(`Call ${callId} ended - no participants remaining`);
      }
    }
    
    socket.emit('call-left', { callId });
  });

  // WebRTC signaling
  socket.on('webrtc-offer', ({ callId, targetUserId, offer }) => {
    const targetSocket = findSocketByUserId(targetUserId);
    if (targetSocket) {
      targetSocket.emit('webrtc-offer', {
        callId,
        fromUserId: onlineUsers.get(socket.id)?.id,
        offer
      });
    }
  });

  socket.on('webrtc-answer', ({ callId, targetUserId, answer }) => {
    const targetSocket = findSocketByUserId(targetUserId);
    if (targetSocket) {
      targetSocket.emit('webrtc-answer', {
        callId,
        fromUserId: onlineUsers.get(socket.id)?.id,
        answer
      });
    }
  });

  socket.on('webrtc-ice-candidate', ({ callId, targetUserId, candidate }) => {
    const targetSocket = findSocketByUserId(targetUserId);
    if (targetSocket) {
      targetSocket.emit('webrtc-ice-candidate', {
        callId,
        fromUserId: onlineUsers.get(socket.id)?.id,
        candidate
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const user = onlineUsers.get(socket.id);
    if (user) {
      // Remove from online users
      onlineUsers.delete(socket.id);
      
      // Remove from any active calls
      activeCalls.forEach((call, callId) => {
        if (call.participants.has(socket.id)) {
          call.participants.delete(socket.id);
          
          // Notify remaining participants
          socket.to(callId).emit('user-left-call', {
            callId,
            userId: user.id,
            participants: Array.from(call.participants.values())
          });
          
          // End call if no participants left
          if (call.participants.size === 0) {
            activeCalls.delete(callId);
            console.log(`Call ${callId} ended - initiator disconnected`);
          }
        }
      });
      
      // Update users list
      const usersList = Array.from(onlineUsers.values()).map(u => ({
        id: u.id,
        username: u.username,
        joinedAt: u.joinedAt
      }));
      
      io.emit('users-list', usersList);
      socket.broadcast.emit('user-left', user.id);
    }
  });
});

// Helper function to find socket by user ID
function findSocketByUserId(userId) {
  for (const [socketId, user] of onlineUsers.entries()) {
    if (user.id === userId) {
      return io.sockets.sockets.get(socketId);
    }
  }
  return null;
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 MeetUp Backend Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
});