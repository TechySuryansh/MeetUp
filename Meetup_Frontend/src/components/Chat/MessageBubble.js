import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Copy, Reply, Edit2, Trash2, Smile } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const MessageBubble = ({ message, isOwn, showAvatar }) => {
  const { deleteMessage, editMessage } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      await deleteMessage(message._id, message.conversationId, true);
      setShowMenu(false);
    }
  };

  const handleEdit = async () => {
    if (editedContent.trim() && editedContent !== message.content) {
      await editMessage(message._id, message.conversationId, editedContent);
      setIsEditing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = () => {
    if (message.status === 'sent') return '✓';
    if (message.status === 'delivered') return '✓✓';
    if (message.status === 'seen') return '✓✓';
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
    >
      <div className={`flex items-end space-x-2 max-w-xs ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
            {message.senderId.username?.charAt(0).toUpperCase()}
          </div>
        )}
        {showAvatar && isOwn && <div className="w-8 h-8" />}

        {/* Message Content */}
        <div className={`relative ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`px-4 py-2 rounded-2xl ${
              isOwn
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-slate-700 text-gray-100 rounded-bl-none'
            }`}
          >
            {/* Reply To */}
            {message.replyTo && (
              <div className={`text-xs mb-2 pb-2 border-b ${
                isOwn ? 'border-blue-400' : 'border-slate-600'
              }`}>
                <p className={isOwn ? 'text-blue-200' : 'text-gray-400'}>
                  Replying to {message.replyTo.senderId?.username}
                </p>
                <p className="truncate opacity-75">{message.replyTo.content}</p>
              </div>
            )}

            {/* Message Type */}
            {message.type === 'image' && message.media?.url && (
              <img
                src={message.media.url}
                alt="Message"
                className="max-w-xs rounded-lg mb-2"
              />
            )}

            {message.type === 'file' && message.media && (
              <a
                href={message.media.url}
                download
                className="flex items-center space-x-2 hover:underline"
              >
                <span>📎</span>
                <span className="truncate">{message.media.fileName}</span>
              </a>
            )}

            {/* Text Content */}
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full px-2 py-1 bg-slate-600 rounded text-white text-sm"
                rows="2"
              />
            ) : (
              <p className="break-words">{message.content}</p>
            )}

            {/* Edited Indicator */}
            {message.isEdited && !isEditing && (
              <p className="text-xs opacity-75 mt-1">(edited)</p>
            )}

            {/* Reactions */}
            {message.reactions && message.reactions.size > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Array.from(message.reactions.entries()).map(([emoji, users]) => (
                  <div
                    key={emoji}
                    className={`text-xs px-2 py-1 rounded-full ${
                      isOwn ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                  >
                    {emoji} {users.length}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Message Info */}
          <div className={`flex items-center space-x-1 mt-1 text-xs ${
            isOwn ? 'justify-end' : 'justify-start'
          } text-gray-400`}>
            <span>{formatTime(message.createdAt)}</span>
            {isOwn && (
              <span className={message.status === 'seen' ? 'text-blue-400' : ''}>
                {getStatusIcon()}
              </span>
            )}
          </div>

          {/* Edit/Delete Buttons */}
          {isEditing && (
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(message.content);
                }}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Context Menu */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-white"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg z-50"
            >
              <button
                onClick={handleCopy}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-slate-600 flex items-center space-x-2 rounded-t-lg"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>

              <button
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-slate-600 flex items-center space-x-2"
              >
                <Reply className="w-4 h-4" />
                <span>Reply</span>
              </button>

              {isOwn && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-slate-600 flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-600 flex items-center space-x-2 rounded-b-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </>
              )}

              <button
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-slate-600 flex items-center space-x-2 rounded-b-lg"
              >
                <Smile className="w-4 h-4" />
                <span>React</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
