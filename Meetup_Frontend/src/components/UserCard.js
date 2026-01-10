import React from 'react';

const UserCard = ({ user, isSelected, onSelect, onAudioCall, onVideoCall }) => {
  // Safety check for user data
  if (!user || !user.username) {
    return null;
  }

  return (
    <div 
      className={`user-card ${isSelected ? 'ring-2 ring-blue-500 bg-blue-900/20' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user.username || 'Unknown'}</p>
            <p className="text-xs text-gray-400">Online</p>
          </div>

          {isSelected && (
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAudioCall?.();
            }}
            className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all duration-200"
            title="Audio call"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onVideoCall?.();
            }}
            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
            title="Video call"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;