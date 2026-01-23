import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import InviteModal from "./InviteModal";
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

const CallScreen = ({ remoteSocketId, onEndCall, roomId }) => {
  const { socket, currentUser, activeCall, onlineUsers } = useApp();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const chatEndRef = useRef();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [callStarted, setCallStarted] = useState(false);
  const [participants, setParticipants] = useState([]);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isChatOpenRef = useRef(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMeetingInfo, setShowMeetingInfo] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [roomHost, setRoomHost] = useState(null);

  // Get room ID from props or activeCall
  const currentRoomId = roomId || activeCall?.roomId;
  const isRoomCall = activeCall?.isRoom;

  // Initialize media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await getLocalStream();
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error getting local stream:", error);
      }
    };
    initMedia();

    return () => {
      closeConnection();
    };
  }, []);

  // Join room when socket is ready
  useEffect(() => {
    if (isRoomCall && currentRoomId && socket) {
      console.log("🚪 Joining room:", currentRoomId);
      socket.emit("join-room", {
        roomId: currentRoomId,
        userInfo: {
          id: currentUser?.id,
          username: currentUser?.username,
        },
      });

      return () => {
        socket.emit("leave-room", { roomId: currentRoomId });
      };
    }
  }, [isRoomCall, currentRoomId, socket, currentUser]);

  // SOCKET EVENTS
  useEffect(() => {
    if (!socket) return;

    // Room events
    socket.on("room-participants", (existingParticipants) => {
      console.log("📋 Existing participants:", existingParticipants);
      setParticipants(existingParticipants);

      // Start call with each existing participant
      existingParticipants.forEach(async (participant) => {
        if (participant.socketId && localStreamRef.current) {
          console.log("📞 Initiating call with:", participant.username);
          const remoteStream = createPeerConnection(socket, participant.socketId);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          const offer = await createOffer();
          socket.emit("webrtc-offer", { to: participant.socketId, offer });
        }
      });
    });

    socket.on("user-joined-room", ({ socketId, userInfo }) => {
      console.log("👤 User joined room:", userInfo.username);
      setParticipants(prev => [...prev, { socketId, ...userInfo }]);
      setIsConnected(true);
    });

    socket.on("user-left-room", ({ socketId }) => {
      console.log("👤 User left room:", socketId);
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    });

    socket.on("room-host", (hostInfo) => {
      console.log("🏠 Room host info received:", hostInfo);
      setRoomHost(hostInfo);
    });

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

    // Chat message received
    socket.on("chat-message", ({ senderName, message, timestamp, from }) => {
      // Ignore my own messages (already added locally)
      if (from === socket.id) return;

      const newMsg = {
        id: Date.now(),
        sender: senderName,
        text: message,
        timestamp,
        isMe: false,
      };
      setMessages(prev => [...prev, newMsg]);
      if (!isChatOpenRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      socket.off("room-participants");
      socket.off("user-joined-room");
      socket.off("user-left-room");
      socket.off("room-host");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
      socket.off("call-ended");
      socket.off("chat-message");
    };
  }, [socket]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-start call
  useEffect(() => {
    if (remoteSocketId && localStream && !callStarted) {
      const timer = setTimeout(() => {
        startCall();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [remoteSocketId, localStream, callStarted]);

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

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    } else {
      const screenStream = await getScreenStream();
      if (screenStream) {
        await replaceVideoTrack(screenStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
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

  const handleEndCall = () => {
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    closeConnection();
    setLocalStream(null);
    localStreamRef.current = null;
    if (onEndCall) onEndCall();
  };

  // Send chat message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    // Check if we have a destination (either room ID or remote user)
    const destination = isRoomCall ? currentRoomId : remoteSocketId;
    if (!destination) {
      console.warn("Cannot send message: No destination available");
      return;
    }

    const msg = {
      id: Date.now(),
      sender: currentUser?.username || "You",
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isMe: true,
    };

    setMessages(prev => [...prev, msg]);
    socket.emit("chat-message", {
      to: destination,
      message: newMessage.trim(),
      senderName: currentUser?.username || "User",
    });
    setNewMessage("");
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    isChatOpenRef.current = !isChatOpen;
    if (!isChatOpen) setUnreadCount(0);
  };

  const handleInviteUser = (user) => {
    if (socket && currentRoomId) {
      console.log('📩 Sending invite to:', user.username);
      socket.emit('invite-to-room', {
        roomId: currentRoomId,
        targetSocketId: user.socketId,
        inviterName: currentUser?.username || 'Someone',
      });
      setShowInviteModal(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">
              {activeCall?.roomName || (isRoomCall ? `Room: ${currentRoomId?.slice(0, 8)}...` : 'Video Call')}
            </h1>
            {isRoomCall && (
              <p className="text-xs text-gray-400 mt-1">
                {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* Meeting Info Toggle Button */}
            <button
              onClick={() => setShowMeetingInfo(!showMeetingInfo)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${showMeetingInfo ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              title="Meeting Info"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">Info</span>
            </button>
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected || isRoomCall ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
              <span className="text-gray-400">{isConnected ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Meeting Info Panel */}
        {showMeetingInfo && (
          <div className="mt-4 bg-slate-700/50 rounded-xl p-4 border border-gray-600 animate-slide-down">
            <h3 className="text-white font-medium mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Meeting Details
            </h3>

            <div className="space-y-3">
              {/* Room ID */}
              <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Room ID</p>
                  <p className="text-white font-mono text-sm">{currentRoomId || 'N/A'}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(currentRoomId, 'roomId')}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Copy Room ID"
                >
                  {copiedField === 'roomId' ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Meeting Link */}
              <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-gray-400 text-xs mb-1">Meeting Link</p>
                  <p className="text-white text-sm truncate">{`${window.location.origin}?room=${currentRoomId}`}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}?room=${currentRoomId}`, 'link')}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                  title="Copy Meeting Link"
                >
                  {copiedField === 'link' ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Room Name */}
              {activeCall?.roomName && (
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Room Name</p>
                  <p className="text-white text-sm">{activeCall.roomName}</p>
                </div>
              )}

              {/* Meeting Host */}
              {roomHost && (
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-2">Meeting Host</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {roomHost.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-white text-sm font-medium">{roomHost.username}</p>
                        <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">Host</span>
                      </div>
                      {currentUser?.id === roomHost.id && (
                        <p className="text-green-400 text-xs">You are the host</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Participants Count */}
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Participants</p>
                <p className="text-white text-sm">{participants.length + 1} in this meeting</p>
              </div>
            </div>

            <p className="text-gray-500 text-xs mt-3">
              Share the Room ID or link with others to let them join this meeting.
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className={`flex-1 p-4 grid grid-cols-1 ${!isChatOpen ? 'md:grid-cols-2' : ''} gap-4 transition-all`}>
          {/* Local Video */}
          <div className="relative bg-slate-800 rounded-xl overflow-hidden min-h-[200px]">
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
          <div className="relative bg-slate-800 rounded-xl overflow-hidden min-h-[200px]">
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

        {/* Chat Panel */}
        {isChatOpen && (
          <div className="w-80 bg-slate-800 border-l border-gray-700 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-medium">Chat</h3>
              <button
                onClick={toggleChat}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center text-sm">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg ${msg.isMe
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-gray-200'
                        }`}
                    >
                      {!msg.isMe && (
                        <p className="text-xs text-blue-400 mb-1">{msg.sender}</p>
                      )}
                      <p className="text-sm break-words">{msg.text}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-slate-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white`}
            title={isMuted ? 'Unmute' : 'Mute'}
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

          {/* Video */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all ${isScreenSharing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Chat Toggle */}
          <button
            onClick={toggleChat}
            className={`p-4 rounded-full transition-all relative ${isChatOpen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white`}
            title="Chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Invite People */}
          {isRoomCall && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-4 rounded-full transition-all bg-gray-600 hover:bg-gray-700 text-white"
              title="Invite people"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
          )}

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all"
            title="End call"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onlineUsers={onlineUsers.filter(u => u.id !== currentUser?.id)}
          currentParticipants={[{ socketId: socket?.id }, ...participants]}
          onInvite={handleInviteUser}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

export default CallScreen;
