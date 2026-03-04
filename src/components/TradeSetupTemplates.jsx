import React, { useState } from "react";

// TRADE SETUP TEMPLATES - Different R/R Ratios
const TRADE_SETUPS = {
  breakout: {
    id: "breakout",
    name: "Breakout Trading",
    icon: "🚀",
    description: "Enter when price breaks above resistance or below support",
    bestFor: "Trending markets",
    riskLevel: "Medium-High",
    steps: [
      "Identify key resistance/support levels",
      "Wait for price to close beyond the level",
      "Enter on retest of the broken level",
      "Place SL just below/above the breakout level",
      "Target 2:1 risk/reward minimum",
    ],
    slPct: 2,
    tpPct: 4,
    color: "blue",
    tip: "Volume confirmation is crucial for breakouts!",
  },
  reversal: {
    id: "reversal",
    name: "Reversal Trading",
    icon: "🔄",
    description: "Trade against the trend at potential reversal points",
    bestFor: "End of trends",
    riskLevel: "High",
    steps: [
      "Look for signs of trend exhaustion",
      "Check for divergence (RSI/MACD)",
      "Wait for reversal candlestick patterns",
      "Enter on confirmation candle",
      "Use tight stop loss",
    ],
    slPct: 1,
    tpPct: 1,
    color: "red",
    tip: "Reversals are tricky - wait for strong confirmation!",
  },
  range: {
    id: "range",
    name: "Range Trading",
    icon: "📊",
    description: "Buy at support, sell at resistance in sideways markets",
    bestFor: "Sideways markets",
    riskLevel: "Low-Medium",
    steps: [
      "Identify clear support and resistance",
      "Wait for price near support for BUY",
      "Wait for price near resistance for SELL",
      "SL just outside the range",
      "Target opposite side of range",
    ],
    slPct: 1,
    tpPct: 3,
    color: "green",
    tip: "Range trading is great for beginners!",
  },
  trendFollowing: {
    id: "trendFollowing",
    name: "Trend Following",
    icon: "📈",
    description: "Trade in the direction of the trend using moving averages",
    bestFor: "Strong trending markets",
    riskLevel: "Medium",
    steps: [
      "Identify the trend using higher highs/lows",
      "Use EMA crossover for entry signals",
      "Enter on pullbacks to moving average",
      "Trail stop loss below/above trend line",
      "Stay in until trend reverses",
    ],
    slPct: 3,
    tpPct: 4.5,
    color: "purple",
    tip: "The trend is your friend until it ends!",
  },
  scalping: {
    id: "scalping",
    name: "Scalping",
    icon: "⚡",
    description: "Quick trades for small profits in volatile markets",
    bestFor: "Highly volatile markets",
    riskLevel: "Very High",
    steps: [
      "Focus on 1-5 minute charts",
      "Very small stop losses (0.25-0.5%)",
      "Quick exits at 0.5-1% profit",
      "High volume of trades",
      "Strict exit rules",
    ],
    slPct: 0.5,
    tpPct: 0.5,
    color: "yellow",
    tip: "Scalping requires focus - not recommended for beginners!",
  },
  swing: {
    id: "swing",
    name: "Swing Trading",
    icon: "🌊",
    description: "Hold positions for days to weeks to capture swings",
    bestFor: "Medium-term traders",
    riskLevel: "Medium",
    steps: [
      "Identify swing highs and lows",
      "Wait for price to retrace 50-61.8%",
      "Enter on momentum confirmation",
      "Wider stop loss (2-3%)",
      "Hold for multiple days",
    ],
    slPct: 2,
    tpPct: 6,
    color: "cyan",
    tip: "Swing trading balances time and profit potential!",
  },
};

export const TradeSetupTemplates = ({
  selectedTemplate,
  onSelectTemplate,
  onApplyTemplate,
}) => {
  const [expandedTemplate, setExpandedTemplate] = useState(null);

  return (
    <div className="bg-gray-900/80 p-4 rounded-lg border border-teal-500/30 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📋</span>
        <h4 className="text-sm font-bold text-white uppercase">Trade Setup Templates</h4>
      </div>
      <p className="text-xs text-gray-400 mb-3">Select a setup to automatically configure your trade parameters:</p>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {Object.values(TRADE_SETUPS).map((template) => (
          <div key={template.id} className={`border rounded-lg overflow-hidden ${selectedTemplate === template.id ? `border-${template.color}-500 bg-${template.color}-900/20` : "border-gray-700 bg-gray-800/50"}`}>
            <button onClick={() => { if (expandedTemplate === template.id) { setExpandedTemplate(null); } else { setExpandedTemplate(template.id); onSelectTemplate(template.id); } }} className="w-full p-3 flex items-center gap-3 text-left">
              <span className="text-2xl">{template.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{template.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${template.riskLevel === "High" || template.riskLevel === "Very High" ? "bg-red-900 text-red-400" : template.riskLevel === "Medium-High" ? "bg-orange-900 text-orange-400" : "bg-green-900 text-green-400"}`}>{template.riskLevel} Risk</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{template.description}</p>
              </div>
            </button>
            {expandedTemplate === template.id && (
              <div className="px-3 pb-3 border-t border-gray-700 pt-3">
                <div className="mb-2 text-xs"><span className="text-gray-500">Best For:</span> <span className="text-blue-400 ml-1">{template.bestFor}</span></div>
                <ol className="text-xs text-gray-300 space-y-1 mb-3">
                  {template.steps.map((step, idx) => (<li key={idx} className="flex gap-2"><span className="text-gray-500">{idx + 1}.</span><span>{step}</span></li>))}
                </ol>
                <div className="bg-gray-800/50 p-2 rounded mb-3 text-xs text-gray-300 italic"><span className="text-yellow-400">💡 </span>{template.tip}</div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div className="bg-red-900/30 p-2 rounded text-center"><span className="text-gray-500 block">SL</span><span className="text-red-400 font-bold">{template.slPct}%</span></div>
                  <div className="bg-green-900/30 p-2 rounded text-center"><span className="text-gray-500 block">TP</span><span className="text-green-400 font-bold">{template.tpPct}%</span></div>
                  <div className="bg-purple-900/30 p-2 rounded text-center"><span className="text-gray-500 block">R/R</span><span className="text-purple-400 font-bold">1:{(template.tpPct / template.slPct).toFixed(1)}</span></div>
                </div>
                <button onClick={() => onApplyTemplate(template)} className="w-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2 rounded">Apply This Setup</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const QuickTemplateSelector = ({ selectedTemplate, onSelectTemplate, onApplyTemplate }) => {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">📋 Trade Setup Template</label>
      <select value={selectedTemplate || ""} onChange={(e) => { const template = Object.values(TRADE_SETUPS).find((t) => t.id === e.target.value); if (template) { onSelectTemplate(template.id); onApplyTemplate(template); } }} className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 text-sm">
        <option value="">Select a setup template...</option>
        {Object.values(TRADE_SETUPS).map((template) => (<option key={template.id} value={template.id}>{template.icon} {template.name} (1:{(template.tpPct / template.slPct).toFixed(1)})</option>))}
      </select>
    </div>
  );
};

export { TRADE_SETUPS };
export default TradeSetupTemplates;
