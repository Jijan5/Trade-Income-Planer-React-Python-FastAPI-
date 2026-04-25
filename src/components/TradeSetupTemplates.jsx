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
    <div className="bg-[#0a0f1c]/60 p-5 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md mb-4">
      <div className="flex items-center gap-2 mb-3 border-b border-[#00cfff]/10 pb-3">
        <span className="text-xl">📋</span>
        <h4 className="text-[10px] font-extrabold text-[#00cfff] uppercase tracking-widest drop-shadow-[0_0_5px_#00cfff]">Trade Setup Templates</h4>
      </div>
      <p className="text-[10px] text-[#00cfff]/50 mb-4 font-extrabold uppercase tracking-widest">Select a setup to automatically configure your trade parameters:</p>
      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {Object.values(TRADE_SETUPS).map((template) => (
          <div key={template.id} className={`border rounded-xl overflow-hidden transition-all duration-300 ${selectedTemplate === template.id ? `border-[#00cfff] bg-[#00cfff]/20 shadow-[0_0_15px_rgba(0,207,255,0.1)]` : "border-[#00cfff]/10 bg-[#030308]/60 hover:bg-[#00cfff]/5 hover:border-[#00cfff]/30"}`}>
            <button onClick={() => { if (expandedTemplate === template.id) { setExpandedTemplate(null); } else { setExpandedTemplate(template.id); onSelectTemplate(template.id); } }} className="w-full p-4 flex items-center gap-4 text-left">
              <span className="text-3xl drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{template.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-extrabold uppercase tracking-widest ${selectedTemplate === template.id ? 'text-[#00cfff] drop-shadow-[0_0_3px_#00cfff]' : 'text-white'}`}>{template.name}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${template.riskLevel === "High" || template.riskLevel === "Very High" ? "bg-red-900/30 text-red-400 border-red-500/50" : template.riskLevel === "Medium-High" ? "bg-orange-900/30 text-orange-400 border-orange-500/50" : "bg-green-900/30 text-green-400 border-green-500/50"}`}>{template.riskLevel} Risk</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400">{template.description}</p>
              </div>
            </button>
            {expandedTemplate === template.id && (
              <div className="px-4 pb-4 border-t border-[#00cfff]/10 pt-4 animate-fade-in">
                <div className="mb-3 text-[10px] font-extrabold uppercase tracking-widest"><span className="text-[#00cfff]/50">Best For:</span> <span className="text-[#00cfff] ml-1 drop-shadow-[0_0_3px_#00cfff]">{template.bestFor}</span></div>
                <ol className="text-[11px] font-medium text-gray-300 space-y-2 mb-4">
                  {template.steps.map((step, idx) => (<li key={idx} className="flex gap-2 items-start"><span className="text-[#00cfff] font-bold">{idx + 1}.</span><span>{step}</span></li>))}
                </ol>
                <div className="bg-[#030308]/80 p-3 rounded-xl mb-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest border border-[#00cfff]/20"><span className="text-[#00cfff]">💡 </span>{template.tip}</div>
                <div className="grid grid-cols-3 gap-3 text-[10px] font-extrabold uppercase tracking-widest mb-4">
                  <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/30 text-center"><span className="text-red-400/50 block mb-1">SL</span><span className="text-red-400 font-mono text-sm">{template.slPct}%</span></div>
                  <div className="bg-green-900/20 p-3 rounded-xl border border-green-500/30 text-center"><span className="text-green-400/50 block mb-1">TP</span><span className="text-green-400 font-mono text-sm">{template.tpPct}%</span></div>
                  <div className="bg-[#00cfff]/10 p-3 rounded-xl border border-[#00cfff]/30 text-center"><span className="text-[#00cfff]/50 block mb-1">R/R</span><span className="text-[#00cfff] font-mono text-sm">1:{(template.tpPct / template.slPct).toFixed(1)}</span></div>
                </div>
                <button onClick={() => onApplyTemplate(template)} className="w-full bg-[#00cfff] text-[#030308] hover:bg-[#00e5ff] font-extrabold text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5">APPLY THIS SETUP</button>
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
    <div className="mb-5">
      <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2 flex items-center gap-1">
        <span className="text-sm">📋</span> Trade Setup Template
      </label>
      <select 
        value={selectedTemplate || ""} 
        onChange={(e) => { const template = Object.values(TRADE_SETUPS).find((t) => t.id === e.target.value); if (template) { onSelectTemplate(template.id); onApplyTemplate(template); } }} 
        className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-[#00cfff] font-extrabold uppercase tracking-widest text-[11px] focus:border-[#00cfff] outline-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] focus:shadow-[0_0_15px_rgba(0,207,255,0.1)] cursor-pointer"
      >
        <option value="" className="bg-[#030308] text-gray-500">SELECT A SETUP TEMPLATE...</option>
        {Object.values(TRADE_SETUPS).map((template) => (<option key={template.id} value={template.id} className="bg-[#030308] text-white"> {template.name} (1:{(template.tpPct / template.slPct).toFixed(1)})</option>))}
      </select>
    </div>
  );
};

export { TRADE_SETUPS };
export default TradeSetupTemplates;
