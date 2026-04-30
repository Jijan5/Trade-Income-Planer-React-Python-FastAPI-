import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/axios';
import { Ban } from 'lucide-react';

const SuspendedPage = () => {
    const { userData, logout } = useAuth();
    const [appealMessage, setAppealMessage] = useState('');
    const [appealSent, setAppealSent] = useState(userData?.appeal_status === 'pending');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const suspendedUntil = userData?.suspended_until ? new Date(userData.suspended_until) : null;
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
        <div className="min-h-screen flex items-center justify-center bg-[#030308] text-white p-4 relative overflow-hidden animate-fade-in">
            {/* Background Effects */}
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[150px] pointer-events-none"></div>
            
            <div className="max-w-2xl w-full bg-[#0a0f1c]/90 backdrop-blur-xl rounded-3xl border border-red-500/50 p-10 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center relative z-10">
                <div className="w-24 h-24 mx-auto bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] mb-8">
                    <Ban className="w-12 h-12 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-extrabold text-red-400 mb-4 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">ACCOUNT SUSPENDED</h1>
                <p className="text-red-400/70 mb-8 font-medium">Your account has been temporarily suspended due to a violation of our community guidelines.</p>

                <div className="bg-[#030308] p-5 rounded-xl border border-red-500/20 text-left mb-6 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                    <p className="text-[10px] text-red-400/50 font-extrabold uppercase tracking-widest">REASON FOR SUSPENSION:</p>
                    <p className="text-white mt-2 text-sm">{userData.suspension_reason || "No reason provided."}</p>
                </div>

                <div className="bg-[#030308] p-5 rounded-xl border border-red-500/20 text-left mb-8 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                    <p className="text-[10px] text-red-400/50 font-extrabold uppercase tracking-widest">SUSPENSION ENDS:</p>
                    <p className="text-white mt-2 font-mono text-sm">{isPermanent ? "Indefinitely" : suspendedUntil.toLocaleString()}</p>
                </div>

                {userData.appeal_status === 'rejected' && (
                    <div className="bg-red-900/20 p-5 rounded-xl border border-red-500/50 text-left mb-8 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                        <h3 className="font-extrabold text-red-400 mb-2 uppercase tracking-widest drop-shadow-[0_0_2px_currentColor]">APPEAL REJECTED</h3>
                        <p className="text-[10px] text-red-400/50 font-extrabold uppercase tracking-widest">ADMIN RESPONSE:</p>
                        <p className="text-white mt-2 italic text-sm">"{userData.appeal_response}"</p>
                    </div>
                )}

                {appealSent ? (
                    <div className="bg-green-900/20 p-5 rounded-xl border border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.1)] text-left">
                        <h3 className="font-extrabold text-green-400 uppercase tracking-widest drop-shadow-[0_0_2px_currentColor] mb-2">APPEAL SUBMITTED</h3>
                        <p className="text-sm text-green-400/70">Your appeal is pending review by our admin team. Thank you for your patience.</p>
                    </div>
                ) : (
                    <div className="bg-[#030308] p-8 rounded-2xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)] text-left">
                        <h3 className="text-[11px] font-extrabold text-red-500 mb-2 uppercase tracking-widest drop-shadow-[0_0_3px_currentColor]">SUBMIT AN APPEAL</h3>
                        <p className="text-sm text-red-500/70 mb-6">If you believe this was a mistake, you can submit an appeal for review.</p>
                        <form onSubmit={handleAppealSubmit}>
                            <textarea
                                value={appealMessage}
                                onChange={(e) => setAppealMessage(e.target.value)}
                                placeholder="EXPLAIN WHY YOUR SUSPENSION SHOULD BE RECONSIDERED..."
                                className="w-full bg-[#0a0f1c] border border-red-500/30 rounded-xl p-4 text-white focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)] outline-none h-32 resize-none text-sm font-mono placeholder:text-red-500/20 transition-all custom-scrollbar"
                            />
                            {error && <p className="text-red-400 text-xs mt-3 font-extrabold uppercase tracking-widest">{error}</p>}
                            <button type="submit" disabled={loading} className="mt-6 w-full bg-red-500 hover:bg-red-400 text-[#030308] px-6 py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? "SUBMITTING..." : "SUBMIT APPEAL"}
                            </button>
                        </form>
                    </div>
                )}

                <button onClick={logout} className="mt-10 text-red-400/50 hover:text-red-400 text-[10px] font-extrabold uppercase tracking-widest transition-all drop-shadow-[0_0_3px_currentColor]">LOGOUT</button>
            </div>
        </div>
    );
};

export default SuspendedPage;
