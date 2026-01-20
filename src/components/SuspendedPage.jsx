import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/axios';

const SuspendedPage = () => {
    const { userData, logout } = useAuth();
    const [appealMessage, setAppealMessage] = useState('');
    const [appealSent, setAppealSent] = useState(userData?.appeal_status === 'pending');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const suspendedUntil = userData.suspended_until ? new Date(userData.suspended_until) : null;
    const isPermanent = !suspendedUntil;

    const handleAppealSubmit = async (e) => {
        e.preventDefault();
        if (!appealMessage.trim()) {
            setError("Appeal message cannot be empty.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/users/me/appeal', { message: appealMessage });
            setAppealSent(true);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to submit appeal. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            <div className="max-w-2xl w-full bg-gray-800 rounded-lg border border-red-500/50 p-8 shadow-2xl text-center animate-fade-in">
                <div className="text-6xl mb-4">⛔</div>
                <h1 className="text-3xl font-bold text-red-400 mb-2">Account Suspended</h1>
                <p className="text-gray-300 mb-4">Your account has been temporarily suspended due to a violation of our community guidelines.</p>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-left mb-6">
                    <p className="text-sm text-gray-400 font-bold uppercase">Reason for Suspension:</p>
                    <p className="text-white mt-1">{userData.suspension_reason || "No reason provided."}</p>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-left mb-6">
                    <p className="text-sm text-gray-400 font-bold uppercase">Suspension Ends:</p>
                    <p className="text-white mt-1 font-mono">{isPermanent ? "Indefinitely" : suspendedUntil.toLocaleString()}</p>
                </div>

                {userData.appeal_status === 'rejected' && (
                    <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50 text-left mb-6">
                        <h3 className="font-bold text-red-400 mb-1">Appeal Rejected</h3>
                        <p className="text-sm text-gray-300">Admin Response:</p>
                        <p className="text-white mt-1 italic">"{userData.appeal_response}"</p>
                    </div>
                )}

                {appealSent ? (
                    <div className="bg-green-900/50 p-4 rounded-lg border border-green-500/50">
                        <h3 className="font-bold text-green-300">Appeal Submitted</h3>
                        <p className="text-sm text-gray-300 mt-1">Your appeal is pending review by our admin team. Thank you for your patience.</p>
                    </div>
                ) : (
                    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                        <h3 className="font-bold text-white mb-3">Submit an Appeal</h3>
                        <p className="text-sm text-gray-400 mb-4">If you believe this was a mistake, you can submit an appeal for review.</p>
                        <form onSubmit={handleAppealSubmit}>
                            <textarea
                                value={appealMessage}
                                onChange={(e) => setAppealMessage(e.target.value)}
                                placeholder="Explain why your suspension should be reconsidered..."
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-blue-500 outline-none h-24 resize-none text-sm"
                            />
                            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                            <button type="submit" disabled={loading} className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition-colors disabled:bg-gray-600">
                                {loading ? "Submitting..." : "Submit Appeal"}
                            </button>
                        </form>
                    </div>
                )}

                <button onClick={logout} className="mt-8 text-sm text-gray-500 hover:text-white">Logout</button>
            </div>
        </div>
    );
};

export default SuspendedPage;
