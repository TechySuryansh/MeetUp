import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import UserCard from './UserCard';
import CreateRoomModal from './CreateRoomModal';
import IncomingCallModal from './Call/IncomingCallModal';

const Dashboard = () => {
  const { 
    currentUser, 
    onlineUsers, 
    leaveApp, 
    callUser,
    incomingCall,
    acceptCall,
    rejectCall,
    isConnected
  } = useApp();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomId, setRoomId] = useState('');

  // Debug logging
  console.log('🔍 Dashboard Debug:');
  console.log('- Current User:', currentUser);
  console.log('- Online Users:', onlineUsers);
  console.log('- Socket Connected:', isConnected);

  // Filter out current user from online users
  const otherUsers = onlineUsers.filter(user => user.id !== currentUser?.id);

  const handleVideoCall = (user) => {
    console.log('📹 Starting video call with:', user);
    callUser(user);
  };

  const handleAudioCall = (user) => {
    console.log('📞 Starting audio call with:', user);
    callUser(user);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      console.log('Joining room:', roomId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          caller={incomingCall.callerInfo?.username || 'Unknown'}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Sidebar */}
      <div className="w-80 bg-slate-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">MeetUp</h2>
            <button
              onClick={leaveApp}
              className="text-gray-400 hover:text-white transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{currentUser?.username}</p>
              <div className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
                  {isConnected ? 'Online' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Online Users */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              Online Users ({otherUsers.length})
            </h3>
          </div>

          <div className="space-y-2">
            {otherUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">No other users online</p>
                <p className="text-gray-500 text-xs mt-1">Open another browser tab to test</p>
              </div>
            ) : (
              otherUsers.map(user => (
                <UserCard
                  key={user.socketId || user.id}
                  user={user}
                  onAudioCall={() => handleAudioCall(user)}
                  onVideoCall={() => handleVideoCall(user)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Main Header */}
        <div className="bg-slate-800 border-b border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Start a call or join an existing room</p>
        </div>

        {/* Main Actions */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Room Card */}
              <div className="card hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Create Room</h3>
                  <p className="text-gray-400 mb-6">Start a new call room and invite others</p>
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className="btn-primary w-full"
                  >
                    Create New Room
                  </button>
                </div>
              </div>

              {/* Join Room Card */}
              <div className="card hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Join Room</h3>
                  <p className="text-gray-400 mb-6">Enter a room ID to join an existing call</p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Enter Room ID"
                      className="input-field w-full"
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={!roomId.trim()}
                      className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">{onlineUsers.length}</div>
                <div className="text-gray-400">Users Online</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">0</div>
                <div className="text-gray-400">Active Calls</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-2">0</div>
                <div className="text-gray-400">Rooms Created</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}
    </div>
  );
};

export default Dashboard;