import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MessageCircle, Users } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useApp } from '../../context/AppContext';

const ChatList = ({ onSelectConversation, selectedConversationId }) => {
  const { conversations, fetchConversations, unreadCounts, loading } = useChat();
  const { currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conv => {
        if (conv.type === 'group') {
          return conv.groupName.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          const otherUser = conv.participants.find(p => p._id !== currentUser?.id);
          return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
        }
      });
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations, currentUser]);

  const getConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.groupName;
    } else {
      const otherUser = conversation.participants.find(p => p._id !== currentUser?.id);
      return otherUser?.username || 'Unknown';
    }
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.groupImage || '👥';
    } else {
      const otherUser = conversation.participants.find(p => p._id !== currentUser?.id);
      return otherUser?.avatar || '👤';
    }
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const msg = conversation.lastMessage;
    if (msg.type === 'image') return '📷 Image';
    if (msg.type === 'file') return '📎 File';
    if (msg.type === 'video') return '🎥 Video';
    
    return msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-2xl font-bold text-white mb-4">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {loading && !filteredConversations.length ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 text-center text-gray-400"
            >
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start a new chat to begin messaging</p>
            </motion.div>
          ) : (
            filteredConversations.map((conversation, index) => {
              const unreadCount = unreadCounts.get(conversation._id) || 0;
              const isSelected = selectedConversationId === conversation._id;

              return (
                <motion.div
                  key={conversation._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-4 border-b border-slate-700/30 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-500/20 border-l-4 border-l-blue-500'
                      : 'hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                      {getConversationAvatar(conversation)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-medium truncate">
                          {getConversationName(conversation)}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(conversation.lastMessageAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400 truncate">
                          {getLastMessagePreview(conversation)}
                        </p>
                        
                        {unreadCount > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0"
                          >
                            <span className="text-white text-xs font-bold">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatList;
