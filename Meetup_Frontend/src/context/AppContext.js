import React, { createContext, useContext, useReducer, useEffect } from 'react';
import io from 'socket.io-client';

const AppContext = createContext();

const initialState = {
  currentUser: null,
  token: localStorage.getItem('meetup_token'),
  isAuthenticated: false,
  onlineUsers: [],
  activeCall: null,
  incomingCall: null,  // NEW: For incoming call modal
  remoteSocketId: null, // NEW: Socket ID of the person we're calling
  socket: null,
  isConnected: false,
  callRoom: null,
  localStream: null,
  remoteStreams: {},
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload, isAuthenticated: !!action.payload };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_AUTH_STATE':
      return { 
        ...state, 
        currentUser: action.payload.user, 
        token: action.payload.token,
        isAuthenticated: !!action.payload.user 
      };
    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
        token: null,
        isAuthenticated: false,
        onlineUsers: [],
        activeCall: null,
        incomingCall: null,
        remoteSocketId: null,
        socket: null,
        isConnected: false,
        callRoom: null,
        localStream: null,
        remoteStreams: {},
      };
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    case 'ADD_ONLINE_USER':
      return { 
        ...state, 
        onlineUsers: [...state.onlineUsers.filter(u => u.socketId !== action.payload.socketId), action.payload] 
      };
    case 'REMOVE_ONLINE_USER':
      return { 
        ...state, 
        onlineUsers: state.onlineUsers.filter(u => u.socketId !== action.payload) 
      };
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    case 'SET_ACTIVE_CALL':
      return { ...state, activeCall: action.payload };
    case 'SET_INCOMING_CALL':
      return { ...state, incomingCall: action.payload };
    case 'SET_REMOTE_SOCKET_ID':
      return { ...state, remoteSocketId: action.payload };
    case 'SET_CALL_ROOM':
      return { ...state, callRoom: action.payload };
    case 'SET_LOCAL_STREAM':
      return { ...state, localStream: action.payload };
    case 'ADD_REMOTE_STREAM':
      return { 
        ...state, 
        remoteStreams: { 
          ...state.remoteStreams, 
          [action.payload.userId]: action.payload.stream 
        } 
      };
    case 'REMOVE_REMOTE_STREAM':
      const newRemoteStreams = { ...state.remoteStreams };
      delete newRemoteStreams[action.payload];
      return { ...state, remoteStreams: newRemoteStreams };
    case 'RESET_CALL_STATE':
      return {
        ...state,
        activeCall: null,
        incomingCall: null,
        remoteSocketId: null,
        callRoom: null,
        localStream: null,
        remoteStreams: {},
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Check for existing token on app start
  useEffect(() => {
    const token = localStorage.getItem('meetup_token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  useEffect(() => {
    // Initialize socket connection when user is authenticated
    if (state.currentUser && state.isAuthenticated && !state.socket) {
      const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
        transports: ['websocket'],
        auth: {
          token: state.token
        }
      });
      
      socket.on('connect', () => {
        console.log('🟢 Socket connected:', socket.id);
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
        socket.emit('user-joined', {
          ...state.currentUser,
          socketId: socket.id
        });
      });

      socket.on('disconnect', () => {
        console.log('🔴 Socket disconnected');
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
      });

      socket.on('users-list', (users) => {
        console.log('📋 Users list received:', users);
        dispatch({ type: 'SET_ONLINE_USERS', payload: users });
      });

      socket.on('user-joined', (user) => {
        console.log('👤 User joined:', user);
        dispatch({ type: 'ADD_ONLINE_USER', payload: user });
      });

      socket.on('user-left', (socketId) => {
        console.log('👤 User left:', socketId);
        dispatch({ type: 'REMOVE_ONLINE_USER', payload: socketId });
      });

      // Incoming call handler
      socket.on('incoming-call', ({ from, callerInfo }) => {
        console.log('📞 Incoming call from:', from);
        dispatch({ 
          type: 'SET_INCOMING_CALL', 
          payload: { from, callerInfo } 
        });
      });

      // Call accepted handler
      socket.on('call-accepted', ({ from }) => {
        console.log('✅ Call accepted by:', from);
        dispatch({ type: 'SET_REMOTE_SOCKET_ID', payload: from });
      });

      dispatch({ type: 'SET_SOCKET', payload: socket });

      return () => {
        socket.disconnect();
      };
    }
  }, [state.currentUser, state.isAuthenticated]);

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const url = `${process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(state.token && { Authorization: `Bearer ${state.token}` }),
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  };

  // Authentication functions
  const signup = async (username, email, password) => {
    try {
      await apiCall('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      return login(email, password);
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('meetup_token', data.token);
      dispatch({ 
        type: 'SET_AUTH_STATE', 
        payload: { user: data.user, token: data.token } 
      });

      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('meetup_token');
    if (state.socket) {
      state.socket.disconnect();
    }
    dispatch({ type: 'LOGOUT' });
  };

  const verifyToken = async (token) => {
    try {
      const data = await apiCall('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch({ 
        type: 'SET_AUTH_STATE', 
        payload: { user: data.user, token } 
      });
    } catch (error) {
      localStorage.removeItem('meetup_token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const leaveApp = () => {
    logout();
  };

  // Call a user by their socket ID
  const callUser = (targetUser) => {
    if (state.socket && targetUser.socketId) {
      console.log('📞 Calling user:', targetUser);
      
      // Set active call state
      dispatch({ 
        type: 'SET_ACTIVE_CALL', 
        payload: {
          id: Date.now().toString(),
          isVideo: true,
          initiator: state.currentUser,
          target: targetUser,
          startedAt: new Date().toISOString(),
        }
      });
      
      dispatch({ type: 'SET_REMOTE_SOCKET_ID', payload: targetUser.socketId });
      
      // Emit call-user event
      state.socket.emit('call-user', { 
        to: targetUser.socketId,
        callerInfo: state.currentUser
      });
    }
  };

  // Accept incoming call
  const acceptCall = () => {
    if (state.socket && state.incomingCall) {
      console.log('✅ Accepting call from:', state.incomingCall.from);
      
      // Set active call state
      dispatch({ 
        type: 'SET_ACTIVE_CALL', 
        payload: {
          id: Date.now().toString(),
          isVideo: true,
          initiator: state.incomingCall.callerInfo,
          startedAt: new Date().toISOString(),
        }
      });
      
      dispatch({ type: 'SET_REMOTE_SOCKET_ID', payload: state.incomingCall.from });
      
      // Emit call-accepted event
      state.socket.emit('call-accepted', { 
        to: state.incomingCall.from 
      });
      
      // Clear incoming call
      dispatch({ type: 'SET_INCOMING_CALL', payload: null });
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (state.socket && state.incomingCall) {
      console.log('❌ Rejecting call from:', state.incomingCall.from);
      state.socket.emit('call-rejected', { 
        to: state.incomingCall.from 
      });
      dispatch({ type: 'SET_INCOMING_CALL', payload: null });
    }
  };

  // End call
  const endCall = () => {
    if (state.socket && state.remoteSocketId) {
      state.socket.emit('call-ended', { 
        to: state.remoteSocketId 
      });
    }
    
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    
    dispatch({ type: 'RESET_CALL_STATE' });
  };

  const value = {
    ...state,
    signup,
    login,
    logout,
    leaveApp,
    callUser,
    acceptCall,
    rejectCall,
    endCall,
    dispatch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};