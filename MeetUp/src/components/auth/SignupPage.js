import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const SignupPage = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useApp();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      return 'Please fill in all fields';
    }
    
    if (formData.username.length < 2) {
      return 'Username must be at least 2 characters';
    }
    
    if (formData.username.length > 20) {
      return 'Username must be less than 20 characters';
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      return 'Username can only contain letters, numbers, hyphens, and underscores';
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signup(formData.username, formData.email, formData.password);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-300 via-dark-200 to-dark-300 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Join Meet<span className="text-primary-500">Up</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Create your account to start video calling
          </p>
        </div>

        <div className="card animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe123"
                className={`input-field w-full ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
                autoFocus
              />
            </div>

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
                placeholder="At least 8 characters"
                className={`input-field w-full ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
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
              disabled={isLoading || !formData.username || !formData.email || !formData.password || !formData.confirmPassword}
              className={`btn-primary w-full py-3 text-lg font-semibold ${
                isLoading || !formData.username || !formData.email || !formData.password || !formData.confirmPassword
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-lg transform hover:scale-105'
              } transition-all duration-200`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Free to join
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Secure & private
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              No downloads
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;