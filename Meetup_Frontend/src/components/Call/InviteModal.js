import React from 'react';

const InviteModal = ({ onlineUsers, currentParticipants, onInvite, onClose }) => {
    // Filter users: must be online, and not already in the call
    const availableUsers = onlineUsers.filter(user => {
        const isParticipant = currentParticipants.some(p => p.socketId === user.socketId || p.socketId === user.id);
        return !isParticipant && user.socketId; // Must have socketId to be invited
    });

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">Invite People</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {availableUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>No other users available to invite.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {availableUsers.map(user => (
                                <div key={user.socketId} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {user.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{user.username}</p>
                                            <p className="text-xs text-gray-400">Online</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onInvite(user)}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                    >
                                        Invite
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InviteModal;
