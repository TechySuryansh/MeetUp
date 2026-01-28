import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Video, Clock } from 'lucide-react';

// Helper function to format last seen time
const getLastSeenText = (lastSeen) => {
  if (!lastSeen) return '';
  
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now - lastSeenDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  // If more than 1 hour, just show red dot (no text)
  if (diffHours >= 1) {
    return null;
  }
  
  // Less than 1 minute
  if (diffMins < 1) {
    return 'Just now';
  }
  
  // Less than 60 minutes
  return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
};

const UserCard = ({ user, isSelected, onSelect, onAudioCall, onVideoCall }) => {
  // Safety check for user data
  if (!user || !user.username) {
    return null;
  }

  // Check if user is online - if isOnline is undefined, check if socketId exists (old format)
  const isOnline = user.isOnline !== undefined ? user.isOnline : !!user.socketId;
  const lastSeenText = !isOnline ? getLastSeenText(user.lastSeen) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`group relative bg-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:bg-slate-600/40 hover:border-slate-500/50 ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-900/20' : ''
      } ${!isOnline ? 'opacity-75' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`w-12 h-12 bg-gradient-to-br ${
                isOnline 
                  ? 'from-blue-500 to-purple-500' 
                  : 'from-gray-500 to-gray-600'
              } rounded-full flex items-center justify-center shadow-lg`}
            >
              <span className="text-white font-semibold text-lg">
                {user.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </motion.div>
            
            {/* Online/Offline indicator dot */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute -bottom-1 -right-1 w-4 h-4 ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              } border-2 border-slate-800 rounded-full ${
                isOnline ? 'animate-pulse' : ''
              }`}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate text-sm">
              {user.username || 'Unknown'}
            </p>
            <div className="flex items-center space-x-1">
              {!isOnline && lastSeenText && (
                <Clock className="w-3 h-3 text-gray-400" />
              )}
              <p className={`text-xs ${
                isOnline ? 'text-green-400' : 'text-gray-400'
              }`}>
                {isOnline ? 'Online' : (lastSeenText || 'Offline')}
              </p>
            </div>
          </div>

          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
        </div>

        {/* Show call buttons for online users */}
        {isOnline && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onAudioCall?.();
              }}
              className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all duration-200"
              title="Audio call"
            >
              <Phone className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onVideoCall?.();
              }}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
              title="Video call"
            >
              <Video className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default UserCard;
