import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UserPlus, Users, Clock, Trash2, MessageCircle } from 'lucide-react';

const FriendsPage = ({ onBack, onStartChat }) => {
  const [friends, setFriends] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // friends, pending, sent

  useEffect(() => {
    fetchFriends();
    fetchPendingCount();
  }, [activeTab]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('meetup_token');
      const endpoint = activeTab === 'friends' 
        ? '/api/friends/list'
        : activeTab === 'pending'
        ? '/api/friends/requests/pending'
        : '/api/friends/requests/sent';

      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}${endpoint}?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setFriends(data.data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const token = localStorage.getItem('meetup_token');
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/friends/requests/pending?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setPendingCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Remove this friend?')) return;

    try {
      const token = localStorage.getItem('meetup_token');
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/friends/remove/${friendId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setFriends(friends.filter(f => f._id !== friendId));
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleAccept = async (requestId, senderId) => {
    try {
      const token = localStorage.getItem('meetup_token');
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/friends/request/accept/${requestId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setFriends(friends.filter(r => r._id !== requestId));
        fetchPendingCount();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const token = localStorage.getItem('meetup_token');
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/friends/request/reject/${requestId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setFriends(friends.filter(r => r._id !== requestId));
        fetchPendingCount();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleCancel = async (requestId) => {
    try {
      const token = localStorage.getItem('meetup_token');
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/friends/request/cancel/${requestId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setFriends(friends.filter(r => r._id !== requestId));
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col"
    >
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <h1 className="text-3xl font-bold text-white">Friends</h1>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2">
          {[
            { id: 'friends', label: 'Friends', icon: Users },
            { id: 'pending', label: `Pending (${pendingCount})`, icon: Clock },
            { id: 'sent', label: 'Sent', icon: UserPlus }
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : friends.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {activeTab === 'friends' && 'No friends yet. Send friend requests!'}
                {activeTab === 'pending' && 'No pending requests'}
                {activeTab === 'sent' && 'No sent requests'}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {friends.map((item, index) => {
                  const user = activeTab === 'friends' ? item : item.senderId || item.receiverId;
                  const isRequest = activeTab !== 'friends';

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:bg-slate-700/50 transition-all"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold">
                            {user.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{user.username}</p>
                          <p className="text-xs text-gray-400">
                            {user.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        {activeTab === 'friends' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onStartChat(user._id)}
                              className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Chat</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRemoveFriend(user._id)}
                              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </>
                        )}

                        {activeTab === 'pending' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAccept(item._id, user._id)}
                              className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
                            >
                              Accept
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReject(item._id)}
                              className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
                            >
                              Reject
                            </motion.button>
                          </>
                        )}

                        {activeTab === 'sent' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCancel(item._id)}
                            className="w-full px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg transition-colors text-sm"
                          >
                            Cancel
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FriendsPage;
