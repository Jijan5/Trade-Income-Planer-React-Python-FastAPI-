import React from 'react';
import { X, Lock, Zap, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PreviewGateModal = ({ item, type = 'module', onClose }) => {
  const navigate = useNavigate();
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-engine-panel border border-engine-neon/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(var(--engine-neon-rgb),0.15)] text-center"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-full bg-engine-neon/10 border border-engine-neon/30 shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.2)]">
          <Lock className="w-8 h-8 text-engine-neon" />
        </div>

        <h2 className="text-xl font-extrabold text-white uppercase tracking-widest mb-2">
          {type === 'bundle' ? 'Bundle Locked' : 'Module Locked'}
        </h2>
        <p className="text-engine-neon font-bold text-lg mb-1">{item.title}</p>
        <p className="text-gray-400 text-sm mb-6">
          Upgrade to <span className="text-purple-400 font-bold">Platinum</span> for unlimited access, or purchase this {type} individually.
        </p>

        {/* Price badge */}
        <div className="inline-flex items-center gap-2 bg-engine-bg border border-engine-neon/20 px-4 py-2 rounded-xl mb-6">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{type === 'bundle' ? 'Bundle Price' : 'Module Price'}</span>
          <span className="text-engine-neon font-extrabold text-lg">${item.price?.toFixed(2)}</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/subscription')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm uppercase tracking-widest bg-purple-600/20 border border-purple-500/50 text-purple-400 hover:bg-purple-600 hover:text-white transition-all shadow-[0_0_15px_rgba(147,51,234,0.2)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]"
          >
            <Zap className="w-4 h-4" /> Upgrade to Platinum
          </button>
          <button
            onClick={() => navigate('/subscription')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm uppercase tracking-widest bg-engine-neon/10 border border-engine-neon/40 text-engine-neon hover:bg-engine-neon hover:text-engine-bg transition-all shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.15)]"
          >
            <ShoppingCart className="w-4 h-4" /> Buy for ${item.price?.toFixed(2)}
          </button>
        </div>

        <p className="text-gray-600 text-xs mt-4">Payment gateway integration coming soon.</p>
      </div>
    </div>
  );
};

export default PreviewGateModal;
