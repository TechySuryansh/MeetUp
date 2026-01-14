import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const ProfilePage = ({ onBack }) => {
  const { currentUser, token } = useApp();
  const [meetings, setMeetings] = useState({ scheduled: [], history: [] });
  const [activeTab, setActiveTab] = useState('scheduled');
  const [loading, setLoading] = useState(true);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [editingNotes, setEditingNotes] = useState(null);
  const [noteText, setNoteText] = useState('');

  const API_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (meetingData) => {
    try {
      const res = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(meetingData),
      });
      if (res.ok) {
        fetchMeetings();
        setShowNewMeeting(false);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  const updateNotes = async (meetingId) => {
    try {
      await fetch(`${API_URL}/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: noteText }),
      });
      fetchMeetings();
      setEditingNotes(null);
      setNoteText('');
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const deleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await fetch(`${API_URL}/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-gray-700 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-xl font-semibold text-white">My Profile</h1>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* User Info Card */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{currentUser?.username}</h2>
              <p className="text-gray-400">{currentUser?.email}</p>
              <div className="flex items-center mt-2 text-sm text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-3xl font-bold text-blue-500">{meetings.scheduled?.length || 0}</div>
            <div className="text-gray-400 text-sm">Scheduled</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-3xl font-bold text-green-500">{meetings.history?.length || 0}</div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-3xl font-bold text-purple-500">
              {meetings.history?.filter(m => m.notes).length || 0}
            </div>
            <div className="text-gray-400 text-sm">With Notes</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'scheduled'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            Scheduled Meetings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            Meeting History
          </button>
          <button
            onClick={() => setShowNewMeeting(true)}
            className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Schedule Meeting
          </button>
        </div>

        {/* Meeting List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (activeTab === 'scheduled' ? meetings.scheduled : meetings.history)?.length === 0 ? (
            <div className="text-center py-12 bg-slate-800 rounded-xl border border-gray-700">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400">No {activeTab} meetings</p>
            </div>
          ) : (
            (activeTab === 'scheduled' ? meetings.scheduled : meetings.history)?.map((meeting) => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                isHistory={activeTab === 'history'}
                onDelete={() => deleteMeeting(meeting._id)}
                onEditNotes={() => {
                  setEditingNotes(meeting._id);
                  setNoteText(meeting.notes || '');
                }}
                formatDate={formatDate}
                formatDuration={formatDuration}
              />
            ))
          )}
        </div>
      </div>

      {/* New Meeting Modal */}
      {showNewMeeting && (
        <NewMeetingModal
          onClose={() => setShowNewMeeting(false)}
          onCreate={createMeeting}
        />
      )}

      {/* Edit Notes Modal */}
      {editingNotes && (
        <NotesModal
          notes={noteText}
          onChange={setNoteText}
          onSave={() => updateNotes(editingNotes)}
          onClose={() => {
            setEditingNotes(null);
            setNoteText('');
          }}
        />
      )}
    </div>
  );
};

// Meeting Card Component
const MeetingCard = ({ meeting, isHistory, onDelete, onEditNotes, formatDate, formatDuration }) => (
  <div className="bg-slate-800 rounded-xl p-5 border border-gray-700">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="text-lg font-semibold text-white">{meeting.title}</h3>
        {meeting.description && (
          <p className="text-gray-400 text-sm mt-1">{meeting.description}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded text-xs ${
          meeting.status === 'completed' ? 'bg-green-600/20 text-green-400' :
          meeting.status === 'scheduled' ? 'bg-blue-600/20 text-blue-400' :
          meeting.status === 'cancelled' ? 'bg-red-600/20 text-red-400' :
          'bg-yellow-600/20 text-yellow-400'
        }`}>
          {meeting.status}
        </span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
      <div>
        <span className="text-gray-500">Scheduled:</span>
        <span className="text-gray-300 ml-2">{formatDate(meeting.scheduledAt)}</span>
      </div>
      {isHistory && (
        <div>
          <span className="text-gray-500">Duration:</span>
          <span className="text-gray-300 ml-2">{formatDuration(meeting.duration)}</span>
        </div>
      )}
    </div>

    {meeting.notes && (
      <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
        <div className="text-xs text-gray-500 mb-1">Notes:</div>
        <p className="text-gray-300 text-sm whitespace-pre-wrap">{meeting.notes}</p>
      </div>
    )}

    <div className="flex justify-end space-x-2">
      <button
        onClick={onEditNotes}
        className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg transition-colors"
      >
        {meeting.notes ? 'Edit Notes' : 'Add Notes'}
      </button>
      <button
        onClick={onDelete}
        className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
      >
        Delete
      </button>
    </div>
  </div>
);

// New Meeting Modal
const NewMeetingModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title, description, scheduledAt: scheduledAt || null });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Schedule New Meeting</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Meeting title"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Meeting description (optional)"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Schedule Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-slate-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Notes Modal
const NotesModal = ({ notes, onChange, onSave, onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">Meeting Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
        rows={8}
        placeholder="Add your meeting notes here..."
      />
      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Save Notes
        </button>
      </div>
    </div>
  </div>
);

export default ProfilePage;
