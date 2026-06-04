import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Sparkles, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPlanLevel } from '../utils/permissions';

const StrategyCard = ({ strategyData }) => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  if (!strategyData) return null;

  const { summary, monte_carlo, daily_breakdown, formData } = strategyData;
  const ruinProb = monte_carlo && monte_carlo.ruin_probability ? parseFloat(monte_carlo.ruin_probability) : 0;
  
  const planLevel = getPlanLevel(userData?.plan);
  const isAdmin = userData?.role === 'admin';
  const canCopy = isAdmin || planLevel >= 2; // Premium or Platinum

  const handleCopyStrategy = () => {
    if (!canCopy) {
      navigate('/subscription');
      return;
    }
    navigate('/simulation/strategy', { state: { presetData: formData } });
  };

  const ddData = useMemo(() => {
    if (!daily_breakdown) return [];
    let peak = -Infinity;
    return daily_breakdown.map(d => {
      const bal = parseFloat(d.end_balance);
      if (bal > peak) peak = bal;
      const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
      return { day: d.day, drawdown: parseFloat(dd.toFixed(2)) };
    });
  }, [daily_breakdown]);

  return (
    <div className="mt-4 rounded-xl border border-engine-panel-border/30 bg-engine-bg/40 overflow-hidden relative group/strategy">
      <div className="absolute inset-0 bg-gradient-to-br from-engine-neon/5 via-transparent to-transparent opacity-0 group-hover/strategy:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      {/* What-If Projection Section */}
      {monte_carlo && (
        <div className="p-5 border-b border-engine-panel-border/20">
          <h4 className="text-[11px] font-extrabold text-white mb-3 flex items-center gap-2 uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-white" /> What-If Future Projection
          </h4>
          <div className="p-4 rounded-xl border border-[#00cfff]/20 bg-[#00cfff]/5">
            <p className="text-sm font-medium text-gray-300 leading-relaxed">
              "With your current strategy, there is a <span className={`font-mono font-bold ${ruinProb > 0 ? 'text-red-400' : 'text-green-400'}`}>{ruinProb}% probability</span> will depleted."
              {ruinProb > 0 && (
                <> Based on your strategy and a ruin probability of {ruinProb}%, depletion is projected to occur within <span className="text-white font-mono font-bold">{(summary.day_simulated * (1 - ruinProb / 100)).toFixed(0)} days</span>.</>
              )}
              {ruinProb === 0 && ` With a ruin probability of ${ruinProb}%, your account is not projected to deplete within the simulated timeframe.`}
            </p>
            <p className="text-[9px] text-gray-500 mt-3 italic font-mono">
              *Based on {monte_carlo.iterations} Monte Carlo simulations of your specific parameters.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border-b border-engine-panel-border/20">
        {[
          { label: "INITIAL CAPITAL", value: `$${summary.initial_balance}`, color: "text-white" },
          { label: "CLOSING BALANCE", value: `$${summary.final_balance}`, color: parseFloat(summary.final_balance) >= parseFloat(summary.initial_balance) ? "text-green-400" : "text-red-400" },
          { label: "NET PROFIT", value: `${parseFloat(summary.total_profit) >= 0 ? '+' : '-'}$${Math.abs(parseFloat(summary.total_profit)).toFixed(2)}`, color: parseFloat(summary.total_profit) >= 0 ? "text-green-400" : "text-red-400" },
          { label: "ROI GROWTH", value: summary.total_roi, color: parseFloat(summary.total_roi) >= 0 ? "text-purple-400" : "text-red-400" },
          { label: "MAX DRAWDOWN", value: `-${summary.max_drawdown || "0.00%"}`, color: "text-red-400" },
          { label: "PROFIT FACTOR", value: summary.profit_factor, color: parseFloat(summary.profit_factor) >= 1.5 ? "text-green-400" : "text-red-400" }
        ].map((card, idx) => (
          <div key={idx} className={`p-3 flex flex-col justify-center ${idx % 2 !== 0 ? 'border-l border-engine-panel-border/10' : ''} ${idx >= 2 ? 'border-t border-engine-panel-border/10 md:border-t-0' : ''}`}>
            <p className="text-[8px] font-extrabold text-engine-neon/70 uppercase tracking-widest mb-1">{card.label}</p>
            <p className={`text-sm font-mono font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart & Action Section */}
      <div className="p-4 bg-engine-bg/20 border-t border-engine-panel-border/10">
        <div className="flex items-center justify-between gap-4">
          {/* Miniature Equity Curve */}
          <div className="flex-1 h-12 overflow-hidden relative">
              {daily_breakdown && daily_breakdown.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={daily_breakdown}>
                          <defs>
                          <linearGradient id="colorEq" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00cfff" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#00cfff" stopOpacity={0}/>
                          </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="end_balance" stroke="#00cfff" fillOpacity={1} fill="url(#colorEq)" isAnimationActive={false} />
                      </AreaChart>
                  </ResponsiveContainer>
              )}
          </div>
          
          {/* Copy Button */}
          <button
            onClick={handleCopyStrategy}
            className="flex-shrink-0 px-5 sm:px-6 py-2 sm:py-2.5 bg-engine-button text-engine-bg text-[10px] sm:text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-button-neon hover:bg-[#00e5ff] flex items-center justify-center gap-2 z-10 relative"
          >
            {canCopy ? <Play className="w-3 h-3 sm:w-4 sm:h-4" /> : <span className="text-sm">🔒</span>}
            {canCopy ? "Copy Strategy" : "Upgrade to Copy"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyCard;
