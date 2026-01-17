import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const CreateRoomModal = ({ onClose, onStartCall }) => {
  const { currentUser } = useApp();
  const [roomName, setRoomName] = useState('');
  const [isVideo, setIsVideo] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState('options'); // 'options', 'instant', 'later'

  const generateRoomId = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const createRoomObject = () => ({
    id: generateRoomId(),
    name: roomName || `Meeting ${new Date().toLocaleDateString()}`,
    isVideo,
    createdAt: new Date().toISOString(),
  });

  const handleCreateForLater = async () => {
    setIsCreating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const room = createRoomObject();
    setCreatedRoom(room);
    setView('later');
    setIsCreating(false);
  };

  const handleInstantMeeting = async (e) => {
    if (e) e.preventDefault();
    setIsCreating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const room = createRoomObject();
    if (onStartCall) {
      onStartCall(room);
    }
    onClose();
    setIsCreating(false);
  };

  const handleGoogleCalendar = () => {
    const room = createRoomObject();
    const link = `${window.location.origin}?room=${room.id}`;
    const title = encodeURIComponent(room.name);
    const details = encodeURIComponent(`Join the meeting: ${link}`);
    const location = encodeURIComponent(link);

    // Open Google Calendar in new tab
    window.open(
      `https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}&details=${details}&location=${location}`,
      '_blank'
    );
    onClose();
  };

  const copyRoomLink = () => {
    if (createdRoom) {
      const link = `${window.location.origin}?room=${createdRoom.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // View: Success Screen (for "Create for later")
  if (view === 'later' && createdRoom) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-gray-700 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Here's your joining info</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-400 text-sm mb-4">
            Send this to people you want to meet with. Be sure to save it so you can use it later, too.
          </p>

          <div className="bg-slate-700 rounded-lg p-3 flex items-center justify-between mb-6">
            <span className="text-white text-sm truncate mr-4">
              {`${window.location.origin}?room=${createdRoom.id}`}
            </span>
            <button
              onClick={copyRoomLink}
              className="text-blue-400 hover:text-blue-300"
              title="Copy link"
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View: Main Options
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-gray-700 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Create Room</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCreateForLater}
            className="w-full flex items-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all group text-left"
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-500/20 transition-colors">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-medium">Create a meeting for later</h4>
              <p className="text-sm text-gray-400">Get a link that you can share</p>
            </div>
          </button>

          <button
            onClick={handleInstantMeeting}
            className="w-full flex items-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all group text-left"
          >
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-500/20 transition-colors">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-medium">Start an instant meeting</h4>
              <p className="text-sm text-gray-400">Set up a new meeting now</p>
            </div>
          </button>

          <button
            onClick={handleGoogleCalendar}
            className="w-full flex items-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all group text-left"
          >
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-500/20 transition-colors">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-medium">Schedule in Google Calendar</h4>
              <p className="text-sm text-gray-400">Plan a meeting for later</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
