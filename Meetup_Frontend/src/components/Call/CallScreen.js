import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  getLocalStream,
  createPeerConnection,
  createOffer,
  handleOffer,
  setAnswer,
  addIceCandidate,
  closeConnection,
  getScreenStream,
  replaceVideoTrack,
  stopScreenShare,
} from "../../services/webrtc";

const CallScreen = ({ remoteSocketId, onEndCall }) => {
  const { socket } = useApp();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [callStarted, setCallStarted] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await getLocalStream();
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error getting local stream:", error);
      }
    };
    init();

    // Cleanup on unmount
    return () => {
      closeConnection();
    };
  }, []);

  // SOCKET EVENTS
  useEffect(() => {
    if (!socket) return;

    socket.on("webrtc-offer", async ({ offer, from }) => {
      console.log("📥 Received WebRTC offer from:", from);
      const remoteStream = createPeerConnection(socket, from);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      const answer = await handleOffer(offer);
      socket.emit("webrtc-answer", { to: from, answer });
      setIsConnected(true);
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      console.log("📥 Received WebRTC answer");
      await setAnswer(answer);
      setIsConnected(true);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      await addIceCandidate(candidate);
    });

    socket.on("call-ended", () => {
      console.log("📴 Call ended by remote user");
      handleEndCall();
    });

    return () => {
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [socket]);

  // Auto-start call when remoteSocketId becomes available (for receiver after accepting)
  useEffect(() => {
    if (remoteSocketId && localStream && !callStarted) {
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        startCall();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [remoteSocketId, localStream, callStarted]);

  // Start call (caller side)
  const startCall = async () => {
    if (!socket || !remoteSocketId || callStarted) return;
    
    console.log("📞 Starting WebRTC call to:", remoteSocketId);
    setCallStarted(true);
    
    const remoteStream = createPeerConnection(socket, remoteSocketId);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    const offer = await createOffer();
    socket.emit("webrtc-offer", {
      to: remoteSocketId,
      offer,
    });
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share, switch back to camera
      await stopScreenShare();
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    } else {
      // Start screen share
      const screenStream = await getScreenStream();
      if (screenStream) {
        // Replace video track in peer connection
        await replaceVideoTrack(screenStream);
        
        // Show screen share in local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Listen for when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = async () => {
          await stopScreenShare();
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
          }
          setIsScreenSharing(false);
        };
        
        setIsScreenSharing(true);
      }
    }
  };

  // End call
  const handleEndCall = () => {
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Close WebRTC connection and stop all tracks
    closeConnection();
    setLocalStream(null);
    
    if (onEndCall) onEndCall();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Video Call</h1>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
            <span className="text-gray-400">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Video */}
        <div className="relative bg-slate-800 rounded-xl overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">You</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-black/50 px-3 py-1 rounded-lg">
            <span className="text-white text-sm">You {isMuted && '(Muted)'}</span>
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative bg-slate-800 rounded-xl overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                {!remoteSocketId ? (
                  <p className="text-yellow-400">Waiting for other person to accept...</p>
                ) : callStarted ? (
                  <p className="text-yellow-400">Connecting...</p>
                ) : (
                  <p className="text-gray-400">Preparing call...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute Mic Button */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all duration-200 ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19L5 5m14 0v6a2 2 0 01-2 2H7m0 0v2a5 5 0 0010 0v-2m-5 6v2m-3 0h6" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Video Button */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all duration-200 ${
              isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18v.01M8 21l-4-4 4-4M16 3l4 4-4 4" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Screen Share Button */}
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all duration-200 ${
              isScreenSharing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200"
            title="End call"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallScreen;
