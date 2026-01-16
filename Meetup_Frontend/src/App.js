import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import LandingPage from './components/LandingPage';
import AuthContainer from './components/auth/AuthContainer';
import Dashboard from './components/Dashboard';
import CallScreen from './components/Call/CallScreen';
import './index.css';

const AppRoutes = () => {
  const { isAuthenticated, activeCall, remoteSocketId, endCall, socket } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  // If user is not authenticated
  if (!isAuthenticated) {
    // Show auth form if user clicked Sign In or Host
    if (showAuth) {
      return <AuthContainer onBack={() => setShowAuth(false)} />;
    }
    // Otherwise show landing page
    return (
      <LandingPage 
        onSignIn={() => setShowAuth(true)}
        onHostMeeting={() => setShowAuth(true)}
        onJoinMeeting={(meetingId) => {
          console.log('Joining meeting:', meetingId);
          setShowAuth(true);
        }}
      />
    );
  }

  // If user is in an active call, show call screen
  if (activeCall) {
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