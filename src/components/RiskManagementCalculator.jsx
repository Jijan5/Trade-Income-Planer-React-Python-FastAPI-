import React, { useState, useMemo } from 'react';
import { Wallet, ShieldAlert, OctagonX, Target, BarChart, Zap, Lightbulb, TrendingUp, TrendingDown, CheckCircle, TriangleAlert, XCircle } from 'lucide-react';

const RiskManagementCalculator = ({ 
  accountBalance: propAccountBalance, 
  onApplySettings,
  onClose,
  isOpen = false,
  compact = false 
}) => {
  // If not open and not compact mode, return null
  if (!isOpen && !compact) {
    return null;
  }

  // State variables
  const [accountBalance, setAccountBalance] = useState(propAccountBalance || 10000);
  const [riskPercent, setRiskPercent] = useState(2); // Default 2% risk
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPercent, setStopLossPercent] = useState(2);
  const [takeProfitPercent, setTakeProfitPercent] = useState(4);
  const [tradeType, setTradeType] = useState('BUY');
  
  // Calculated values
  const calculations = useMemo(() => {
    if (!accountBalance || accountBalance <= 0 || !riskPercent || riskPercent <= 0) {
      return null;
    }
    
    // Risk Amount = Account Balance * (Risk % / 100)
    const riskAmount = accountBalance * (riskPercent / 100);
    
    // Position Size Calculation
    let positionSize = 0;
    let stopLossPrice = 0;
    let takeProfitPrice = 0;
    let entry = parseFloat(entryPrice);
    
    if (entry && entry > 0 && stopLossPercent > 0) {
      // Position Size = Risk Amount / (SL % / 100)
      positionSize = riskAmount / (stopLossPercent / 100);
      
      // Calculate Stop Loss and Take Profit prices
      if (tradeType === 'BUY') {
        stopLossPrice = entry * (1 - stopLossPercent / 100);
        takeProfitPrice = entry * (1 + takeProfitPercent / 100);
      } else {
        stopLossPrice = entry * (1 + stopLossPercent / 100);
        takeProfitPrice = entry * (1 - takeProfitPercent / 100);
      }
    }
    
    // Risk/Reward Ratio
    const riskRewardRatio = stopLossPercent > 0 ? takeProfitPercent / stopLossPercent : 0;
    
    // Potential Profit and Loss
    const potentialLoss = positionSize * (stopLossPercent / 100);
    const potentialProfit = positionSize * (takeProfitPercent / 100);
    
    return {
      riskAmount,
      positionSize,
      stopLossPrice,
      takeProfitPrice,
      riskRewardRatio,
      potentialLoss,
      potentialProfit,
      rrFormatted: `1:${riskRewardRatio.toFixed(1)}`
    };
  }, [accountBalance, riskPercent, entryPrice, stopLossPercent, takeProfitPercent, tradeType]);

  // Educational content for each field
  const educationalContent = {
    accountBalance: {
      title: <span className="flex items-center gap-1"><Wallet className="w-4 h-4"/> What is Account Balance?</span>,
      content: "Your account balance is the total amount of money you have available for trading. For beginners, it's recommended to start with virtual money or a small amount you can afford to lose.",
      tip: "Never trade with money you need for daily expenses!"
    },
    riskPercent: {
      title: <span className="flex items-center gap-1"><TriangleAlert className="w-4 h-4"/> What is Risk Per Trade?</span>,
      content: "Risk per trade is the percentage of your account you're willing to lose if a trade goes against you. Professional traders typically risk only 1-2% per trade.",
      tip: "The 2% rule: If you lose 2% of your account 50 times in a row, you'd still have most of your money!"
    },
    stopLoss: {
      title: <span className="flex items-center gap-1"><OctagonX className="w-4 h-4"/> What is Stop Loss?</span>,
      content: "A stop loss is an automatic order that closes your trade when the price moves against you by a certain amount. It limits your potential loss.",
      tip: "Always use a stop loss! It's your safety net."
    },
    takeProfit: {
      title: <span className="flex items-center gap-1"><Target className="w-4 h-4"/> What is Take Profit?</span>,
      content: "Take profit is the price level where you automatically close a winning trade to secure your profits. It's the opposite of stop loss.",
      tip: "Always have a target profit. Greed can turn winners into losers!"
    },
    positionSize: {
      title: <span className="flex items-center gap-1"><BarChart className="w-4 h-4"/> What is Position Size?</span>,
      content: "Position size is how much money you're putting into a single trade. It determines how much you could win or lose.",
      tip: "Position Size = Risk Amount ÷ Stop Loss %"
    }
  };

  // Show info tooltip
  const [showInfo, setShowInfo] = useState(null);

  // Risk level assessment
  const getRiskLevel = () => {
    if (riskPercent <= 1) return { level: 'Conservative', color: 'green', desc: 'Very safe for beginners' };
    if (riskPercent <= 2) return { level: 'Safe', color: 'blue', desc: 'Recommended for beginners' };
    if (riskPercent <= 3) return { level: 'Moderate', color: 'yellow', desc: 'For experienced traders' };
    return { level: 'Aggressive', color: 'red', desc: 'Not recommended for beginners!' };
  };
  
  const riskLevel = getRiskLevel();

  // If compact mode, show simplified version
  if (compact) {
    return (
      <div className="bg-[#0a0f1c]/60 p-5 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md">
        <h3 className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Risk Calculator
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">Account Balance ($)</label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white font-mono text-sm focus:border-[#00cfff] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] focus:shadow-[0_0_15px_rgba(0,207,255,0.1)] outline-none"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">Risk Per Trade (%)</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#030308] border border-[#00cfff]/30 rounded-lg appearance-none cursor-pointer accent-[#00cfff]"
            />
            <div className="text-center text-sm font-mono font-bold text-[#00cfff] mt-2 drop-shadow-[0_0_3px_#00cfff]">{riskPercent}%</div>
          </div>
          
          {calculations && (
            <div className="bg-[#030308]/80 p-4 rounded-xl border border-[#00cfff]/10">
              <div className="text-[10px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest mb-1">Max Risk Amount</div>
              <div className="text-xl font-mono font-bold text-red-400 drop-shadow-[0_0_3px_rgba(248,113,113,0.5)]">${calculations.riskAmount.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full mode
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#030308]/90 backdrop-blur-md">
      <div className="bg-[#0a0f1c]/90 rounded-2xl border border-[#00cfff]/30 w-full max-w-lg max-h-[90vh] overflow-hidden shadow-[0_0_50px_rgba(0,207,255,0.1)] backdrop-blur-xl flex flex-col">
        {/* Header with Back Button */}
        <div className="bg-[#030308]/50 p-5 border-b border-[#00cfff]/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-[#00cfff]/70 hover:text-[#00cfff] transition-all flex items-center gap-1 bg-[#00cfff]/5 px-3 py-1.5 rounded-xl border border-[#00cfff]/20 hover:bg-[#00cfff]/10 hover:shadow-[0_0_10px_rgba(0,207,255,0.2)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010l6-6-1.414a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Back</span>
            </button>
            <h3 className="text-sm font-extrabold text-[#00cfff] uppercase tracking-widest drop-shadow-[0_0_8px_#00cfff] flex items-center gap-2">
              <Zap className="w-5 h-5" /> Risk Management
            </h3>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Account Balance */}
          <div className="bg-[#030308]/60 p-5 rounded-xl border border-[#00cfff]/10 relative group">
            <div className="absolute inset-0 bg-[#00cfff]/0 group-hover:bg-[#00cfff]/[0.02] transition-all rounded-xl pointer-events-none"></div>
            <div className="flex items-center mb-3">
              <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">Account Balance</label>
              <button
                onClick={() => setShowInfo(showInfo === 'accountBalance' ? null : 'accountBalance')}
                className="text-[#00cfff] hover:text-[#00e5ff] text-sm ml-2 drop-shadow-[0_0_5px_#00cfff]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            {showInfo === 'accountBalance' && (
              <div className="mb-4 p-4 bg-[#030308]/90 rounded-xl border border-[#00cfff]/50 shadow-[0_0_15px_rgba(0,207,255,0.1)] backdrop-blur-md">
                <h4 className="font-extrabold text-[#00cfff] text-xs mb-2 uppercase tracking-widest drop-shadow-[0_0_3px_#00cfff]">{educationalContent.accountBalance.title}</h4>
                <p className="text-gray-300 text-xs leading-relaxed font-medium mb-2">{educationalContent.accountBalance.content}</p>
                <p className="text-[#00cfff] text-[10px] uppercase tracking-widest bg-[#00cfff]/10 p-2 rounded border border-[#00cfff]/20 inline-flex items-center gap-1 font-bold mt-1"><Lightbulb className="w-3 h-3" /> {educationalContent.accountBalance.tip}</p>
              </div>
            )}
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white font-mono focus:border-[#00cfff] outline-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] focus:shadow-[0_0_15px_rgba(0,207,255,0.1)]"
              placeholder="Enter your account balance"
            />
            <p className="text-[10px] font-bold text-[#00cfff]/40 mt-2 uppercase tracking-widest">
              Total money available for trading
            </p>
          </div>

          {/* Risk Per Trade */}
          <div className="bg-[#030308]/60 p-5 rounded-xl border border-[#00cfff]/10 relative group">
            <div className="absolute inset-0 bg-[#00cfff]/0 group-hover:bg-[#00cfff]/[0.02] transition-all rounded-xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">Risk Per Trade</label>
                <button
                  onClick={() => setShowInfo(showInfo === 'riskPercent' ? null : 'riskPercent')}
                  className="text-[#00cfff] hover:text-[#00e5ff] text-sm ml-2 drop-shadow-[0_0_5px_#00cfff]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <span className={`text-sm font-mono font-bold drop-shadow-[0_0_5px_currentColor] ${riskLevel.color === 'green' ? 'text-green-400' : riskLevel.color === 'blue' ? 'text-[#00cfff]' : riskLevel.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                {riskPercent}%
              </span>
            </div>
            {showInfo === 'riskPercent' && (
              <div className="mb-4 p-4 bg-[#030308]/90 rounded-xl border border-[#00cfff]/50 shadow-[0_0_15px_rgba(0,207,255,0.1)] backdrop-blur-md">
                <h4 className="font-extrabold text-[#00cfff] text-xs mb-2 uppercase tracking-widest drop-shadow-[0_0_3px_#00cfff]">{educationalContent.riskPercent.title}</h4>
                <p className="text-gray-300 text-xs leading-relaxed font-medium mb-2">{educationalContent.riskPercent.content}</p>
                <p className="text-[#00cfff] text-[10px] uppercase tracking-widest bg-[#00cfff]/10 p-2 rounded border border-[#00cfff]/20 inline-flex items-center gap-1 font-bold mt-1"><Lightbulb className="w-3 h-3" /> {educationalContent.riskPercent.tip}</p>
              </div>
            )}
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#030308] border border-[#00cfff]/30 rounded-lg appearance-none cursor-pointer accent-[#00cfff]"
            />
            <div className="flex justify-between text-[9px] font-bold text-[#00cfff]/50 mt-3 uppercase tracking-widest">
              <span>0.5% (SAFE)</span>
              <span className={`px-2 py-1 rounded-md border bg-opacity-20 ${riskLevel.color === 'green' ? 'bg-green-900 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.1)]' : riskLevel.color === 'blue' ? 'bg-[#00cfff]/20 border-[#00cfff]/50 text-[#00cfff] shadow-[0_0_10px_rgba(0,207,255,0.1)]' : riskLevel.color === 'yellow' ? 'bg-yellow-900 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : 'bg-red-900 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]'}`}>
                {riskLevel.level}
              </span>
              <span>10% (DANGER)</span>
            </div>
            
            {/* Quick presets */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3, 5].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setRiskPercent(pct)}
                  className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-extrabold tracking-widest transition-all ${
                    riskPercent === pct 
                      ? 'bg-[#00cfff]/20 text-[#00cfff] border border-[#00cfff] shadow-[0_0_10px_rgba(0,207,255,0.2)]' 
                      : 'bg-[#030308] text-[#00cfff]/50 border border-[#00cfff]/20 hover:bg-[#00cfff]/10 hover:text-[#00cfff]'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Trade Details */}
          <div className="bg-[#030308]/60 p-5 rounded-xl border border-[#00cfff]/10 relative group">
            <div className="absolute inset-0 bg-[#00cfff]/0 group-hover:bg-[#00cfff]/[0.02] transition-all rounded-xl pointer-events-none"></div>
            <h4 className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-4">Trade Details</h4>
            
            {/* Trade Type */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setTradeType('BUY')}
                className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl font-extrabold text-[10px] uppercase tracking-widest transition-all ${
                  tradeType === 'BUY' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.2)]' 
                    : 'bg-[#030308] text-[#00cfff]/50 border border-[#00cfff]/20 hover:bg-[#00cfff]/10 hover:text-[#00cfff]'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> BUY (LONG)
              </button>
              <button
                onClick={() => setTradeType('SELL')}
                className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl font-extrabold text-[10px] uppercase tracking-widest transition-all ${
                  tradeType === 'SELL' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500 shadow-[0_0_15px_rgba(248,113,113,0.2)]' 
                    : 'bg-[#030308] text-[#00cfff]/50 border border-[#00cfff]/20 hover:bg-[#00cfff]/10 hover:text-[#00cfff]'
                }`}
              >
                <TrendingDown className="w-4 h-4" /> SELL (SHORT)
              </button>
            </div>

            {/* Entry Price */}
            <div className="mb-5">
              <div className="flex items-center mb-2">
                <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">Entry Price (optional)</label>
              </div>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white font-mono focus:border-[#00cfff] outline-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] focus:shadow-[0_0_15px_rgba(0,207,255,0.1)]"
                placeholder="e.g. 50000"
              />
            </div>

            {/* Stop Loss & Take Profit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center mb-2">
                  <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">Stop Loss %</label>
                  <button
                    onClick={() => setShowInfo(showInfo === 'stopLoss' ? null : 'stopLoss')}
                    className="text-[#00cfff] hover:text-[#00e5ff] text-sm ml-1 drop-shadow-[0_0_5px_#00cfff]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                {showInfo === 'stopLoss' && (
                  <div className="mb-3 p-3 bg-[#030308]/90 rounded-xl border border-[#00cfff]/50 shadow-[0_0_15px_rgba(0,207,255,0.1)] backdrop-blur-md">
                    <p className="text-gray-300 text-xs leading-relaxed font-medium mb-2">{educationalContent.stopLoss.content}</p>
                    <p className="text-[#00cfff] text-[10px] uppercase tracking-widest bg-[#00cfff]/10 p-2 rounded border border-[#00cfff]/20 inline-flex items-center gap-1 font-bold"><Lightbulb className="w-3 h-3" /> {educationalContent.stopLoss.tip}</p>
                  </div>
                )}
                <input
                  type="number"
                  step="0.1"
                  value={stopLossPercent}
                  onChange={(e) => setStopLossPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white font-mono focus:border-[#00cfff] outline-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] focus:shadow-[0_0_15px_rgba(0,207,255,0.1)]"
                />
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">Take Profit %</label>
                  <button
                    onClick={() => setShowInfo(showInfo === 'takeProfit' ? null : 'takeProfit')}
                    className="text-[#00cfff] hover:text-[#00e5ff] text-sm ml-1 drop-shadow-[0_0_5px_#00cfff]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                {showInfo === 'takeProfit' && (
                  <div className="mb-3 p-3 bg-[#030308]/90 rounded-xl border border-[#00cfff]/50 shadow-[0_0_15px_rgba(0,207,255,0.1)] backdrop-blur-md">
                    <p className="text-gray-300 text-xs leading-relaxed font-medium mb-2">{educationalContent.takeProfit.content}</p>
                    <p className="text-[#00cfff] text-[10px] uppercase tracking-widest bg-[#00cfff]/10 p-2 rounded border border-[#00cfff]/20 inline-flex items-center gap-1 font-bold"><Lightbulb className="w-3 h-3" /> {educationalContent.takeProfit.tip}</p>
                  </div>
                )}
                <input
                  type="number"
                  step="0.1"
                  value={takeProfitPercent}
                  onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white font-mono focus:border-[#00cfff] outline-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] focus:shadow-[0_0_15px_rgba(0,207,255,0.1)]"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {calculations && (
            <div className="bg-[#00cfff]/5 p-5 rounded-xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00cfff]/5 rounded-full blur-3xl pointer-events-none"></div>
              <h4 className="text-[10px] font-extrabold text-[#00cfff] uppercase tracking-widest mb-4 flex items-center gap-2 drop-shadow-[0_0_5px_#00cfff]">
                <BarChart className="w-5 h-5" /> Your Trading Plan
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Risk Amount */}
                <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/30 shadow-[inset_0_0_15px_rgba(248,113,113,0.05)]">
                  <div className="text-[10px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest mb-1">Maximum Risk</div>
                  <div className="text-2xl font-mono font-extrabold text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">
                    ${calculations.riskAmount.toFixed(2)}
                  </div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                    {riskPercent}% of ${accountBalance.toLocaleString()}
                  </div>
                </div>

                {/* Position Size */}
                <div className="bg-green-900/10 p-4 rounded-xl border border-green-500/30 shadow-[inset_0_0_15px_rgba(74,222,128,0.05)]">
                  <div className="flex items-center mb-1">
                    <span className="text-[10px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest">Position Size</span>
                    <button
                      onClick={() => setShowInfo(showInfo === 'positionSize' ? null : 'positionSize')}
                      className="text-[#00cfff] hover:text-[#00e5ff] text-sm ml-2 drop-shadow-[0_0_5px_#00cfff]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  {showInfo === 'positionSize' && (
                    <div className="mb-3 p-3 bg-[#030308]/90 rounded-xl border border-[#00cfff]/50 shadow-[0_0_15px_rgba(0,207,255,0.1)] backdrop-blur-md">
                      <p className="text-gray-300 text-xs leading-relaxed font-medium mb-2">{educationalContent.positionSize.content}</p>
                      <p className="text-[#00cfff] text-[10px] uppercase tracking-widest bg-[#00cfff]/10 p-2 rounded border border-[#00cfff]/20 inline-flex items-center gap-1 font-bold"><Lightbulb className="w-3 h-3" /> {educationalContent.positionSize.tip}</p>
                    </div>
                  )}
                  <div className="text-2xl font-mono font-extrabold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                    ${calculations.positionSize.toFixed(2)}
                  </div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                    {calculations.positionSize > accountBalance 
                      ? '⚠️ Exceeds balance!' 
                      : `${((calculations.positionSize / accountBalance) * 100).toFixed(1)}% of balance`}
                  </div>
                </div>
              </div>

              {/* SL & TP Prices */}
              {entryPrice && calculations.stopLossPrice > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/20 shadow-[inset_0_0_15px_rgba(248,113,113,0.02)]">
                    <div className="text-[10px] font-extrabold text-red-400/70 uppercase tracking-widest mb-1 flex items-center gap-1"><OctagonX className="w-3 h-3" /> Stop Loss</div>
                    <div className="text-xl font-mono font-bold text-red-400 drop-shadow-[0_0_3px_rgba(248,113,113,0.5)]">
                      ${calculations.stopLossPrice.toFixed(2)}
                    </div>
                    <div className="text-[9px] font-bold text-red-400/50 uppercase tracking-widest mt-1">
                      -{stopLossPercent}% from entry
                    </div>
                  </div>
                  <div className="bg-green-900/10 p-4 rounded-xl border border-green-500/20 shadow-[inset_0_0_15px_rgba(74,222,128,0.02)]">
                    <div className="text-[10px] font-extrabold text-green-400/70 uppercase tracking-widest mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Take Profit</div>
                    <div className="text-xl font-mono font-bold text-green-400 drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]">
                      ${calculations.takeProfitPrice.toFixed(2)}
                    </div>
                    <div className="text-[9px] font-bold text-green-400/50 uppercase tracking-widest mt-1">
                      +{takeProfitPercent}% from entry
                    </div>
                  </div>
                </div>
              )}

              {/* Risk/Reward Ratio */}
              <div className="mt-4 p-5 rounded-xl bg-[#030308]/60 border border-[#00cfff]/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">Risk/Reward Ratio</span>
                  <span className={`text-xl font-mono font-extrabold drop-shadow-[0_0_5px_currentColor] ${
                    calculations.riskRewardRatio >= 2 
                      ? 'text-green-400' 
                      : calculations.riskRewardRatio >= 1 
                      ? 'text-yellow-400' 
                      : 'text-red-400'
                  }`}>
                    {calculations.rrFormatted}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="h-2.5 bg-[#030308] rounded-full overflow-hidden flex border border-[#00cfff]/20">
                    <div 
                      className="bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" 
                      style={{ width: `${Math.min(100 / (1 + calculations.riskRewardRatio), 100)}%` }}
                    ></div>
                    <div 
                      className="bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" 
                      style={{ width: `${Math.min(100 * calculations.riskRewardRatio / (1 + calculations.riskRewardRatio), 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest mt-2">
                    <span>Risk: ${calculations.potentialLoss.toFixed(2)}</span>
                    <span>Reward: ${calculations.potentialProfit.toFixed(2)}</span>
                  </div>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 p-3 rounded-lg border bg-opacity-20 ${
                  calculations.riskRewardRatio >= 2 
                    ? 'text-green-400 bg-green-900 border-green-500/50' 
                    : calculations.riskRewardRatio >= 1 
                    ? 'text-yellow-400 bg-yellow-900 border-yellow-500/50' 
                    : 'text-red-400 bg-red-900 border-red-500/50'
                }`}>
                  {calculations.riskRewardRatio >= 2 
                    ? <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Great! At least 2:1 ratio - profitable with 50% win rate</span>
                    : calculations.riskRewardRatio >= 1 
                    ? <span className="flex items-center gap-1"><TriangleAlert className="w-4 h-4"/> Okay ratio - needs {">"}50% win rate to be profitable</span>
                    : <span className="flex items-center gap-1"><XCircle className="w-4 h-4"/> Poor ratio - very high win rate required</span>}
                </p>
              </div>
            </div>
          )}

          {/* Apply Button */}
          {onApplySettings && calculations && (
            <button
              onClick={() => onApplySettings({
                tradeAmount: calculations.positionSize,
                stopLossPct: stopLossPercent,
                takeProfitPct: takeProfitPercent
              })}
              className="w-full bg-[#00cfff] text-[#030308] hover:bg-[#00e5ff] font-extrabold text-[11px] uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5 mt-2"
            >
              APPLY SETTINGS TO TRADE
            </button>
          )}

          {/* Beginner Tips */}
          <div className="bg-[#00cfff]/5 p-5 rounded-xl border border-[#00cfff]/20 shadow-[0_0_15px_rgba(0,207,255,0.05)] mt-4">
            <h4 className="text-[10px] font-extrabold text-[#00cfff] uppercase tracking-widest mb-3 flex items-center gap-2 drop-shadow-[0_0_5px_#00cfff]">
              <Lightbulb className="w-5 h-5" /> Beginner Tips
            </h4>
            <ul className="text-xs text-gray-300 space-y-3 font-medium leading-relaxed">
              <li className="flex items-start gap-2"><span className="text-[#00cfff] mt-0.5">•</span> <span><strong className="text-white">Start with 1-2% risk</strong> - Protects your account from losing streaks</span></li>
              <li className="flex items-start gap-2"><span className="text-[#00cfff] mt-0.5">•</span> <span><strong className="text-white">Use stop loss always</strong> - Never trade without a safety net</span></li>
              <li className="flex items-start gap-2"><span className="text-[#00cfff] mt-0.5">•</span> <span><strong className="text-white">Aim for 2:1 ratio</strong> - Risk $100 to make $200</span></li>
              <li className="flex items-start gap-2"><span className="text-[#00cfff] mt-0.5">•</span> <span><strong className="text-white">Keep a trading journal</strong> - Track your wins and losses</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementCalculator;

