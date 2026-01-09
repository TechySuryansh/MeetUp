import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const CreateRoomModal = ({ onClose }) => {
  const [roomName, setRoomName] = useState('');
  const [isVideo, setIsVideo] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { startCall } = useApp();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Simulate room creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start call with empty participants (room-based call)
      startCall([], isVideo);
      onClose();
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-gray-700 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Create New Room</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreateRoom} className="space-y-6">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
              Room Name (Optional)
            </label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="My Awesome Room"
              className="input-field w-full"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Call Type
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="callType"
                  checked={isVideo}
                  onChange={() => setIsVideo(true)}
                  className="sr-only"
                  disabled={isCreating}
                />
                <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                  isVideo ? 'border-blue-500 bg-blue-500' : 'border-gray-500'
                }`}>
                  {isVideo && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white">Video Call</span>
                </div>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="callType"
                  checked={!isVideo}
                  onChange={() => setIsVideo(false)}
                  className="sr-only"
                  disabled={isCreating}
                />
                <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                  !isVideo ? 'border-blue-500 bg-blue-500' : 'border-gray-500'
                }`}>
                  {!isVideo && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-white">Audio Only</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isCreating}
            >
              {isCreating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="text-center text-sm text-gray-400">
            <p>Room ID will be generated automatically</p>
            <p className="text-xs mt-1">Share it with others to invite them</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;