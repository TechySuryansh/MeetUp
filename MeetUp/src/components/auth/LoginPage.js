import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const LoginPage = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useApp();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-300 via-dark-200 to-dark-300 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome Back to Meet<span className="text-primary-500">Up</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Sign in to start video calling
          </p>
        </div>

        <div className="card animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={`input-field w-full ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`input-field w-full ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-400 px-4 py-3 rounded-lg animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className={`btn-primary w-full py-3 text-lg font-semibold ${
                isLoading || !formData.email || !formData.password
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-lg transform hover:scale-105'
              } transition-all duration-200`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={onSwitchToSignup}
                  className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Sign up here
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Secure login
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              HD video calls
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              Real-time chat
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;