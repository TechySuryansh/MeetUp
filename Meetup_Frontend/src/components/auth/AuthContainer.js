import React, { useState } from 'react';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';

const AuthContainer = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToSignup = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <>
      {isLogin ? (
        <LoginPage onSwitchToSignup={switchToSignup} onBack={onBack} />
      ) : (
        <SignupPage onSwitchToLogin={switchToLogin} onBack={onBack} />
      )}
    </>
  );
};

export default AuthContainer;