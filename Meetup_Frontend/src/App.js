import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AuthContainer from './components/auth/AuthContainer';
import Dashboard from './components/Dashboard';
import CallScreen from './components/Call/CallScreen';
import './index.css';

const AppRoutes = () => {
  const { isAuthenticated, activeCall, remoteSocketId, endCall, socket } = useApp();

  // If user is not authenticated, show auth pages
  if (!isAuthenticated) {
    return <AuthContainer />;
  }

  // If user is in an active call, show call screen
  if (activeCall && remoteSocketId) {
    return (
      <CallScreen 
        remoteSocketId={remoteSocketId} 
        onEndCall={endCall}
        socket={socket}
      />
    );
  }

  // Otherwise show dashboard
  return <Dashboard />;
};

const App = () => {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<AppRoutes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;