import React, { useState, useMemo, useRef } from "react";
import { BarChart, Bar, Cell, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Sparkles, Skull, TriangleAlert, CheckCircle } from "lucide-react";
import SimulationChart from "./SimulationChart";

const ResultsDashboard = ({ data }) => {
  if (!data) return null;

  const { summary, daily_breakdown, monte_carlo, trade_log } = data;

  // A stable key that changes on every new simulation run so SimulationChart fully remounts
  const runKey = useMemo(() => {
    if (!daily_breakdown?.length) return 'empty';
    const first = daily_breakdown[0];
    const last = daily_breakdown[daily_breakdown.length - 1];
    return `${first.end_balance}-${last.end_balance}-${daily_breakdown.length}-${Date.now()}`;
  }, [daily_breakdown]);

  const [filter, setFilter] = useState("daily");
  const [viewMode, setViewMode] = useState("daily"); // 'daily' or 'journal'

  const filters = [
    { id: "daily", label: "Daily", days: 1 },
    { id: "weekly", label: "Weekly (5 Days)", days: 5 },
    { id: "monthly", label: "Monthly (20 Days)", days: 20 },
    { id: "3months", label: "3 Month", days: 60 },
    { id: "6months", label: "6 Month", days: 120 },
    { id: "9months", label: "9 Month", days: 180 },
    { id: "yearly", label: "Yearly", days: 240 },
  ];

  const aggregatedData = useMemo(() => {
    const selectedFilter = filters.find((f) => f.id === filter);
    const period = selectedFilter ? selectedFilter.days : 1;

    if (period === 1) return daily_breakdown;

    const result = [];
    for (let i = 0; i < daily_breakdown.length; i += period) {
      const chunk = daily_breakdown.slice(i, i + period);
      if (chunk.length === 0) continue;

      const first = chunk[0];
      const last = chunk[chunk.length - 1];

      const startBal = parseFloat(first.start_balance);
      const endBal = parseFloat(last.end_balance);
      const pl = endBal - startBal;
      const roi = startBal > 0 ? (pl / startBal) * 100 : 0;

      result.push({
        day: last.day,
        start_balance: startBal.toFixed(2),
        profit_loss: pl.toFixed(2),
        end_balance: endBal.toFixed(2),
        roi: roi.toFixed(2) + "%",
      });
    }
    return result;
  }, [daily_breakdown, filter]);

  const downloadCSV = () => {
    if (!daily_breakdown || daily_breakdown.length === 0) return;

    const headers = [
      "Day",
      "Start Balance",
      "Profit/Loss",
      "End Balance",
      "ROI",
    ];
    const csvContent = [
      headers.join(","),
      ...daily_breakdown.map((row) =>
        [
          row.day,
          row.start_balance,
          row.profit_loss,
          row.end_balance,
          row.roi,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "trading_simulation_results.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Warnings
  const warnings = [];
  const ror = parseFloat(summary.risk_of_ruin);
  const drawdown = parseFloat(summary.max_drawdown);
  const profitFactor = parseFloat(summary.profit_factor);

  if (ror > 1) {
    warnings.push({
      type: "danger",
      msg: `HIGH RISK OF RUIN: ${ror}% chance to blow up account.`,
    });
  }
  if (drawdown > 25) {
    warnings.push({
      type: "warning",
      msg: `HIGH DRAWDOWN: Max drawdown is ${drawdown}%. Can you handle this emotionally?`,
    });
  }
  if (profitFactor < 1.0) {
    warnings.push({
      type: "danger",
      msg: "UNPROFITABLE: Profit Factor < 1.0. You are losing money.",
    });
  } else if (profitFactor < 1.5) {
    warnings.push({
      type: "warning",
      msg: "WEAK STRATEGY: Profit Factor is low (< 1.5). Consider improving win rate or RR.",
    });
  }

  // What-If Projection Data
  const ruinProb = monte_carlo && monte_carlo.ruin_probability ? parseFloat(monte_carlo.ruin_probability) : 0;

  const mcChartData = useMemo(() => {
    if (!monte_carlo) return [];
    return [
      { name: 'Worst Case', value: parseFloat(monte_carlo.worst_case), fill: '#f87171', shadow: 'rgba(248,113,113,0.5)' },
      { name: 'Median', value: parseFloat(monte_carlo.median), fill: '#00cfff', shadow: 'rgba(var(--engine-neon-rgb),0.5)' },
      { name: 'Best Case', value: parseFloat(monte_carlo.best_case), fill: '#4ade80', shadow: 'rgba(74,222,128,0.5)' }
    ];
  }, [monte_carlo]);

  return (
    <div className="space-y-6">
      {/* What-If Simulator (Brutally Honest Projection) */}
      {monte_carlo && (
        <div className="bg-engine-panel/60 p-8 rounded-2xl border border-engine-neon/20 shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.05)] backdrop-blur-md relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${ruinProb > 20 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`}></div>
          <h3 className="text-xl font-extrabold text-white mb-4 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" /> What-If Future Projection
          </h3>
          
          <div className={`p-6 rounded-xl border ${ruinProb > 20 ? 'bg-red-900/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-engine-button/5 border-engine-neon/30 shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.1)]'}`}>
            <p className="text-xl font-medium text-gray-200 leading-relaxed">
              "With your current strategy, there is a <span className={`font-mono font-bold text-2xl ${ruinProb > 0 ? 'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]'}`}>{ruinProb}% probability</span> will depleted."
              {ruinProb > 0 && (
                <> Based on your strategy and a ruin probability of {ruinProb}%, depletion is projected to occur within <span className="text-white font-mono font-bold">
                {(summary.day_simulated * (1 - ruinProb / 100)).toFixed(0)} days
                </span>.
                </>

              )}
              {ruinProb === 0 && ` With a ruin probability of ${ruinProb}%, your account is not projected to deplete within the simulated timeframe.`}
            </p>

            {/* <p className="mt-3 text-sm text-gray-400">
              *This projection is based on {summary.day_simulated} simulated days, adjust to realistic expectations.
            </p> */}
            
            {ruinProb > 50 && (
              <p className="mt-4 text-sm text-red-400 font-extrabold uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                <Skull className="w-6 h-6" /> Critical Warning: This is gambling, not trading.
              </p>
            )}
            <p className="text-xs text-gray-500 mt-5 italic font-mono">
              *Based on {monte_carlo.iterations} Monte Carlo simulations of your specific parameters.
            </p>
          </div>
        </div>
      )}
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 bg-engine-panel/60 p-4 rounded-2xl border border-engine-neon/20 shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.05)] backdrop-blur-md">
        {[
          {
            label: "Initial Capital",
            value: `$${summary.initial_balance}`,
            color: "text-white",
            shadow: "drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]",
            tooltip: "The starting balance for your simulation.",
            border: false
          },
          {
            label: "Closing Balance",
            value: `$${summary.final_balance}`,
            color: parseFloat(summary.final_balance) >= parseFloat(summary.initial_balance) ? "text-green-400" : "text-red-400",
            shadow: parseFloat(summary.final_balance) >= parseFloat(summary.initial_balance) ? "drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" : "drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]",
            tooltip: "The final balance after all trades.",
            border: true
          },
          {
            label: "Net Profit",
            value: `${parseFloat(summary.total_profit) >= 0 ? '+' : '-'}$${Math.abs(parseFloat(summary.total_profit)).toFixed(2)}`,
            color: parseFloat(summary.total_profit) >= 0 ? "text-engine-neon" : "text-red-400",
            shadow: parseFloat(summary.total_profit) >= 0 ? "drop-shadow-[0_0_5px_rgba(var(--engine-neon-rgb),0.5)]" : "drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]",
            tooltip: "Total profit or loss over the simulation period.",
            border: true
          },
          {
            label: "ROI Growth",
            value: summary.total_roi,
            color: parseFloat(summary.total_roi) >= 0 ? "text-purple-400" : "text-red-400",
            shadow: parseFloat(summary.total_roi) >= 0 ? "drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]" : "drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]",
            tooltip: "Return on Investment as a percentage.",
            border: true
          },
          {
            label: "Max Drawdown",
            value: `-${summary.max_drawdown || "0.00%"}`,
            color: "text-red-400",
            shadow: "drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]",
            tooltip: "The maximum observed loss from a peak to a trough.",
            border: true
          },
          {
            label: "Profit Factor",
            value: summary.profit_factor,
            color: parseFloat(summary.profit_factor) >= 1.5 ? "text-green-400" : (parseFloat(summary.profit_factor) >= 1 ? "text-yellow-400" : "text-red-400"),
            shadow: parseFloat(summary.profit_factor) >= 1.5 ? "drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" : (parseFloat(summary.profit_factor) >= 1 ? "drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" : "drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]"),
            tooltip: "Gross Profit divided by Gross Loss. >1.5 is excellent.",
            border: true
          },
          {
            label: "Expectancy",
            value: `${parseFloat(summary.expectancy) >= 0 ? '' : '-'}$${Math.abs(parseFloat(summary.expectancy)).toFixed(2)}`,
            color: parseFloat(summary.expectancy) >= 0 ? "text-engine-neon" : "text-red-400",
            shadow: parseFloat(summary.expectancy) >= 0 ? "drop-shadow-[0_0_5px_rgba(var(--engine-neon-rgb),0.5)]" : "drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]",
            tooltip: "Average amount won or lost per trade.",
            border: true
          },
          {
            label: "Risk of Ruin",
            value: summary.risk_of_ruin,
            color: parseFloat(summary.risk_of_ruin) < 1 ? "text-green-400" : "text-red-500",
            shadow: parseFloat(summary.risk_of_ruin) < 1 ? "drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" : "drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]",
            tooltip: "Probability of depleting your account balance.",
            border: true
          }
        ].map((card, idx) => (
          <div key={idx} className={`relative p-3 rounded-xl transition-all duration-300 hover:bg-engine-button/10 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.15)] cursor-help group flex flex-col justify-center ${card.border ? 'md:border-l border-engine-neon/10' : ''}`}>
            <p className="text-[9px] font-extrabold text-engine-neon/70 uppercase tracking-widest mb-1 group-hover:text-engine-neon transition-colors">
              {card.label}
            </p>
            <p className={`text-xl font-mono font-bold ${card.color} ${card.shadow} transition-all duration-300 group-hover:scale-105 origin-left`}>
              {card.value}
            </p>
            {/* Tooltip */}
            <div className="absolute top-[110%] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-max max-w-[200px] bg-engine-bg border border-engine-neon/30 text-white text-[10px] p-2 rounded-lg shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.3)] text-center font-medium">
              {card.tooltip}
            </div>
          </div>
        ))}
      </div>

      {/* Monte Carlo & Warnings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monte Carlo Simulation */}
        {monte_carlo && (
          <div className="bg-engine-panel/60 p-8 rounded-2xl border border-engine-neon/20 shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.05)] backdrop-blur-md flex flex-col">
            <h3 className="text-sm font-extrabold mb-5 text-engine-neon uppercase tracking-widest flex items-center gap-2">
              Monte Carlo Simulation{" "}
              <span className="text-[10px] text-gray-500 normal-case font-mono">
                (500 Iterations)
              </span>
            </h3>
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-4 flex flex-col justify-center">
                <div className="flex justify-between items-center p-4 bg-engine-bg/50 rounded-xl border border-red-500/20 hover:border-red-500/50 hover:bg-red-900/10 transition-all cursor-default">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-400/70">
                    Worst Case <span className="text-[9px] lowercase opacity-70">(bottom 5%)</span>
                  </span>
                  <span className="font-mono font-bold text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">
                    ${monte_carlo.worst_case}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-engine-bg/50 rounded-xl border border-engine-neon/20 hover:border-engine-neon/50 hover:bg-engine-button/10 transition-all cursor-default">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-engine-neon/70">
                    Median <span className="text-[9px] lowercase opacity-70">(most likely)</span>
                  </span>
                  <span className="font-mono font-bold text-engine-neon drop-shadow-[0_0_5px_rgba(var(--engine-neon-rgb),0.5)]">
                    ${monte_carlo.median}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-engine-bg/50 rounded-xl border border-green-500/20 hover:border-green-500/50 hover:bg-green-900/10 transition-all cursor-default">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-green-400/70">
                    Best Case <span className="text-[9px] lowercase opacity-70">(top 5%)</span>
                  </span>
                  <span className="font-mono font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                    ${monte_carlo.best_case}
                  </span>
                </div>
              </div>
              <div className="h-full min-h-[200px] flex items-center bg-engine-bg/50 p-4 rounded-xl border border-engine-neon/10">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mcChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "monospace", fontWeight: "bold" }} />
                    <YAxis tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`} axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "#0a0f1c", borderColor: "#00cfff", color: "#fff", borderRadius: "12px", fontFamily: "monospace", boxShadow: "0 0 20px rgba(var(--engine-neon-rgb),0.2)" }} formatter={(val) => [`$${val}`, 'Value']} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={35}>
                      {mcChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: `drop-shadow(0 0 8px ${entry.shadow})` }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-[10px] text-engine-neon/50 mt-5 font-mono italic text-center border-t border-engine-neon/10 pt-4">
              *This simulation randomizes the win/loss sequence to visualize the probability distribution of potential outcomes.
            </p>
          </div>
        )}

        {/* Risk Analysis / Warnings */}
        <div className="bg-engine-panel/60 p-8 rounded-2xl border border-engine-neon/20 shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.05)] backdrop-blur-md flex flex-col">
          <h3 className="text-sm font-extrabold mb-5 text-engine-neon uppercase tracking-widest flex items-center gap-2">
            Risk Analysis
            <span className="relative flex h-2 w-2 ml-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${warnings.length > 0 ? 'bg-red-400' : 'bg-green-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${warnings.length > 0 ? 'bg-red-500' : 'bg-green-500'}`}></span>
            </span>
          </h3>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {warnings.length > 0 ? (
              warnings.map((w, idx) => (
                <div
                  key={idx}
                  className={`relative p-5 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] bg-engine-bg/80 ${
                    w.type === "danger"
                      ? "border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] group"
                      : "border border-yellow-500/50 shadow-[0_0_20px_rgba(250,204,21,0.15)] group"
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${w.type === "danger" ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-yellow-500 shadow-[0_0_10px_#eab308]"}`}></div>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl border ${w.type === "danger" ? "bg-red-900/30 text-red-400 border-red-500/30 group-hover:bg-red-500 group-hover:text-white" : "bg-yellow-900/30 text-yellow-400 border-yellow-500/30 group-hover:bg-yellow-500 group-hover:text-black"} transition-colors duration-300`}>
                      <span className="flex items-center justify-center drop-shadow-[0_0_5px_currentColor]">
                        {w.type === "danger" ? <Skull className="w-6 h-6" /> : <TriangleAlert className="w-6 h-6" />}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${w.type === "danger" ? "text-red-400" : "text-yellow-400"}`}>
                        {w.type === "danger" ? "Critical Risk Detected" : "Warning"}
                      </h4>
                      <p className="text-xs font-medium text-gray-300 tracking-wide leading-relaxed">{w.msg}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="relative p-6 rounded-xl overflow-hidden bg-engine-bg/80 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all duration-300">
                <div className="absolute inset-0 bg-green-500/5 backdrop-blur-sm"></div>
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                <div className="relative flex items-center gap-5">
                  <div className="p-4 rounded-full bg-green-900/30 text-green-400 border border-green-500/30">
                    <CheckCircle className="w-8 h-8 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-green-400 uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">Strategy is Healthy</h4>
                    <p className="text-sm font-medium text-gray-400 tracking-wide">
                      No critical risks detected. Your parameters fall within safe and realistic bounds.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap justify-between items-center bg-engine-panel/60 p-3 rounded-2xl border border-engine-neon/20 shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.05)] backdrop-blur-md">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${
                filter === f.id
                  ? "bg-engine-button text-engine-bg shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.4)]"
                  : "bg-engine-bg border border-engine-neon/20 text-engine-neon/50 hover:bg-engine-button/10 hover:text-engine-neon hover:border-engine-neon/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={downloadCSV}
          className="px-5 py-2 mt-2 sm:mt-0 bg-engine-bg border border-engine-neon/30 hover:bg-engine-button/10 hover:border-engine-neon hover:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)] text-engine-neon text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Custom Canvas Chart — remounts on every new simulation run */}
      <SimulationChart key={runKey} data={aggregatedData} />

      {/* PnL Chart */}
      <div className="bg-engine-panel/60 p-6 rounded-2xl border border-engine-neon/20 shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.05)] backdrop-blur-md h-[400px]">
        <h3 className="text-sm font-extrabold mb-4 text-engine-neon uppercase tracking-widest">
          Daily Profit / Loss
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aggregatedData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--engine-neon)"
              strokeOpacity={0.1}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="var(--engine-neon)"
              strokeOpacity={0.5}
              tick={{ fill: "rgba(0, 207, 255, 0.5)", fontSize: 12, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              stroke="var(--engine-neon)"
              strokeOpacity={0.5}
              tick={{ fill: "rgba(0, 207, 255, 0.5)", fontSize: 12, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(3, 3, 8, 0.9)",
                borderColor: "rgba(0, 207, 255, 0.3)",
                color: "#fff",
                borderRadius: "12px",
                boxShadow: "0 0 15px rgba(0, 207, 255, 0.15)",
                fontFamily: 'monospace'
              }}
              cursor={{ fill: "rgba(0, 207, 255, 0.05)" }}
              formatter={(value) => [`$${value}`, "PnL"]}
              labelFormatter={(label) => `Day ${label}`}
            />
            <ReferenceLine y={0} stroke="rgba(0, 207, 255, 0.3)" />
            <Bar dataKey="profit_loss" name="Profit/Loss" radius={[4, 4, 0, 0]}>
              {aggregatedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={parseFloat(entry.profit_loss) >= 0 ? "#4ade80" : "#f87171"}
                  style={{ filter: `drop-shadow(0 0 5px ${parseFloat(entry.profit_loss) >= 0 ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.5)"})` }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Drawdown Chart */}
      {(() => {
        let peak = -Infinity;
        const ddData = aggregatedData.map(d => {
          const bal = parseFloat(d.end_balance);
          if (bal > peak) peak = bal;
          const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
          return { day: d.day, drawdown: parseFloat(dd.toFixed(2)) };
        });
        return (
          <div className="bg-engine-panel/60 p-6 rounded-2xl border border-engine-neon/20 shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.05)] backdrop-blur-md h-[300px]">
            <h3 className="text-sm font-extrabold mb-4 text-red-400 uppercase tracking-widest drop-shadow-[0_0_3px_rgba(248,113,113,0.4)]">
              Drawdown %
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ddData}>
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef5350" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef5350" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ef5350" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="day" stroke="#ef5350" strokeOpacity={0.4} tick={{ fill: "rgba(248,113,113,0.5)", fontSize: 11, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => `-${v}%`} stroke="#ef5350" strokeOpacity={0.4} tick={{ fill: "rgba(248,113,113,0.5)", fontSize: 11, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(3,3,8,0.9)", borderColor: "rgba(239,83,80,0.4)", color: "#fff", borderRadius: "12px", fontFamily: 'monospace' }}
                  formatter={v => [`-${v}%`, "Drawdown"]}
                  labelFormatter={l => `Day ${l}`}
                />
                <Area type="monotone" dataKey="drawdown" stroke="#ef5350" strokeWidth={2} fillOpacity={1} fill="url(#ddGrad)" style={{ filter: "drop-shadow(0 0 6px rgba(239,83,80,0.4))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* Table Section */}
      <div className="bg-engine-panel/60 rounded-2xl border border-engine-neon/20 shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.05)] backdrop-blur-md overflow-hidden">
        {/* Table Tabs */}
        <div className="flex border-b border-engine-neon/20">
          <button
            onClick={() => setViewMode("daily")}
            className={`flex-1 sm:flex-none px-6 py-4 text-xs font-extrabold uppercase tracking-widest transition-all ${
              viewMode === "daily"
                ? "bg-engine-button/10 text-engine-neon border-b-2 border-engine-neon"
                : "text-engine-neon/50 hover:bg-engine-button/5 hover:text-engine-neon"
            }`}
          >
            Daily Breakdown
          </button>
          <button
            onClick={() => setViewMode("journal")}
            className={`flex-1 sm:flex-none px-6 py-4 text-xs font-extrabold uppercase tracking-widest transition-all ${
              viewMode === "journal"
                ? "bg-engine-button/10 text-engine-neon border-b-2 border-engine-neon"
                : "text-engine-neon/50 hover:bg-engine-button/5 hover:text-engine-neon"
            }`}
          >
            Trade Journal (Log)
          </button>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
          {viewMode === "daily" ? (
            <table className="min-w-full divide-y divide-[#00cfff]/10">
              <thead className="bg-engine-bg/80 backdrop-blur-md sticky top-0 z-10 border-b border-engine-neon/20">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest">
                    Day
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest">
                    Start Balance
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest">
                    P/L
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest">
                    End Balance
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[#00cfff]/5">
                {aggregatedData.map((row) => (
                  <tr key={row.day} className="hover:bg-engine-button/5 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">
                      {row.day}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400 font-mono">
                      ${row.start_balance}
                    </td>
                    <td
                      className={`px-6 py-3 whitespace-nowrap text-sm font-mono font-medium ${
                        parseFloat(row.profit_loss) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {parseFloat(row.profit_loss) >= 0 ? "+" : ""}
                      {row.profit_loss}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-white font-mono">
                      ${row.end_balance}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-engine-neon font-mono">
                      {row.roi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-[#00cfff]/10">
              <thead className="bg-engine-bg/80 backdrop-blur-md sticky top-0 z-10 border-b border-engine-neon/20">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest">
                    Day
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest">
                    Result
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest">
                    P/L ($)
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[#00cfff]/5">
                {trade_log &&
                  trade_log.map((trade) => (
                    <tr key={trade.trade_no} className="hover:bg-engine-button/5 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-engine-neon/50 font-mono">
                        #{trade.trade_no}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400 font-mono">
                        Day {trade.day}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest ${
                            trade.result === "WIN"
                              ? "bg-green-900/20 text-green-400 border border-green-500/30"
                              : "bg-red-900/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {trade.result}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-3 whitespace-nowrap text-sm font-mono font-bold ${
                          parseFloat(trade.pnl) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {parseFloat(trade.pnl) >= 0 ? "+" : ""}
                        {trade.pnl}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-white font-mono">
                        ${trade.balance}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
