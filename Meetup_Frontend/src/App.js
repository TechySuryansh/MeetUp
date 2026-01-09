import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import CallInterface from './components/CallInterface';
import './index.css';

const AppRoutes = () => {
  const { currentUser, activeCall } = useApp();

  // If user is not logged in, show landing page
  if (!currentUser) {
    return <LandingPage />;
  }

  // If user is in an active call, show call interface
  if (activeCall) {
    return <CallInterface />;
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