const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("call-user", ({ to, from }) => {
      io.to(to).emit("incoming-call", { from });
    });

    socket.on("call-accepted", ({ to }) => {
      io.to(to).emit("call-accepted");
    });

    socket.on("webrtc-offer", ({ to, offer }) => {
      io.to(to).emit("webrtc-offer", {
        offer,
        from: socket.id,
      });
    });

    socket.on("webrtc-answer", ({ to, answer }) => {
      io.to(to).emit("webrtc-answer", answer);
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", candidate);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = socketHandler;
