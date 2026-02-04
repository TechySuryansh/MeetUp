import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useApp } from '../../context/AppContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const ChatPage = ({ onBack }) => {
  const { fetchConversations } = useChat();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchConversations();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchConversations]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen bg-slate-900 flex flex-col md:flex-row"
    >
      {/* Header for mobile */}
      {isMobile && (
        <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 p-4 flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
        </div>
      )}

      {/* Chat List - Hidden on mobile if conversation selected */}
      {!isMobile || !selectedConversation ? (
        <div className={`${isMobile ? 'w-full' : 'w-80'} h-full border-r border-slate-700/50 flex flex-col`}>
          <ChatList
            onSelectConversation={setSelectedConversation}
            selectedConversationId={selectedConversation?._id}
          />
        </div>
      ) : null}

      {/* Chat Window - Hidden on mobile if no conversation selected */}
      {!isMobile || selectedConversation ? (
        <div className={`${isMobile ? 'w-full' : 'flex-1'} h-full flex flex-col`}>
          {isMobile && selectedConversation && (
            <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 p-4 flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedConversation(null)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
            </div>
          )}
          <ChatWindow conversation={selectedConversation} />
        </div>
      ) : null}
    </motion.div>
  );
};

export default ChatPage;
