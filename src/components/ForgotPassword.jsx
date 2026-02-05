import React, { useState } from 'react';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = ({ showFlash }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: PIN, 3: New Password
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (text, type = 'error') => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/forgot-password', { email });
      showMessage('PIN sent to email', 'success');
      setStep(2);
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Failed to send PIN');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/verify-reset-pin', { email, pin });
      setStep(3);
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return showMessage('Passwords do not match');
    }
    setLoading(true);
    try {
      await api.post('/reset-password', {
        email,
        pin,
        new_password: passwords.new,
        confirm_password: passwords.confirm
      });
      showFlash('Password reset successful! Please login.', 'success');
      navigate('/');
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {step === 1 && 'Forgot Password'}
          {step === 2 && 'Enter PIN'}
          {step === 3 && 'Reset Password'}
        </h2>

        {message.text && (
          <div className={`p-3 rounded mb-4 text-sm ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold transition-colors">
              {loading ? 'Sending...' : 'Send PIN'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <p className="text-gray-400 text-sm text-center">Check your VS Code terminal for the 6-digit PIN.</p>
            <div>
              <label className="block text-gray-400 text-sm mb-1">6-Digit PIN</label>
              <input type="text" required maxLength="6" value={pin} onChange={e => setPin(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-center tracking-widest text-xl focus:border-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold transition-colors">
              {loading ? 'Verifying...' : 'Verify PIN'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">New Password</label>
              <input type="password" required value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Confirm Password</label>
              <input type="password" required value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold transition-colors">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <button onClick={() => navigate('/')} className="w-full mt-4 text-gray-500 text-sm hover:text-white">Back to Login</button>
      </div>
    </div>
  );
};

export default ForgotPassword;
