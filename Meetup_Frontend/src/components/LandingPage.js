import React, { useState } from 'react';

const LandingPage = ({ onJoinMeeting, onHostMeeting, onSignIn }) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [meetingId, setMeetingId] = useState('');

  const handleJoin = () => {
    if (meetingId.trim()) {
      onJoinMeeting?.(meetingId);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-100 via-blue-50 to-gray-200">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-100/40 rounded-full blur-2xl"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md w-full bg-white/60 backdrop-blur-sm rounded-2xl p-10 shadow-xl border border-white/50">
            {/* Logo */}
            <h1 className="text-5xl font-bold text-blue-600 mb-2 tracking-tight">
              MeetUp
            </h1>

            {/* Tagline */}
            <h2 className="text-2xl text-gray-700 mb-12 font-light">
              Video Conferencing
            </h2>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Join Button */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="w-28 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
                >
                  Join
                </button>
                <span className="text-gray-600 text-sm flex-1 text-left">
                  Connect to a meeting in progress
                </span>
              </div>

              {/* Host Button */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={onHostMeeting}
                  className="w-28 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
                >
                  Host
                </button>
                <span className="text-gray-600 text-sm flex-1 text-left">
                  Start a meeting
                </span>
              </div>

              {/* Sign In Button */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={onSignIn}
                  className="w-28 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
                >
                  Sign in
                </button>
                <span className="text-gray-600 text-sm flex-1 text-left">
                  Configure your account
                </span>
              </div>
            </div>

            {/* Made with */}
            <p className="mt-10 text-gray-500 text-sm">
              Made with <span className="text-blue-600 font-medium">MeetUp</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 border-t border-gray-300/50 bg-white/50 backdrop-blur-sm">
          <div className="flex justify-center gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Getting Started</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Download Client</a>
            <a href="#" className="hover:text-blue-600 transition-colors">MeetUp Support</a>
          </div>
        </div>
      </div>

      {/* Join Meeting Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Join a Meeting</h3>
            <input
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Enter Meeting ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mb-4 text-gray-900"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={!meetingId.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
