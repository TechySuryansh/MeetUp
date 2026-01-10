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
} from "../../services/webrtc";

const CallScreen = ({ remoteSocketId, onEndCall }) => {
  const { socket } = useApp();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
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

    return () => {
      closeConnection();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
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

  // Start call (caller side)
  const startCall = async () => {
    if (!socket || !remoteSocketId || callStarted) return;
    
    console.log("📞 Starting call to:", remoteSocketId);
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

  // End call
  const handleEndCall = () => {
    closeConnection();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
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
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-4">Waiting for participant...</p>
                {remoteSocketId && !callStarted && (
                  <button
                    onClick={startCall}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Start Call
                  </button>
                )}
                {callStarted && !isConnected && (
                  <p className="text-yellow-400 text-sm">Calling...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all duration-200 ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              )}
            </svg>
          </button>

          {/* Video Button */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all duration-200 ${
              isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isVideoOff ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
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
