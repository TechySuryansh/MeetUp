import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, Phone, Video, Info, Search, MessageCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useApp } from '../../context/AppContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ conversation }) => {
  const {
    messages,
    typingUsers,
    fetchMessages,
    sendMessage,
    sendTypingIndicator,
    markMessagesSeen,
    loading
  } = useChat();
  const { currentUser } = useApp();

  const [messageInput, setMessageInput] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation) {
      setPage(1);
      fetchMessages(conversation._id, 1);
      markMessagesSeen(conversation._id);
    }
  }, [conversation, fetchMessages, markMessagesSeen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (conversation && currentUser) {
      sendTypingIndicator(conversation._id, currentUser.id, currentUser.username);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversation) return;

    try {
      await sendMessage(conversation._id, messageInput.trim());
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Load more messages (infinite scroll)
  const handleLoadMore = async () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchMessages(conversation._id, nextPage);
    }
  };

  if (!conversation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const getConversationName = () => {
    if (conversation.type === 'group') {
      return conversation.groupName;
    } else {
      const otherUser = conversation.participants.find(p => p._id !== currentUser?.id);
      return otherUser?.username || 'Unknown';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{getConversationName()}</h2>
          {conversation.type === 'group' && (
            <p className="text-sm text-gray-400">
              {conversation.participants.length} members
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Phone className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Video className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Info className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col"
      >
        {/* Load More Button */}
        {hasMore && messages.length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleLoadMore}
            disabled={loading}
            className="mx-auto px-4 py-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load earlier messages'}
          </motion.button>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No messages yet. Start the conversation!</p>
              </div>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.senderId._id === currentUser?.id}
                showAvatar={
                  index === 0 ||
                  messages[index - 1].senderId._id !== message.senderId._id
                }
              />
            ))
          )}
        </AnimatePresence>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-t border-slate-700/50 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          {/* Attachment Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type a message..."
              rows="1"
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              style={{ maxHeight: '120px' }}
            />
          </div>

          {/* Emoji Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!messageInput.trim()}
            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
