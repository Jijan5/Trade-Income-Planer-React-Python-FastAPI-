import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Failed to verify email. The token may be invalid or expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#030308] text-white flex items-center justify-center p-4">
      <div className="bg-engine-panel border border-[#00cfff]/30 p-8 rounded-2xl shadow-[0_0_40px_rgba(0,207,255,0.15)] max-w-md w-full text-center relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-[#00cfff] to-transparent opacity-50 blur-sm"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#00cfff]/10 rounded-full blur-[50px] pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none"></div>

        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#00cfff]/20 border-t-[#00cfff] rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(0,207,255,0.3)]"></div>
            <h2 className="text-xl font-extrabold uppercase tracking-widest text-white mb-2">Verifying</h2>
            <p className="text-[#00cfff]/70 font-mono text-xs">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30 mb-6 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold uppercase tracking-widest text-white mb-2 text-shadow-sm">Account Verified</h2>
            <p className="text-green-400/80 font-mono text-xs mb-8">{message}</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full px-6 py-3.5 rounded-xl bg-[#00cfff] text-engine-bg hover:bg-[#00e5ff] text-xs font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(0,207,255,0.3)] hover:shadow-[0_0_25px_rgba(0,207,255,0.5)] transition-all hover:-translate-y-0.5"
            >
              Proceed to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold uppercase tracking-widest text-white mb-2">Verification Failed</h2>
            <p className="text-red-400/80 font-mono text-xs mb-8">{message}</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full px-6 py-3.5 rounded-xl bg-engine-bg border border-[#00cfff]/30 text-[#00cfff] hover:bg-[#00cfff]/10 hover:border-[#00cfff]/50 text-xs font-extrabold uppercase tracking-widest transition-all"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
