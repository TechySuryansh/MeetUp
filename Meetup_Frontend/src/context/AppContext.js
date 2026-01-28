import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const AppContext = createContext();

const initialState = {
  currentUser: null,
  token: localStorage.getItem('meetup_token'),
  isAuthenticated: false,
  onlineUsers: [],
  activeCall: null,
  incomingCall: null,
  remoteSocketId: null,
  isConnected: false,
  socket: null, // Store socket in state for proper re-renders
  activeRoomId: null, // Track active room for reconnection
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_AUTH_STATE':
      return {
        ...state,
        currentUser: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.user
      };
    case 'LOGOUT':
      return {
        ...initialState,
        token: null,
      };
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    case 'SET_ACTIVE_CALL':
      return { ...state, activeCall: action.payload };
    case 'SET_INCOMING_CALL':
      return { ...state, incomingCall: action.payload };
    case 'SET_REMOTE_SOCKET_ID':
      return { ...state, remoteSocketId: action.payload };
    case 'SET_INCOMING_INVITE':
      return { ...state, incomingInvite: action.payload };
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_ACTIVE_ROOM_ID':
      return { ...state, activeRoomId: action.payload };
    case 'RESET_CALL_STATE':
      return {
        ...state,
        activeCall: null,
        incomingCall: null,
        remoteSocketId: null,
        incomingInvite: null,
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const socketRef = useRef(null);

  // Check for existing token on app start
  useEffect(() => {
    const token = localStorage.getItem('meetup_token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  // Socket connection effect
  useEffect(() => {
    if (state.currentUser && state.isAuthenticated) {
      console.log('🔌 Initializing socket connection for user:', state.currentUser.username);

      // Create socket connection
      const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('🟢 Socket connected:', socket.id);
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
        dispatch({ type: 'SET_SOCKET', payload: socket });

        // Emit user-joined with user data
        const userData = {
          id: state.currentUser.id,
          username: state.currentUser.username,
          email: state.currentUser.email,
        };
        console.log('📤 Emitting user-joined:', userData);
        socket.emit('user-joined', userData);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
        dispatch({ type: 'SET_SOCKET', payload: socket });

        // Re-emit user-joined on reconnection
        const userData = {
          id: state.currentUser.id,
          username: state.currentUser.username,
          email: state.currentUser.email,
        };
        console.log('📤 Re-emitting user-joined after reconnect:', userData);
        socket.emit('user-joined', userData);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Reconnection attempt', attemptNumber);
      });

      socket.on('reconnect_failed', () => {
        console.log('❌ Reconnection failed');
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
      });

      socket.on('connect_error', (error) => {
        console.log('🔴 Socket connection error:', error.message);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔴 Socket disconnected:', reason);
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });

        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect') {
          // Server disconnected the socket, need to reconnect manually
          socket.connect();
        }
      });

      socket.on('users-list', (users) => {
        console.log('📋 Users list received:', users);
        console.log('📋 Number of users:', users.length);
        dispatch({ type: 'SET_ONLINE_USERS', payload: users });
      });

      socket.on('incoming-call', ({ from, callerInfo }) => {
        console.log('📞 Incoming call from:', from, callerInfo);
        dispatch({
          type: 'SET_INCOMING_CALL',
          payload: { from, callerInfo }
        });
      });

      socket.on('room-invite', ({ roomId, inviterName }) => {
        console.log('📩 Received room invite from:', inviterName, 'for room:', roomId);
        dispatch({
          type: 'SET_INCOMING_INVITE',
          payload: { roomId, inviterName }
        });
      });

      socket.on('call-accepted', ({ from }) => {
        console.log('✅ Call accepted by:', from);
        dispatch({ type: 'SET_REMOTE_SOCKET_ID', payload: from });
      });

      socket.on('call-rejected', () => {
        console.log('❌ Call rejected');
        dispatch({ type: 'RESET_CALL_STATE' });
      });

      socket.on('call-ended', () => {
        console.log('📴 Call ended');
        dispatch({ type: 'RESET_CALL_STATE' });
      });

      return () => {
        socket.off('users-list');
        socket.off('incoming-call');
        socket.off('room-invite');
        socket.off('call-accepted');
        socket.off('call-rejected');
        socket.off('call-ended');
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [state.currentUser, state.isAuthenticated]);

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const url = `${process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (state.token) {
      headers.Authorization = `Bearer ${state.token}`;
    }
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
  };

  const signup = async (username, email, password) => {
    await apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    return login(email, password);
  };

  const login = async (email, password) => {
    const data = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('meetup_token', data.token);
    dispatch({ type: 'SET_AUTH_STATE', payload: { user: data.user, token: data.token } });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('meetup_token');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    dispatch({ type: 'LOGOUT' });
  };

  const verifyToken = async (token) => {
    try {
      const url = `${process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}/api/auth/me`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      console.log('✅ Token verified, user:', data.user);
      dispatch({ type: 'SET_AUTH_STATE', payload: { user: data.user, token } });
    } catch (err) {
      console.log('❌ Token verification failed:', err.message);
      localStorage.removeItem('meetup_token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const callUser = (targetUser) => {
    if (socketRef.current && targetUser.socketId) {
      console.log('📞 Calling user:', targetUser);
      dispatch({
        type: 'SET_ACTIVE_CALL',
        payload: { id: Date.now().toString(), isVideo: true, target: targetUser }
      });
      dispatch({ type: 'SET_REMOTE_SOCKET_ID', payload: targetUser.socketId });
      socketRef.current.emit('call-user', {
        to: targetUser.socketId,
        callerInfo: state.currentUser
      });
    }
  };

  const acceptCall = () => {
    if (socketRef.current && state.incomingCall) {
      console.log('✅ Accepting call');
      dispatch({
        type: 'SET_ACTIVE_CALL',
        payload: { id: Date.now().toString(), isVideo: true }
      });
      dispatch({ type: 'SET_REMOTE_SOCKET_ID', payload: state.incomingCall.from });
      socketRef.current.emit('call-accepted', { to: state.incomingCall.from });
      dispatch({ type: 'SET_INCOMING_CALL', payload: null });
    }
  };

  const rejectCall = () => {
    if (socketRef.current && state.incomingCall) {
      socketRef.current.emit('call-rejected', { to: state.incomingCall.from });
      dispatch({ type: 'SET_INCOMING_CALL', payload: null });
    }
  };

  const endCall = () => {
    if (socketRef.current && state.remoteSocketId) {
      socketRef.current.emit('call-ended', { to: state.remoteSocketId });
    }
    dispatch({ type: 'RESET_CALL_STATE' });
  };

  return (
    <AppContext.Provider value={{
      ...state,
      socket: state.socket, // Use socket from state instead of ref
      signup,
      login,
      logout,
      leaveApp: logout,
      callUser,
      acceptCall,
      rejectCall,
      endCall,
      dispatch,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};