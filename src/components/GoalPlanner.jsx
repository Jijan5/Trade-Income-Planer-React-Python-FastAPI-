import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-engine-panel/95 border border-engine-neon/30 p-4 rounded-xl shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.2)] backdrop-blur-md">
        <p className="text-[10px] text-engine-neon font-extrabold uppercase tracking-widest mb-1">Target for {label}</p>
        <p className="text-white font-mono font-bold text-xl drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)}
        </p>
      </div>
    );
  }
  return null;
};

const GoalPlanner = () => {
  const [initialCapital, setInitialCapital] = useState(10000);
  const [targetBalance, setTargetBalance] = useState(100000);
  const [deadlineMonths, setDeadlineMonths] = useState(12);
  const [avgWinSize, setAvgWinSize] = useState(500);

  // Core Math Engine (Updates instantly as state changes)
  const { requiredReturn, feasibility, message, chartData, actionPlan } = useMemo(() => {
    let initial = parseFloat(initialCapital);
    let target = parseFloat(targetBalance);
    let months = parseInt(deadlineMonths);
    let winSize = parseFloat(avgWinSize);

    // Safety checks
    if (isNaN(initial) || initial <= 0) initial = 1;
    if (isNaN(target) || target <= initial) target = initial + 1;
    if (isNaN(months) || months <= 0) months = 1;
    if (isNaN(winSize) || winSize <= 0) winSize = 100;

    // Compounding Math
    const requiredGrowth = (target / initial) ** (1 / months) - 1;
    const requiredMonthlyPct = requiredGrowth * 100;

    // Feasibility Logic
    let feas = "Realistic";
    let msg = "Achievable with disciplined risk management.";
    if (requiredMonthlyPct > 50) { 
        feas = "Very Unlikely"; 
        msg = "Extremely high risk required. Account ruin is highly probable."; 
    }
    else if (requiredMonthlyPct > 20) { 
        feas = "Ambitious"; 
        msg = "Requires high skill or aggressive risk-taking."; 
    }
    else if (requiredMonthlyPct > 10) { 
        feas = "Challenging"; 
        msg = "Professional level returns. Will require extreme consistency."; 
    }

    // Chart Data Generation
    const data = [];
    let currentBal = initial;
    for (let i = 0; i <= months; i++) {
      data.push({
        month: i === 0 ? "Now" : `M${i}`,
        balance: currentBal,
      });
      currentBal *= (1 + requiredGrowth);
    }

    // Action Plan Math (Focused on Month 1 to stay realistic)
    const month1Profit = initial * requiredGrowth;
    const weeklyProfit = month1Profit / 4;
    const dailyProfit = weeklyProfit / 5;
    const netWinsPerWeek = weeklyProfit / winSize;

    return {
      requiredReturn: requiredMonthlyPct,
      feasibility: feas,
      message: msg,
      chartData: data,
      actionPlan: {
        month1Profit,
        weeklyProfit,
        dailyProfit,
        netWinsPerWeek
      }
    };
  }, [initialCapital, targetBalance, deadlineMonths, avgWinSize]);

  // UI Helpers
  const getFeasibilityColor = (feas) => {
    switch (feas) {
      case "Realistic": return "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]";
      case "Challenging": return "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]";
      case "Ambitious": return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]";
      case "Very Unlikely": return "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]";
      default: return "text-gray-400";
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-engine-panel/80 backdrop-blur-md p-6 rounded-2xl border border-engine-neon/20 shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.05)]">
        <h2 className="text-2xl font-extrabold text-white uppercase tracking-widest flex items-center gap-3">
          <span className="text-engine-neon drop-shadow-[0_0_5px_var(--engine-neon)]">🎯</span> Ultimate Goal Planner
        </h2>
        <p className="text-sm text-engine-neon/60 font-medium mt-2 max-w-2xl">
          Map out your exact path to profitability. Adjust the variables below to instantly see your required compounding curve and action plan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & Feasibility */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Controls Card */}
          <div className="bg-engine-panel p-6 rounded-2xl border border-engine-neon/20 shadow-2xl space-y-8">
            <h3 className="text-xs font-extrabold text-engine-neon uppercase tracking-widest border-b border-engine-neon/20 pb-3">Journey Parameters</h3>
            
            {/* Initial Capital Input+Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Initial Capital</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">$</span>
                    <input 
                      type="number" 
                      value={initialCapital} 
                      onChange={(e) => setInitialCapital(e.target.value)}
                      className="bg-engine-bg border border-engine-neon/30 text-white font-mono font-bold rounded-lg pl-6 pr-3 py-1.5 w-32 text-right focus:border-engine-neon focus:shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.2)] outline-none transition-all"
                    />
                </div>
              </div>
              <input 
                type="range" 
                min="100" 
                max="10000000" 
                step="100"
                value={initialCapital} 
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-engine-neon"
              />
            </div>

            {/* Target Balance Input+Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Target Balance</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">$</span>
                    <input 
                      type="number" 
                      value={targetBalance} 
                      onChange={(e) => setTargetBalance(e.target.value)}
                      className="bg-engine-bg border border-engine-neon/30 text-white font-mono font-bold rounded-lg pl-6 pr-3 py-1.5 w-32 text-right focus:border-engine-neon focus:shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.2)] outline-none transition-all"
                    />
                </div>
              </div>
              <input 
                type="range" 
                min="1000" 
                max="10000000" 
                step="1000"
                value={targetBalance} 
                onChange={(e) => setTargetBalance(e.target.value)}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-engine-neon"
              />
            </div>

            {/* Manual Inputs Row */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-engine-neon/20">
                <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Deadline (Months)</label>
                    <input 
                        type="number" 
                        value={deadlineMonths} 
                        onChange={(e) => setDeadlineMonths(e.target.value)}
                        className="w-full bg-engine-bg border border-engine-neon/30 text-white font-mono font-bold rounded-lg px-4 py-3 focus:border-engine-neon focus:shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.2)] outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Avg Win Size ($)</label>
                    <input 
                        type="number" 
                        value={avgWinSize} 
                        onChange={(e) => setAvgWinSize(e.target.value)}
                        className="w-full bg-engine-bg border border-engine-neon/30 text-white font-mono font-bold rounded-lg px-4 py-3 focus:border-engine-neon focus:shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.2)] outline-none transition-all"
                    />
                </div>
            </div>
          </div>

          {/* Feasibility Result Card */}
          <div className="bg-engine-panel p-6 rounded-2xl border border-engine-neon/20 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
             {/* Dynamic Glow Background */}
             <div className={`absolute inset-0 opacity-10 pointer-events-none transition-colors duration-500
                ${feasibility === 'Realistic' ? 'bg-green-500' : feasibility === 'Challenging' ? 'bg-blue-500' : feasibility === 'Ambitious' ? 'bg-yellow-500' : 'bg-red-500'}
             `}></div>
             
             <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 relative z-10">Required Monthly Return</p>
             <p className="text-5xl font-mono font-extrabold text-white mb-4 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                {requiredReturn.toFixed(2)}%
             </p>
             <div className="bg-engine-bg/80 px-6 py-2 rounded-xl border border-engine-neon/30 relative z-10 mb-4">
                 <p className={`text-sm font-extrabold uppercase tracking-widest ${getFeasibilityColor(feasibility)}`}>
                    {feasibility}
                 </p>
             </div>
             <p className="text-xs text-gray-400 font-medium relative z-10 leading-relaxed px-4">
                {message}
             </p>
          </div>

        </div>

        {/* Right Column: Chart & Action Plan */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Chart Card */}
          <div className="bg-engine-panel p-6 rounded-2xl border border-engine-neon/20 shadow-2xl flex-1 flex flex-col min-h-[400px]">
             <h3 className="text-xs font-extrabold text-engine-neon uppercase tracking-widest border-b border-engine-neon/20 pb-3 mb-6">Compounding Projection Path</h3>
             <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--engine-neon)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--engine-neon)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} 
                            dy={10}
                        />
                        <YAxis 
                            hide 
                            domain={['dataMin', 'dataMax']} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--engine-neon)', strokeWidth: 1, strokeDasharray: '5 5' }} />
                        <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="var(--engine-neon)" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorBalance)" 
                            activeDot={{ r: 6, fill: '#030308', stroke: 'var(--engine-neon)', strokeWidth: 2 }}
                            style={{ filter: 'drop-shadow(0 0 8px rgba(var(--engine-neon-rgb),0.4))' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Action Plan Grid */}
          <div className="bg-engine-panel p-6 rounded-2xl border border-engine-neon/20 shadow-2xl">
             <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-engine-neon/20 pb-3 mb-6 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_#4ade80]"></span>
                 Month 1 Action Plan
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 
                 <div className="bg-engine-panel/80/40 border border-engine-neon/20 rounded-xl p-5 hover:border-engine-neon/30 transition-colors">
                     <p className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest mb-2">Month 1 Target</p>
                     <p className="text-xl font-bold font-mono text-white">+{formatCurrency(actionPlan.month1Profit)}</p>
                 </div>

                 <div className="bg-engine-panel/80/40 border border-engine-neon/20 rounded-xl p-5 hover:border-engine-neon/30 transition-colors">
                     <p className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest mb-2">Weekly Quota</p>
                     <p className="text-xl font-bold font-mono text-green-400">+{formatCurrency(actionPlan.weeklyProfit)}</p>
                 </div>

                 <div className="bg-engine-panel/80/40 border border-engine-neon/20 rounded-xl p-5 hover:border-engine-neon/30 transition-colors">
                     <p className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest mb-2">Daily Quota (5D)</p>
                     <p className="text-xl font-bold font-mono text-blue-400">+{formatCurrency(actionPlan.dailyProfit)}</p>
                 </div>

                 <div className="bg-engine-button/10 border border-engine-neon/30 rounded-xl p-5 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-engine-button/5 group-hover:bg-engine-button/10 transition-colors"></div>
                     <div className="relative z-10">
                        <p className="text-[9px] text-engine-neon/70 font-extrabold uppercase tracking-widest mb-2">Required Wins/Wk</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold font-mono text-white drop-shadow-[0_0_5px_var(--engine-neon)]">
                                {actionPlan.netWinsPerWeek.toFixed(1)}
                            </p>
                            <span className="text-[10px] text-engine-neon font-bold">Net Wins</span>
                        </div>
                     </div>
                 </div>

             </div>
             <p className="text-[10px] text-gray-500 font-medium mt-6 italic text-center">
                 *Because you are compounding, your profit targets will increase each month. This action plan shows what you need to achieve in your first 30 days.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GoalPlanner;
