import React, { useRef, useEffect } from 'react';

const VideoCard = ({ 
  user, 
  stream, 
  isLocal = false, 
  isMuted = false, 
  isVideoOff = false,
  isScreenSharing = false 
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().length > 0 && !isVideoOff;

  return (
    <div className="relative bg-slate-800 rounded-xl overflow-hidden border border-gray-700 aspect-video">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video to prevent feedback
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <p className="text-white font-medium">{user?.username || 'Unknown'}</p>
            {isVideoOff && (
              <p className="text-xs text-gray-400 mt-1">Camera off</p>
            )}
          </div>
        </div>
      )}

      {/* User Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium text-sm">
              {user?.username || 'Unknown'}
              {isLocal && ' (You)'}
            </span>
            {isScreenSharing && (
              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                Sharing
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Mute Indicator */}
            {isMuted && (
              <div className="bg-red-600 p-1 rounded-full">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
            )}

            {/* Video Off Indicator */}
            {isVideoOff && (
              <div className="bg-red-600 p-1 rounded-full">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
            )}

            {/* Connection Quality Indicator */}
            <div className="flex items-center space-x-1">
              <div className="w-1 h-2 bg-green-500 rounded-full"></div>
              <div className="w-1 h-3 bg-green-500 rounded-full"></div>
              <div className="w-1 h-4 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Local Video Mirror Effect */}
      {isLocal && hasVideo && !isScreenSharing && (
        <style jsx>{`
          video {
            transform: scaleX(-1);
          }
        `}</style>
      )}

      {/* Speaking Indicator */}
      {!isMuted && (
        <div className="absolute top-3 left-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Fullscreen Button */}
      <button
        className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200"
        title="Fullscreen"
        onClick={() => {
          if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
              videoRef.current.requestFullscreen();
            }
          }
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  );
};

export default VideoCard;