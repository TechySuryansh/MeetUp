import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  LogOut, 
  Video, 
  Phone, 
  Calendar,
  Settings,
  Search,
  Bell,
  ChevronRight,
  UserPlus,
  Clock,
  Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import UserCard from './UserCard';
import CreateRoomModal from './CreateRoomModal';
import IncomingCallModal from './Call/IncomingCallModal';
import ProfilePage from './Profile/ProfilePage';

const Dashboard = () => {
  const {
    currentUser,
    onlineUsers,
    leaveApp,
    callUser,
    incomingCall,
    incomingInvite,
    acceptCall,
    rejectCall,
    isConnected,
    dispatch
  } = useApp();
  
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out current user and separate online/offline
  const otherUsers = onlineUsers.filter(user => user.id !== currentUser?.id);
  const isUserOnline = (user) => user.isOnline !== undefined ? user.isOnline : !!user.socketId;
  const onlineCount = otherUsers.filter(user => isUserOnline(user)).length;

  // Filter users based on search
  const filteredUsers = otherUsers.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: online users first, then offline by last seen
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aOnline = isUserOnline(a);
    const bOnline = isUserOnline(b);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    if (!aOnline && !bOnline && a.lastSeen && b.lastSeen) {
      return new Date(b.lastSeen) - new Date(a.lastSeen);
    }
    return 0;
  });

  const handleVideoCall = (user) => {
    console.log('📹 Starting video call with:', user);
    callUser(user);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      dispatch({
        type: 'SET_ACTIVE_CALL',
        payload: { id: roomId, isVideo: true, isRoom: true, roomId: roomId.trim() }
      });
    }
  };

  const handleStartRoomCall = (room) => {
    dispatch({
      type: 'SET_ACTIVE_CALL',
      payload: { id: room.id, isVideo: room.isVideo, isRoom: true, roomId: room.id, roomName: room.name }
    });
  };

  const quickActions = [
    {
      icon: Video,
      title: "Start Meeting",
      description: "Create a new video call",
      color: "from-blue-500 to-blue-600",
      action: () => setShowCreateRoom(true)
    },
    {
      icon: UserPlus,
      title: "Join Meeting",
      description: "Enter meeting ID to join",
      color: "from-purple-500 to-purple-600",
      action: () => document.getElementById('room-input')?.focus()
    },
    {
      icon: Calendar,
      title: "Schedule",
      description: "Plan future meetings",
      color: "from-green-500 to-green-600",
      action: () => setShowProfile(true)
    }
  ];

  // Show profile page if active
  if (showProfile) {
    return <ProfilePage onBack={() => setShowProfile(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <IncomingCallModal
            caller={incomingCall.callerInfo?.username || 'Unknown'}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        )}
      </AnimatePresence>

      {/* Incoming Invite Modal */}
      <AnimatePresence>
        {incomingInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Room Invitation</h3>
              <p className="text-gray-300 mb-6">
                <span className="font-bold text-white">{incomingInvite.inviterName}</span> invited you to join a room.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => dispatch({ type: 'SET_INCOMING_INVITE', payload: null })}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => {
                    dispatch({
                      type: 'SET_ACTIVE_CALL',
                      payload: {
                        id: incomingInvite.roomId,
                        isVideo: true,
                        isRoom: true,
                        roomId: incomingInvite.roomId
                      }
                    });
                    dispatch({ type: 'SET_INCOMING_INVITE', payload: null });
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Join Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="w-80 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MeetUp</span>
              </motion.div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={leaveApp}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* User Profile */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-3 cursor-pointer hover:bg-slate-700/30 p-3 rounded-xl transition-all"
              onClick={() => setShowProfile(true)}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {currentUser?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{currentUser?.username}</p>
                <div className="flex items-center text-sm">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                  <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
                    {isConnected ? 'Online' : 'Connecting...'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.div>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Users ({onlineCount} online)
              </h3>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {sortedUsers.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400 text-sm">
                      {searchQuery ? 'No users found' : 'No other users yet'}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {searchQuery ? 'Try a different search' : 'Invite someone to join!'}
                    </p>
                  </motion.div>
                ) : (
                  sortedUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <UserCard
                        user={user}
                        onAudioCall={() => handleVideoCall(user)}
                        onVideoCall={() => handleVideoCall(user)}
                      />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Main Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-800/30 backdrop-blur-xl border-b border-slate-700/50 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {currentUser?.username}
                </h1>
                <p className="text-gray-400">Ready to connect with your team?</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {/* Quick Actions */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={action.title}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="group cursor-pointer"
                      onClick={action.action}
                    >
                      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-700/50 transition-all duration-300">
                        <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                        <p className="text-gray-400 text-sm">{action.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Join Room Section */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-12"
              >
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Join Existing Meeting</h3>
                  <div className="flex space-x-4">
                    <input
                      id="room-input"
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Enter Meeting ID"
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleJoinRoom}
                      disabled={!roomId.trim()}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Join
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
              >
                {[
                  { label: 'Total Users', value: otherUsers.length, icon: Users, color: 'text-blue-400' },
                  { label: 'Online Now', value: onlineCount, icon: Activity, color: 'text-green-400' },
                  { label: 'Meetings Today', value: 0, icon: Calendar, color: 'text-purple-400' },
                  { label: 'Total Time', value: '0h', icon: Clock, color: 'text-orange-400' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 text-center"
                  >
                    <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                    <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateRoom && (
          <CreateRoomModal
            onClose={() => setShowCreateRoom(false)}
            onStartCall={handleStartRoomCall}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;