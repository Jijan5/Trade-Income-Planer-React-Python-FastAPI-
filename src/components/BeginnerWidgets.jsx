import React, { useState, useMemo } from 'react';

// ============================================
// POSITION SIZE CALCULATOR
// ============================================
export const PositionSizeCalculator = ({ 
  accountBalance, 
  stopLossPct, 
  onApplyPositionSize,
  currentPrice 
}) => {
  const [riskPercent, setRiskPercent] = useState(1); // Default 1% risk
  
  const positionSize = useMemo(() => {
    if (!accountBalance || !riskPercent || !stopLossPct || !currentPrice || currentPrice <= 0) {
      return 0;
    }
    // Risk Amount = Account Balance * (Risk % / 100)
    const riskAmount = accountBalance * (riskPercent / 100);
    // Position Size = Risk Amount / (SL % / 100)
    const size = riskAmount / (stopLossPct / 100);
    return Math.min(size, accountBalance * 0.95); // Max 95% of account
  }, [accountBalance, riskPercent, stopLossPct, currentPrice]);
  
  const riskAmount = useMemo(() => {
    return accountBalance * (riskPercent / 100);
  }, [accountBalance, riskPercent]);

  if (!currentPrice || currentPrice <= 0) return null;

  return (
    <div className="bg-[#0a0f1c]/80 p-5 rounded-2xl border border-[#00cfff]/30 shadow-[0_0_15px_rgba(0,207,255,0.05)] backdrop-blur-md mb-4">
      <div className="flex items-center gap-2 mb-4 border-b border-[#00cfff]/10 pb-3">
        <span className="text-xl">📊</span>
        <h4 className="text-sm font-extrabold text-white uppercase tracking-widest drop-shadow-[0_0_5px_#00cfff]">Position Size Calculator</h4>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">
            Risk per Trade: <span className="text-[#00cfff] font-extrabold drop-shadow-[0_0_3px_rgba(0,207,255,0.5)]">{riskPercent}%</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={riskPercent}
            onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#030308] border border-[#00cfff]/30 rounded-lg appearance-none cursor-pointer accent-[#00cfff]"
          />
          <div className="flex justify-between text-[9px] font-bold text-[#00cfff]/50 mt-2 uppercase tracking-widest">
            <span>0.5% (SAFE)</span>
            <span>5% (AGGRESSIVE)</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[#030308]/80 p-3 rounded-xl border border-[#00cfff]/10">
            <p className="text-[10px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest mb-1">Risk Amount</p>
            <p className="text-red-400 font-mono font-bold drop-shadow-[0_0_3px_rgba(248,113,113,0.5)]">${riskAmount.toFixed(2)}</p>
          </div>
          <div className="bg-[#030308]/80 p-3 rounded-xl border border-[#00cfff]/10">
            <p className="text-[10px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest mb-1">Position Size</p>
            <p className="text-green-400 font-mono font-bold drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]">${positionSize.toFixed(2)}</p>
          </div>
        </div>
        
        <button
          onClick={() => onApplyPositionSize(positionSize)}
          disabled={positionSize <= 0}
          className="w-full bg-[#00cfff] hover:bg-[#00e5ff] disabled:bg-[#030308] disabled:border disabled:border-[#00cfff]/30 disabled:text-gray-500 text-[#030308] text-xs font-extrabold uppercase tracking-widest py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,207,255,0.4)] disabled:shadow-none hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5 mt-2"
        >
          APPLY POSITION SIZE
        </button>
        
        <p className="text-[10px] font-bold text-gray-500 italic border-t border-[#00cfff]/10 pt-3 mt-3">
          💡 Novice tip: Risk only 1-2% of your account per trade to survive losing streaks!
        </p>
      </div>
    </div>
  );
};

// ============================================
// RISK/REWARD RATIO DISPLAY
// ============================================
export const RiskRewardDisplay = ({ 
  entryPrice, 
  stopLossPct, 
  takeProfitPct, 
  tradeType 
}) => {
  const rMultiple = useMemo(() => {
    if (!stopLossPct || !takeProfitPct || stopLossPct <= 0) return 0;
    return takeProfitPct / stopLossPct;
  }, [stopLossPct, takeProfitPct]);
  
  const slPrice = useMemo(() => {
    if (!entryPrice || entryPrice <= 0) return 0;
    return tradeType === 'BUY' 
      ? entryPrice * (1 - stopLossPct / 100)
      : entryPrice * (1 + stopLossPct / 100);
  }, [entryPrice, stopLossPct, tradeType]);
  
  const tpPrice = useMemo(() => {
    if (!entryPrice || entryPrice <= 0) return 0;
    return tradeType === 'BUY'
      ? entryPrice * (1 + takeProfitPct / 100)
      : entryPrice * (1 - takeProfitPct / 100);
  }, [entryPrice, takeProfitPct, tradeType]);

  if (!entryPrice || entryPrice <= 0) return null;

  const getRatingColor = () => {
    if (rMultiple >= 2) return 'text-green-400';
    if (rMultiple >= 1.5) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getRatingText = () => {
    if (rMultiple >= 2) return 'Excellent (2:1+)';
    if (rMultiple >= 1.5) return 'Good (1.5:1)';
    if (rMultiple >= 1) return 'Fair (1:1)';
    return 'Poor (< 1:1)';
  };

  return (
    <div className="bg-[#0a0f1c]/80 p-5 rounded-2xl border border-[#00cfff]/30 shadow-[0_0_15px_rgba(0,207,255,0.05)] backdrop-blur-md mb-4">
      <div className="flex items-center gap-2 mb-4 border-b border-[#00cfff]/10 pb-3">
        <span className="text-xl">⚖️</span>
        <h4 className="text-sm font-extrabold text-white uppercase tracking-widest drop-shadow-[0_0_5px_#00cfff]">Risk / Reward Ratio</h4>
      </div>
      
      <div className="flex items-center justify-center mb-4 bg-[#030308]/50 py-4 rounded-xl border border-[#00cfff]/10">
        <div className={`text-4xl font-mono font-extrabold ${getRatingColor()} drop-shadow-[0_0_8px_currentColor]`}>
          1:{rMultiple.toFixed(1)}
        </div>
      </div>
      
      <div className={`text-center text-[10px] font-extrabold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full border inline-block mx-auto flex w-max ${rMultiple >= 2 ? 'bg-green-900/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.1)]' : rMultiple >= 1 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : 'bg-red-900/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]'}`}>
        {getRatingText()}
      </div>
      
      <div className="space-y-3 text-xs">
        <div className="flex justify-between items-center bg-[#030308]/80 p-3 rounded-xl border border-[#00cfff]/10">
          <span className="text-[10px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest">Stop Loss</span>
          <span className="text-red-400 font-mono font-bold drop-shadow-[0_0_3px_rgba(248,113,113,0.5)]">${slPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center bg-[#030308]/80 p-3 rounded-xl border border-[#00cfff]/10">
          <span className="text-[10px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest">Take Profit</span>
          <span className="text-green-400 font-mono font-bold drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]">${tpPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <p className="text-[10px] font-bold text-gray-500 italic mt-4 border-t border-[#00cfff]/10 pt-3">
        💡 Novice tip: Always aim for at least 2:1 risk/reward to stay profitable!
      </p>
    </div>
  );
};

// ============================================
// BEGINNER TIPS WIDGET
// ============================================
const TIPS = {
  general: [
    "Never risk more than 2% of your account on a single trade.",
    "Always use a stop loss - it's your safety net!",
    "The trend is your friend. Don't fight it!",
    "Plan your trade and trade your plan.",
    "Emotion leads to mistakes. Stay disciplined!",
    "Keep a trading journal to learn from your mistakes.",
    "Don't overtrade - quality over quantity!",
    "Take breaks - trading requires a clear mind.",
  ],
  losingStreak: [
    "Take a break! Step away from the screen and clear your mind.",
    "Review your trades - what's working and what isn't?",
    "Consider reducing your position size during losing streaks.",
    "Remember: even the best traders lose. Stay patient!",
    "Don't revenge trade - it usually makes things worse.",
    "Stick to your trading plan, don't deviate!",
  ],
  winning: [
    "Great job! Don't get overconfident - stay humble.",
    "Consider taking some profits off the table.",
    "Don't let profits turn into losses - use trailing stops.",
    "Stay focused - consistency is key in trading.",
    "Document what you're doing right to replicate success!",
  ],
  largeWin: [
    "Amazing trade! Consider your risk management for next time.",
    "Don't risk more just because you're winning - stay consistent!",
    "Take a moment to celebrate, then get back to your plan.",
  ],
  largeLoss: [
    "That's a tough loss. Learn from it and move on.",
    "Never risk more than 2% - even after big losses.",
    "Take a break and come back with a clear head.",
    "Every trader loses - it's how you respond that matters.",
  ],
  noTrades: [
    "Patience is a trader's best friend. Wait for your setup!",
    "Not every market condition is tradeable.",
    "It's okay to stay in cash when the setup isn't there.",
    "Good traders know when NOT to trade.",
  ],
};

export const BeginnerTipsWidget = ({ recentPnL, totalTrades, accountBalance, initialCapital }) => {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tipCategory = useMemo(() => {
    // Calculate recent performance
    const lastTrade = recentPnL;
    
    if (totalTrades === 0) return 'noTrades';
    
    // If recently lost
    if (lastTrade < 0) {
      if (lastTrade < -initialCapital * 0.05) return 'largeLoss'; // > 5% loss
      return 'losingStreak';
    }
    
    // If recently won
    if (lastTrade > 0) {
      if (lastTrade > initialCapital * 0.1) return 'largeWin'; // > 10% win
      return 'winning';
    }
    
    return 'general';
  }, [recentPnL, totalTrades, accountBalance, initialCapital]);
  
  const tips = TIPS[tipCategory] || TIPS.general;
  
  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length);
  };
  
  return (
    <div className="bg-[#00cfff]/5 p-5 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_15px_rgba(0,207,255,0.05)] backdrop-blur-md mb-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#00cfff]/5 rounded-full blur-2xl"></div>
      <div className="flex items-center justify-between mb-4 relative z-10 border-b border-[#00cfff]/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <h4 className="text-sm font-extrabold text-white uppercase tracking-widest drop-shadow-[0_0_5px_#00cfff]">Trading Tip</h4>
        </div>
        <button 
          onClick={nextTip}
          className="text-[10px] font-extrabold uppercase tracking-widest text-[#00cfff] border border-[#00cfff]/30 hover:bg-[#00cfff]/10 px-2 py-1 rounded transition-all shadow-[0_0_5px_rgba(0,207,255,0.1)] hover:shadow-[0_0_10px_rgba(0,207,255,0.2)]"
        >
          Next Tip
        </button>
      </div>
      
      <p className="text-sm text-gray-200 italic leading-relaxed font-medium relative z-10 bg-[#030308]/30 p-4 rounded-xl border border-[#00cfff]/10">
        "{tips[currentTip]}"
      </p>
      
      <div className="flex gap-2 mt-4 justify-center relative z-10">
        {tips.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentTip ? 'bg-[#00cfff] shadow-[0_0_5px_#00cfff] scale-125' : 'bg-[#00cfff]/30'}`}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// COMBINED BEGINNER WIDGETS PANEL
// ============================================
export const BeginnerWidgetsPanel = ({ 
  accountBalance, 
  stopLossPct, 
  takeProfitPct, 
  currentPrice,
  tradeType,
  recentPnL,
  totalTrades,
  initialCapital,
  onApplyPositionSize 
}) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [showRR, setShowRR] = useState(true);
  
  return (
    <div className="space-y-4">
      {/* Toggle Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${
            showCalculator 
              ? 'bg-[#00cfff]/20 text-[#00cfff] border border-[#00cfff] shadow-[0_0_15px_rgba(0,207,255,0.2)]' 
              : 'bg-[#030308]/50 text-[#00cfff]/50 hover:bg-[#00cfff]/10 hover:text-[#00cfff] border border-[#00cfff]/20'
          }`}
        >
          <span className="text-sm mr-1">📊</span> Calculator
        </button>
        <button
          onClick={() => setShowRR(!showRR)}
          className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${
            showRR 
              ? 'bg-[#00cfff]/20 text-[#00cfff] border border-[#00cfff] shadow-[0_0_15px_rgba(0,207,255,0.2)]' 
              : 'bg-[#030308]/50 text-[#00cfff]/50 hover:bg-[#00cfff]/10 hover:text-[#00cfff] border border-[#00cfff]/20'
          }`}
        >
          <span className="text-sm mr-1">⚖️</span> R/R Ratio
        </button>
      </div>
      
      {/* Position Size Calculator */}
      {showCalculator && (
        <div className="animate-fade-in">
          <PositionSizeCalculator 
            accountBalance={accountBalance}
            stopLossPct={stopLossPct}
            currentPrice={currentPrice}
            onApplyPositionSize={onApplyPositionSize}
          />
        </div>
      )}
      
      {/* Risk/Reward Display */}
      {showRR && (
        <div className="animate-fade-in">
          <RiskRewardDisplay 
            entryPrice={currentPrice}
            stopLossPct={stopLossPct}
            takeProfitPct={takeProfitPct}
            tradeType={tradeType}
          />
        </div>
      )}
      
      {/* Beginner Tips - Always Visible */}
      <BeginnerTipsWidget 
        recentPnL={recentPnL}
        totalTrades={totalTrades}
        accountBalance={accountBalance}
        initialCapital={initialCapital}
      />
    </div>
  );
};

export default BeginnerWidgetsPanel;
