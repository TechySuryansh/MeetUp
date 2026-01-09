import React, { createContext, useContext, useReducer, useEffect } from 'react';
import io from 'socket.io-client';

const AppContext = createContext();

const initialState = {
  currentUser: null,
  token: localStorage.getItem('meetup_token'),
  isAuthenticated: false,
  onlineUsers: [],
  activeCall: null,
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
        onlineUsers: [...state.onlineUsers.filter(u => u.id !== action.payload.id), action.payload] 
      };
    case 'REMOVE_ONLINE_USER':
      return { 
        ...state, 
        onlineUsers: state.onlineUsers.filter(u => u.id !== action.payload) 
      };
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    case 'SET_ACTIVE_CALL':
      return { ...state, activeCall: action.payload };
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
      // Verify token with backend
      verifyToken(token);
    }
  }, []);

  useEffect(() => {
    // Initialize socket connection when user is authenticated
    if (state.currentUser && state.isAuthenticated && !state.socket) {
      const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
        auth: {
          token: state.token
        }
      });
      
      socket.on('connect', () => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
        socket.emit('user-joined', state.currentUser);
      });

      socket.on('disconnect', () => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
      });

      socket.on('users-list', (users) => {
        dispatch({ type: 'SET_ONLINE_USERS', payload: users });
      });

      socket.on('user-joined', (user) => {
        dispatch({ type: 'ADD_ONLINE_USER', payload: user });
      });

      socket.on('user-left', (userId) => {
        dispatch({ type: 'REMOVE_ONLINE_USER', payload: userId });
      });

      dispatch({ type: 'SET_SOCKET', payload: socket });

      return () => {
        socket.disconnect();
      };
    }
  }, [state.currentUser, state.isAuthenticated, state.socket, state.token]);

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
      const data = await apiCall('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });

      // Auto-login after successful signup
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

      // Store token and user data
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
      // Token is invalid, remove it
      localStorage.removeItem('meetup_token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Legacy function for backward compatibility
  const joinApp = (username) => {
    const user = {
      id: Date.now().toString(),
      username,
      joinedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SET_CURRENT_USER', payload: user });
  };

  const leaveApp = () => {
    logout();
  };

  const startCall = (targetUsers, isVideo = false) => {
    const callData = {
      id: Date.now().toString(),
      initiator: state.currentUser,
      participants: [state.currentUser, ...targetUsers],
      isVideo,
      startedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SET_ACTIVE_CALL', payload: callData });
    
    if (state.socket) {
      state.socket.emit('start-call', callData);
    }
  };

  const joinCall = (callId) => {
    if (state.socket) {
      state.socket.emit('join-call', { callId, user: state.currentUser });
    }
  };

  const leaveCall = () => {
    if (state.socket && state.activeCall) {
      state.socket.emit('leave-call', { 
        callId: state.activeCall.id, 
        userId: state.currentUser.id 
      });
    }
    
    // Clean up local stream
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
    joinApp,
    leaveApp,
    startCall,
    joinCall,
    leaveCall,
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