import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AuthContainer from './components/auth/AuthContainer';
import Dashboard from './components/Dashboard';
import CallInterface from './components/CallInterface';
import './index.css';

const AppRoutes = () => {
  const { isAuthenticated, activeCall } = useApp();

  // If user is not authenticated, show auth pages
  if (!isAuthenticated) {
    return <AuthContainer />;
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