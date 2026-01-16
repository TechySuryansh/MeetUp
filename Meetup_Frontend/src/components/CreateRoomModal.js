import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const CreateRoomModal = ({ onClose, onStartCall }) => {
  const { currentUser } = useApp();
  const [roomName, setRoomName] = useState('');
  const [isVideo, setIsVideo] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateRoomId = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Generate room ID
      const roomId = generateRoomId();
      const room = {
        id: roomId,
        name: roomName || `Room ${roomId.slice(0, 6)}`,
        isVideo,
        createdAt: new Date().toISOString(),
      };
      
      // Simulate creation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCreatedRoom(room);
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const copyRoomId = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyRoomLink = () => {
    if (createdRoom) {
      const link = `${window.location.origin}?room=${createdRoom.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartCall = () => {
    if (createdRoom && onStartCall) {
      onStartCall(createdRoom);
    }
    onClose();
  };

  // Show success screen after room is created
  if (createdRoom) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-gray-700 animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white">Room Created!</h3>
            <p className="text-gray-400 mt-2">{createdRoom.name}</p>
          </div>

          <div className="space-y-4">
            {/* Room ID */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room ID</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={createdRoom.id}
                  readOnly
                  className="flex-1 bg-slate-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm"
                />
                <button
                  onClick={copyRoomId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Share Link */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Share Link</label>
              <button
                onClick={copyRoomLink}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-gray-600 rounded-lg text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Copy Invite Link</span>
              </button>
            </div>

            {/* Info */}
            <div className="bg-slate-700/50 rounded-lg p-4 text-sm text-gray-400">
              <p>Share the Room ID or link with others to invite them to join your {createdRoom.isVideo ? 'video' : 'audio'} call.</p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleStartCall}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Start Call
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              className="w-full bg-slate-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
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
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
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
