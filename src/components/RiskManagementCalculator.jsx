import React, { useState, useMemo } from 'react';

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
      title: "💰 What is Account Balance?",
      content: "Your account balance is the total amount of money you have available for trading. For beginners, it's recommended to start with virtual money or a small amount you can afford to lose.",
      tip: "Never trade with money you need for daily expenses!"
    },
    riskPercent: {
      title: "⚠️ What is Risk Per Trade?",
      content: "Risk per trade is the percentage of your account you're willing to lose if a trade goes against you. Professional traders typically risk only 1-2% per trade.",
      tip: "The 2% rule: If you lose 2% of your account 50 times in a row, you'd still have most of your money!"
    },
    stopLoss: {
      title: "🛑 What is Stop Loss?",
      content: "A stop loss is an automatic order that closes your trade when the price moves against you by a certain amount. It limits your potential loss.",
      tip: "Always use a stop loss! It's your safety net."
    },
    takeProfit: {
      title: "🎯 What is Take Profit?",
      content: "Take profit is the price level where you automatically close a winning trade to secure your profits. It's the opposite of stop loss.",
      tip: "Always have a target profit. Greed can turn winners into losers!"
    },
    positionSize: {
      title: "📊 What is Position Size?",
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
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
        <h3 className="text-sm font-bold text-white mb-4">⚠️ Risk Calculator</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Account Balance ($)</label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-400">Risk Per Trade (%)</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-blue-400">{riskPercent}%</div>
          </div>
          
          {calculations && (
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-xs text-gray-400">Max Risk Amount</div>
              <div className="text-lg font-bold text-red-400">${calculations.riskAmount.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full mode
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header with Back Button */}
        <div className="bg-gradient-to-r from-red-900 to-gray-900 p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010l6-6-1.414a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              ⚠️ Risk Management Calculator
            </h3>
          </div>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Account Balance */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <label className="text-sm font-bold text-gray-300">Account Balance</label>
              <button
                onClick={() => setShowInfo(showInfo === 'accountBalance' ? null : 'accountBalance')}
                className="text-blue-400 hover:text-blue-300 text-sm ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            {showInfo === 'accountBalance' && (
              <div className="mb-3 p-3 bg-gray-900 rounded-lg border border-blue-500">
                <h4 className="font-bold text-white text-sm mb-1">{educationalContent.accountBalance.title}</h4>
                <p className="text-gray-300 text-xs">{educationalContent.accountBalance.content}</p>
                <p className="text-yellow-400 text-xs italic mt-1">💡 {educationalContent.accountBalance.tip}</p>
              </div>
            )}
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white font-mono"
              placeholder="Enter your account balance"
            />
            <p className="text-xs text-gray-500 mt-2">
              Total money available for trading
            </p>
          </div>

          {/* Risk Per Trade */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <label className="text-sm font-bold text-gray-300">Risk Per Trade</label>
                <button
                  onClick={() => setShowInfo(showInfo === 'riskPercent' ? null : 'riskPercent')}
                  className="text-blue-400 hover:text-blue-300 text-sm ml-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <span className={`text-sm font-bold ${riskLevel.color === 'green' ? 'text-green-400' : riskLevel.color === 'blue' ? 'text-blue-400' : riskLevel.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                {riskPercent}%
              </span>
            </div>
            {showInfo === 'riskPercent' && (
              <div className="mb-3 p-3 bg-gray-900 rounded-lg border border-blue-500">
                <h4 className="font-bold text-white text-sm mb-1">{educationalContent.riskPercent.title}</h4>
                <p className="text-gray-300 text-xs">{educationalContent.riskPercent.content}</p>
                <p className="text-yellow-400 text-xs italic mt-1">💡 {educationalContent.riskPercent.tip}</p>
              </div>
            )}
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0.5% (Very Safe)</span>
              <span className={`px-2 py-1 rounded ${riskLevel.color === 'green' ? 'bg-green-900 text-green-400' : riskLevel.color === 'blue' ? 'bg-blue-900 text-blue-400' : riskLevel.color === 'yellow' ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400'}`}>
                {riskLevel.level} - {riskLevel.desc}
              </span>
              <span>10% (Dangerous)</span>
            </div>
            
            {/* Quick presets */}
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 5].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setRiskPercent(pct)}
                  className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${
                    riskPercent === pct 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Trade Details */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm font-bold text-gray-300 mb-4">Trade Details</h4>
            
            {/* Trade Type */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTradeType('BUY')}
                className={`flex-1 py-2 rounded font-bold text-sm ${
                  tradeType === 'BUY' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                📈 BUY (Long)
              </button>
              <button
                onClick={() => setTradeType('SELL')}
                className={`flex-1 py-2 rounded font-bold text-sm ${
                  tradeType === 'SELL' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                📉 SELL (Short)
              </button>
            </div>

            {/* Entry Price */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <label className="text-xs text-gray-400">Entry Price (optional)</label>
              </div>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white font-mono text-sm"
                placeholder="e.g. 50000"
              />
            </div>

            {/* Stop Loss & Take Profit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center mb-2">
                  <label className="text-xs text-gray-400">Stop Loss %</label>
                  <button
                    onClick={() => setShowInfo(showInfo === 'stopLoss' ? null : 'stopLoss')}
                    className="text-blue-400 hover:text-blue-300 text-sm ml-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                {showInfo === 'stopLoss' && (
                  <div className="mb-2 p-2 bg-gray-900 rounded border border-blue-500">
                    <p className="text-gray-300 text-xs">{educationalContent.stopLoss.content}</p>
                    <p className="text-yellow-400 text-xs italic">💡 {educationalContent.stopLoss.tip}</p>
                  </div>
                )}
                <input
                  type="number"
                  step="0.1"
                  value={stopLossPercent}
                  onChange={(e) => setStopLossPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white font-mono text-sm"
                />
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <label className="text-xs text-gray-400">Take Profit %</label>
                  <button
                    onClick={() => setShowInfo(showInfo === 'takeProfit' ? null : 'takeProfit')}
                    className="text-blue-400 hover:text-blue-300 text-sm ml-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                {showInfo === 'takeProfit' && (
                  <div className="mb-2 p-2 bg-gray-900 rounded border border-blue-500">
                    <p className="text-gray-300 text-xs">{educationalContent.takeProfit.content}</p>
                    <p className="text-yellow-400 text-xs italic">💡 {educationalContent.takeProfit.tip}</p>
                  </div>
                )}
                <input
                  type="number"
                  step="0.1"
                  value={takeProfitPercent}
                  onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {calculations && (
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-lg border border-blue-500/30">
              <h4 className="text-sm font-bold text-white mb-4">📊 Your Trading Plan</h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Risk Amount */}
                <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                  <div className="text-xs text-gray-400 mb-1">Maximum Risk</div>
                  <div className="text-xl font-bold text-red-400">
                    ${calculations.riskAmount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {riskPercent}% of ${accountBalance.toLocaleString()}
                  </div>
                </div>

                {/* Position Size */}
                <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/30">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 mb-1">Position Size</span>
                    <button
                      onClick={() => setShowInfo(showInfo === 'positionSize' ? null : 'positionSize')}
                      className="text-blue-400 hover:text-blue-300 text-sm ml-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  {showInfo === 'positionSize' && (
                    <div className="mb-2 p-2 bg-gray-900 rounded border border-blue-500">
                      <p className="text-gray-300 text-xs">{educationalContent.positionSize.content}</p>
                      <p className="text-yellow-400 text-xs italic">💡 {educationalContent.positionSize.tip}</p>
                    </div>
                  )}
                  <div className="text-xl font-bold text-green-400">
                    ${calculations.positionSize.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {calculations.positionSize > accountBalance 
                      ? '⚠️ Exceeds balance!' 
                      : `${((calculations.positionSize / accountBalance) * 100).toFixed(1)}% of balance`}
                  </div>
                </div>
              </div>

              {/* SL & TP Prices */}
              {entryPrice && calculations.stopLossPrice > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-red-900/20 p-3 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">🛑 Stop Loss</div>
                    <div className="text-lg font-bold text-red-400">
                      ${calculations.stopLossPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      -{stopLossPercent}% from entry
                    </div>
                  </div>
                  <div className="bg-green-900/20 p-3 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">🎯 Take Profit</div>
                    <div className="text-lg font-bold text-green-400">
                      ${calculations.takeProfitPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      +{takeProfitPercent}% from entry
                    </div>
                  </div>
                </div>
              )}

              {/* Risk/Reward Ratio */}
              <div className="mt-4 p-3 rounded-lg bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Risk/Reward Ratio:</span>
                  <span className={`text-lg font-bold ${
                    calculations.riskRewardRatio >= 2 
                      ? 'text-green-400' 
                      : calculations.riskRewardRatio >= 1 
                      ? 'text-yellow-400' 
                      : 'text-red-400'
                  }`}>
                    {calculations.rrFormatted}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${Math.min(100 / (1 + calculations.riskRewardRatio), 100)}%` }}
                    ></div>
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${Math.min(100 * calculations.riskRewardRatio / (1 + calculations.riskRewardRatio), 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Risk: ${calculations.potentialLoss.toFixed(2)}</span>
                    <span>Reward: ${calculations.potentialProfit.toFixed(2)}</span>
                  </div>
                </div>
                <p className={`text-xs mt-2 ${
                  calculations.riskRewardRatio >= 2 
                    ? 'text-green-400' 
                    : calculations.riskRewardRatio >= 1 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
                }`}>
                  {calculations.riskRewardRatio >= 2 
                    ? '✅ Great! At least 2:1 ratio - you can be profitable even with 50% win rate!'
                    : calculations.riskRewardRatio >= 1 
                    ? '⚠️ Okay ratio - you need to win more than 50% to be profitable'
                    : '❌ Poor ratio - you need to win most of your trades to make money!'}
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
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Apply These Settings to Trade
            </button>
          )}

          {/* Beginner Tips */}
          <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-500/30">
            <h4 className="text-sm font-bold text-yellow-400 mb-2">💡 Beginner Tips</h4>
            <ul className="text-xs text-gray-300 space-y-2">
              <li>• <strong>Start with 1-2% risk</strong> - This protects your account from losing streaks</li>
              <li>• <strong>Use stop loss always</strong> - Never trade without a safety net</li>
              <li>• <strong>Aim for 2:1 ratio</strong> - Risk $100 to make $200</li>
              <li>• <strong>Keep a trading journal</strong> - Track your wins and losses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementCalculator;

