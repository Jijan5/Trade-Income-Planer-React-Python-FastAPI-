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
    <div className="bg-gray-900/80 p-4 rounded-lg border border-blue-500/30 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <h4 className="text-sm font-bold text-white uppercase">Position Size Calculator</h4>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Risk per Trade: <span className="text-blue-400 font-bold">{riskPercent}%</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={riskPercent}
            onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>0.5% (Safe)</span>
            <span>5% (Aggressive)</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-800 p-2 rounded">
            <p className="text-gray-500">Risk Amount</p>
            <p className="text-red-400 font-mono font-bold">${riskAmount.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <p className="text-gray-500">Position Size</p>
            <p className="text-green-400 font-mono font-bold">${positionSize.toFixed(2)}</p>
          </div>
        </div>
        
        <button
          onClick={() => onApplyPositionSize(positionSize)}
          disabled={positionSize <= 0}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-xs font-bold py-2 rounded transition-colors"
        >
          Apply Position Size
        </button>
        
        <p className="text-[10px] text-gray-500 italic">
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
    <div className="bg-gray-900/80 p-4 rounded-lg border border-purple-500/30 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚖️</span>
        <h4 className="text-sm font-bold text-white uppercase">Risk / Reward Ratio</h4>
      </div>
      
      <div className="flex items-center justify-center mb-3">
        <div className={`text-4xl font-bold ${getRatingColor()}`}>
          1:{rMultiple.toFixed(1)}
        </div>
      </div>
      
      <div className={`text-center text-xs font-bold mb-3 px-2 py-1 rounded ${rMultiple >= 2 ? 'bg-green-900/30 text-green-400' : rMultiple >= 1 ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>
        {getRatingText()}
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center bg-gray-800 p-2 rounded">
          <span className="text-gray-500">Stop Loss</span>
          <span className="text-red-400 font-mono font-bold">${slPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-800 p-2 rounded">
          <span className="text-gray-500">Take Profit</span>
          <span className="text-green-400 font-mono font-bold">${tpPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <p className="text-[10px] text-gray-500 italic mt-3">
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
    <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-4 rounded-lg border border-yellow-500/30 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h4 className="text-sm font-bold text-white uppercase">Trading Tip</h4>
        </div>
        <button 
          onClick={nextTip}
          className="text-xs text-yellow-400 hover:text-yellow-300 underline"
        >
          Next Tip
        </button>
      </div>
      
      <p className="text-sm text-gray-200 italic leading-relaxed">
        "{tips[currentTip]}"
      </p>
      
      <div className="flex gap-1 mt-3 justify-center">
        {tips.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-1.5 h-1.5 rounded-full ${idx === currentTip ? 'bg-yellow-400' : 'bg-gray-600'}`}
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
    <div className="space-y-2">
      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-colors ${
            showCalculator 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          📊 Calculator
        </button>
        <button
          onClick={() => setShowRR(!showRR)}
          className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-colors ${
            showRR 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          ⚖️ R/R Ratio
        </button>
      </div>
      
      {/* Position Size Calculator */}
      {showCalculator && (
        <PositionSizeCalculator 
          accountBalance={accountBalance}
          stopLossPct={stopLossPct}
          currentPrice={currentPrice}
          onApplyPositionSize={onApplyPositionSize}
        />
      )}
      
      {/* Risk/Reward Display */}
      {showRR && (
        <RiskRewardDisplay 
          entryPrice={currentPrice}
          stopLossPct={stopLossPct}
          takeProfitPct={takeProfitPct}
          tradeType={tradeType}
        />
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
