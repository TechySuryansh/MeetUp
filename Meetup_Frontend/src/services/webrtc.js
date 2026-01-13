let peerConnection;
let localStream;
let remoteStream;
let screenStream;

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

// 🎥 Get camera + mic
export const getLocalStream = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  return localStream;
};

// 🖥️ Get screen share stream
export const getScreenStream = async () => {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
      },
      audio: false,
    });
    return screenStream;
  } catch (error) {
    console.error("Error getting screen share:", error);
    return null;
  }
};

// 🔄 Replace video track (for screen share)
export const replaceVideoTrack = async (newStream) => {
  if (!peerConnection) return;
  
  const videoTrack = newStream.getVideoTracks()[0];
  const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
  
  if (sender && videoTrack) {
    await sender.replaceTrack(videoTrack);
    console.log('🔄 Video track replaced');
  }
};

// 🔗 Create Peer Connection
export const createPeerConnection = (socket, remoteSocketId) => {
  peerConnection = new RTCPeerConnection(ICE_SERVERS);
  remoteStream = new MediaStream();

  // Remote stream
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
  };

  // ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        to: remoteSocketId,
        candidate: event.candidate,
      });
    }
  };

  // Add local tracks
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  return remoteStream;
};

// 📞 Caller creates offer
export const createOffer = async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

// 📥 Receiver handles offer
export const handleOffer = async (offer) => {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
};

// 📥 Caller receives answer
export const setAnswer = async (answer) => {
  await peerConnection.setRemoteDescription(answer);
};

// ❄️ Add ICE candidate
export const addIceCandidate = async (candidate) => {
  if (candidate) {
    await peerConnection.addIceCandidate(candidate);
  }
};

// ❌ End call - stops all tracks and closes connection
export const closeConnection = () => {
  // Stop all local stream tracks (camera + mic)
  if (localStream) {
    localStream.getTracks().forEach(track => {
      track.stop();
      console.log('🛑 Stopped track:', track.kind);
    });
    localStream = null;
  }
  
  // Stop screen share tracks
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    screenStream = null;
  }
  
  // Stop remote stream tracks
  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
    remoteStream = null;
  }
  
  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  console.log('📴 Connection closed, all tracks stopped');
};

// 🖥️ Stop screen share and switch back to camera
export const stopScreenShare = async () => {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    screenStream = null;
  }
  
  // Switch back to camera
  if (localStream && peerConnection) {
    const videoTrack = localStream.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
    if (sender && videoTrack) {
      await sender.replaceTrack(videoTrack);
    }
  }
};
