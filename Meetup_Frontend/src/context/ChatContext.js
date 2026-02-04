import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const ChatContext = createContext();

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  typingUsers: [],
  onlineUsers: new Map(),
  unreadCounts: new Map(),
  loading: false,
  error: null,
  socket: null,
  isConnected: false
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg._id === action.payload._id ? action.payload : msg
        )
      };
    
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg._id !== action.payload)
      };
    
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };
    
    case 'ADD_TYPING_USER':
      return {
        ...state,
        typingUsers: [...new Set([...state.typingUsers, action.payload])]
      };
    
    case 'REMOVE_TYPING_USER':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(u => u !== action.payload)
      };
    
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    
    case 'UPDATE_USER_STATUS':
      const newOnlineUsers = new Map(state.onlineUsers);
      newOnlineUsers.set(action.payload.userId, action.payload.status);
      return { ...state, onlineUsers: newOnlineUsers };
    
    case 'SET_UNREAD_COUNTS':
      return { ...state, unreadCounts: action.payload };
    
    case 'UPDATE_UNREAD_COUNT':
      const newUnreadCounts = new Map(state.unreadCounts);
      newUnreadCounts.set(action.payload.conversationId, action.payload.count);
      return { ...state, unreadCounts: newUnreadCounts };
    
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;
    dispatch({ type: 'SET_SOCKET', payload: socket });

    socket.on('connect', () => {
      console.log('💬 Chat socket connected:', socket.id);
      dispatch({ type: 'SET_CONNECTED', payload: true });
    });

    socket.on('disconnect', () => {
      console.log('💬 Chat socket disconnected');
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    // Message events
    socket.on('message-received', (message) => {
      console.log('📨 Message received:', message);
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socket.on('message-status-updated', (data) => {
      console.log('📦 Message status updated:', data);
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: { ...data, _id: data.messageId }
      });
    });

    socket.on('message-edited', (message) => {
      console.log('✏️ Message edited:', message);
      dispatch({ type: 'UPDATE_MESSAGE', payload: message });
    });

    socket.on('message-deleted', (data) => {
      console.log('🗑️ Message deleted:', data);
      if (data.deleteForEveryone) {
        dispatch({ type: 'DELETE_MESSAGE', payload: data.messageId });
      }
    });

    // Typing indicators
    socket.on('user-typing', (data) => {
      if (data.isTyping) {
        dispatch({ type: 'ADD_TYPING_USER', payload: data.userId });
      } else {
        dispatch({ type: 'REMOVE_TYPING_USER', payload: data.userId });
      }
    });

    // Reactions
    socket.on('reaction-added', (data) => {
      console.log('😊 Reaction added:', data);
      // Handle reaction update
    });

    socket.on('reaction-removed', (data) => {
      console.log('😢 Reaction removed:', data);
      // Handle reaction removal
    });

    // User status
    socket.on('user-status-changed', (data) => {
      console.log('👤 User status changed:', data);
      dispatch({ type: 'UPDATE_USER_STATUS', payload: data });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // API call helper
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const url = `${process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}${endpoint}`;
    const token = localStorage.getItem('meetup_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async (page = 1, search = '') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiCall(`/api/chat/conversations?page=${page}&search=${search}`);
      dispatch({ type: 'SET_CONVERSATIONS', payload: response.data });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiCall]);

  // Get or create private conversation
  const getOrCreatePrivateConversation = useCallback(async (recipientId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiCall(`/api/chat/conversations/private/${recipientId}`);
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: response.data });
      
      // Join conversation room
      if (socketRef.current) {
        socketRef.current.emit('join-conversation', response.data._id);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiCall]);

  // Create group conversation
  const createGroupConversation = useCallback(async (groupName, participantIds, groupImage, groupDescription) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiCall('/api/chat/conversations/group', {
        method: 'POST',
        body: JSON.stringify({
          groupName,
          participantIds,
          groupImage,
          groupDescription
        })
      });
      
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: response.data });
      
      // Join conversation room
      if (socketRef.current) {
        socketRef.current.emit('join-conversation', response.data._id);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating group conversation:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiCall]);

  // Fetch messages
  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiCall(`/api/chat/conversations/${conversationId}/messages?page=${page}`);
      
      if (page === 1) {
        dispatch({ type: 'SET_MESSAGES', payload: response.data });
      } else {
        // Prepend older messages for infinite scroll
        dispatch({
          type: 'SET_MESSAGES',
          payload: [...response.data, ...state.messages]
        });
      }
      
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiCall, state.messages]);

  // Send message
  const sendMessage = useCallback(async (conversationId, content, type = 'text', media = null, replyTo = null) => {
    try {
      const response = await apiCall(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          type,
          media,
          replyTo
        })
      });

      // Emit via socket for real-time delivery
      if (socketRef.current) {
        socketRef.current.emit('send-message', {
          conversationId,
          content,
          type,
          media,
          replyTo,
          senderId: response.data.senderId._id
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [apiCall]);

  // Edit message
  const editMessage = useCallback(async (messageId, conversationId, content) => {
    try {
      const response = await apiCall(`/api/chat/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      });

      // Emit via socket
      if (socketRef.current) {
        socketRef.current.emit('edit-message', {
          messageId,
          conversationId,
          content
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }, [apiCall]);

  // Delete message
  const deleteMessage = useCallback(async (messageId, conversationId, deleteForEveryone = false) => {
    try {
      const response = await apiCall(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ deleteForEveryone })
      });

      // Emit via socket
      if (socketRef.current) {
        socketRef.current.emit('delete-message', {
          messageId,
          conversationId,
          deleteForEveryone
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, [apiCall]);

  // Mark messages as seen
  const markMessagesSeen = useCallback(async (conversationId) => {
    try {
      const userId = localStorage.getItem('userId');
      await apiCall(`/api/chat/conversations/${conversationId}/mark-seen`, {
        method: 'POST'
      });

      // Emit via socket
      if (socketRef.current) {
        state.messages.forEach(msg => {
          if (msg.senderId._id !== userId) {
            socketRef.current.emit('message-seen', {
              messageId: msg._id,
              conversationId,
              userId
            });
          }
        });
      }
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  }, [apiCall, state.messages]);

  // Typing indicator
  const sendTypingIndicator = useCallback((conversationId, userId, username) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        conversationId,
        userId,
        username
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stop-typing', {
          conversationId,
          userId
        });
      }, 3000);
    }
  }, []);

  // Add reaction
  const addReaction = useCallback(async (messageId, conversationId, emoji, userId) => {
    try {
      const response = await apiCall(`/api/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });

      // Emit via socket
      if (socketRef.current) {
        socketRef.current.emit('add-reaction', {
          messageId,
          conversationId,
          emoji,
          userId
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [apiCall]);

  // Remove reaction
  const removeReaction = useCallback(async (messageId, conversationId, emoji, userId) => {
    try {
      const response = await apiCall(`/api/chat/messages/${messageId}/reactions`, {
        method: 'DELETE',
        body: JSON.stringify({ emoji })
      });

      // Emit via socket
      if (socketRef.current) {
        socketRef.current.emit('remove-reaction', {
          messageId,
          conversationId,
          emoji,
          userId
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  }, [apiCall]);

  // Search messages
  const searchMessages = useCallback(async (conversationId, query, page = 1) => {
    try {
      const response = await apiCall(
        `/api/chat/conversations/${conversationId}/search?query=${query}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
    }
  }, [apiCall]);

  const value = {
    ...state,
    fetchConversations,
    getOrCreatePrivateConversation,
    createGroupConversation,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markMessagesSeen,
    sendTypingIndicator,
    addReaction,
    removeReaction,
    searchMessages,
    dispatch
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
