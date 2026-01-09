import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import VideoCard from './VideoCard';

const CallInterface = () => {
  const { 
    activeCall, 
    currentUser, 
    localStream, 
    remoteStreams, 
    leaveCall,
    dispatch 
  } = useApp();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef(null);

  // Initialize local media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const constraints = {
          audio: true,
          video: activeCall?.isVideo || false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    if (activeCall && !localStream) {
      initializeMedia();
    }
  }, [activeCall, localStream, dispatch]);

  // Update local video ref when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track with screen share
        if (localStream) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = localStream.getVideoTracks()[0];
          
          // In a real implementation, you'd replace the track in the peer connection
          // For now, we'll just update the local stream
          localStream.removeTrack(localStream.getVideoTracks()[0]);
          localStream.addTrack(videoTrack);
          
          videoTrack.onended = () => {
            setIsScreenSharing(false);
            // Restore camera stream
            navigator.mediaDevices.getUserMedia({ video: true })
              .then(cameraStream => {
                const cameraTrack = cameraStream.getVideoTracks()[0];
                localStream.removeTrack(localStream.getVideoTracks()[0]);
                localStream.addTrack(cameraTrack);
              });
          };
        }
        
        setIsScreenSharing(true);
      } else {
        // Stop screen sharing and restore camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        
        if (localStream) {
          localStream.removeTrack(localStream.getVideoTracks()[0]);
          localStream.addTrack(cameraTrack);
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const handleLeaveCall = () => {
    leaveCall();
  };

  if (!activeCall) {
    return null;
  }

  const participants = activeCall.participants || [];
  const remoteParticipants = participants.filter(p => p.id !== currentUser?.id);
  const totalParticipants = participants.length;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-white">
              {activeCall.isVideo ? 'Video Call' : 'Audio Call'}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            Room ID: {activeCall.id?.slice(-6).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className={`h-full grid gap-4 ${
          totalParticipants === 1 ? 'grid-cols-1' :
          totalParticipants === 2 ? 'grid-cols-1 md:grid-cols-2' :
          totalParticipants <= 4 ? 'grid-cols-2' :
          totalParticipants <= 6 ? 'grid-cols-2 md:grid-cols-3' :
          'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {/* Local Video */}
          <VideoCard
            user={currentUser}
            stream={localStream}
            isLocal={true}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
          />

          {/* Remote Videos */}
          {remoteParticipants.map(participant => (
            <VideoCard
              key={participant.id}
              user={participant}
              stream={remoteStreams[participant.id]}
              isLocal={false}
            />
          ))}

          {/* Empty slots for visual balance */}
          {totalParticipants < 4 && Array.from({ length: 4 - totalParticipants }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-slate-800 rounded-xl border border-gray-700 flex items-center justify-center"
            >
              <div className="text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm">Waiting for participants</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all duration-200 ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
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
          {activeCall.isVideo && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all duration-200 ${
                isVideoOff 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isVideoOff ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            </button>
          )}

          {/* Screen Share Button */}
          {activeCall.isVideo && (
            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-all duration-200 ${
                isScreenSharing 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {/* Leave Call Button */}
          <button
            onClick={handleLeaveCall}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200 transform hover:scale-105"
            title="Leave call"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>

        {/* Call Info */}
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Call started at {new Date(activeCall.startedAt).toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default CallInterface;