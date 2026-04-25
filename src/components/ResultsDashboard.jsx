import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ResultsDashboard = ({ data }) => {
  if (!data) return null;

  const { summary, daily_breakdown, monte_carlo, trade_log } = data;

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

  return (
    <div className="space-y-6">
      {/* What-If Simulator (Brutally Honest Projection) */}
      {monte_carlo && (
        <div className="bg-[#0a0f1c]/60 p-8 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${ruinProb > 20 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`}></div>
          <h3 className="text-xl font-extrabold text-white mb-4 flex items-center gap-3">
            <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🔮</span> What-If Future Projection
          </h3>
          
          <div className={`p-6 rounded-xl border ${ruinProb > 20 ? 'bg-red-900/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-[#00cfff]/5 border-[#00cfff]/30 shadow-[0_0_15px_rgba(0,207,255,0.1)]'}`}>
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
                <span className="text-2xl">💀</span> Critical Warning: This is gambling, not trading.
              </p>
            )}
            <p className="text-xs text-gray-500 mt-5 italic font-mono">
              *Based on {monte_carlo.iterations} Monte Carlo simulations of your specific parameters.
            </p>
          </div>
        </div>
      )}
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 bg-[#0a0f1c]/60 p-6 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md">
        <div className="p-3">
          <p className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-1">
            Inital Capital
          </p>
          <p className="text-xl font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
            ${summary.initial_balance}
          </p>
        </div>
        <div className="p-3 border-l border-[#00cfff]/10">
          <p className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-1">
            Closing Balance
          </p>
          <p className="text-xl font-mono font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
            ${summary.final_balance}
          </p>
        </div>
        <div className="p-3 border-l border-[#00cfff]/10">
          <p className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-1">
            Net Profit
          </p>
          <p className="text-xl font-mono font-bold text-[#00cfff] drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]">
            +${summary.total_profit}
          </p>
        </div>
        <div className="p-3 border-l border-[#00cfff]/10">
          <p className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-1">
            ROI Growth
          </p>
          <p className="text-xl font-mono font-bold text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]">
            {summary.total_roi}
          </p>
        </div>
        <div className="p-3 border-l border-[#00cfff]/10">
          <p className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-1">
            Max Drawdown
          </p>
          <p className="text-xl font-mono font-bold text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">
            -{summary.max_drawdown || "0.00%"}
          </p>
        </div>
        <div className="p-3 border-l border-[#00cfff]/10">
          <p className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-1">
            Profit Factor
          </p>
          <p
            className={`text-xl font-mono font-bold ${
              parseFloat(summary.profit_factor) >= 1.5
                ? "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]"
                : "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]"
            }`}
          >
            {summary.profit_factor}
          </p>
        </div>
        <div className="p-3 border-l border-[#00cfff]/10">
          <p className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-1">
            Expectancy
          </p>
          <p className="text-xl font-mono font-bold text-[#00cfff] drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]">
            ${summary.expectancy}
          </p>
        </div>
        <div className="p-3 border-l border-[#00cfff]/10">
          <p className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-1">
            Risk of Ruin
          </p>
          <p
            className={`text-xl font-mono font-bold ${
              parseFloat(summary.risk_of_ruin) < 1
                ? "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]"
                : "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]"
            }`}
          >
            {summary.risk_of_ruin}
          </p>
        </div>
      </div>

      {/* Monte Carlo & Warnings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monte Carlo Simulation */}
        {monte_carlo && (
          <div className="bg-[#0a0f1c]/60 p-8 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md">
            <h3 className="text-sm font-extrabold mb-5 text-[#00cfff] uppercase tracking-widest flex items-center gap-2">
              Monte Carlo Simulation{" "}
              <span className="text-[10px] text-gray-500 normal-case font-mono">
                (500 Iterations)
              </span>
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-[#030308]/50 rounded-xl border border-[#00cfff]/10">
                <span className="text-sm font-medium text-gray-400">
                  Worst Case (Bottom 5%)
                </span>
                <span className="font-mono font-bold text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">
                  ${monte_carlo.worst_case}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-[#030308]/50 rounded-xl border border-[#00cfff]/10">
                <span className="text-sm font-medium text-gray-400">
                  Median (Most Likely)
                </span>
                <span className="font-mono font-bold text-[#00cfff] drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]">
                  ${monte_carlo.median}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-[#030308]/50 rounded-xl border border-[#00cfff]/10">
                <span className="text-sm font-medium text-gray-400">
                  Best Case (Top 5%)
                </span>
                <span className="font-mono font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                  ${monte_carlo.best_case}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 font-mono italic">
              *This simulation randomizes the win/loss sequence to see the possible variations in your fate.
              </p>
            </div>
          </div>
        )}

        {/* Risk Analysis / Warnings */}
        <div className="bg-[#0a0f1c]/60 p-8 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md">
          <h3 className="text-sm font-extrabold mb-5 text-[#00cfff] uppercase tracking-widest">
            Risk Analysis
          </h3>
          <div className="space-y-3">
            {warnings.length > 0 ? (
              warnings.map((w, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    w.type === "danger"
                      ? "bg-red-900/10 border-red-500/30 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                      : "bg-yellow-900/10 border-yellow-500/30 text-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.1)]"
                  }`}
                >
                  <span className="text-lg drop-shadow-[0_0_5px_currentColor]">
                    {w.type === "danger" ? "VX" : "⚠"}
                  </span>
                  <span className="text-sm font-bold tracking-wide">{w.msg}</span>
                </div>
              ))
            ) : (
              <div className="p-5 bg-green-900/10 border border-green-500/30 rounded-xl text-green-400 flex items-center gap-3 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                <span className="text-xl drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">✓</span>
                <span className="text-sm font-bold tracking-wide">
                  Strategy looks healthy! No critical risks detected.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap justify-between items-center bg-[#0a0f1c]/60 p-3 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${
                filter === f.id
                  ? "bg-[#00cfff] text-[#030308] shadow-[0_0_15px_rgba(0,207,255,0.4)]"
                  : "bg-[#030308] border border-[#00cfff]/20 text-[#00cfff]/50 hover:bg-[#00cfff]/10 hover:text-[#00cfff] hover:border-[#00cfff]/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={downloadCSV}
          className="px-5 py-2 mt-2 sm:mt-0 bg-[#030308] border border-[#00cfff]/30 hover:bg-[#00cfff]/10 hover:border-[#00cfff] hover:shadow-[0_0_15px_rgba(0,207,255,0.2)] text-[#00cfff] text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
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

      {/* Chart */}
      <div className="bg-[#0a0f1c]/60 p-6 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md h-[400px]">
        <h3 className="text-sm font-extrabold mb-4 text-[#00cfff] uppercase tracking-widest">
          Equity Growth Projections
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={aggregatedData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00cfff" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#00cfff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#00cfff"
              strokeOpacity={0.1}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="#00cfff"
              strokeOpacity={0.5}
              tick={{ fill: "rgba(0, 207, 255, 0.5)", fontSize: 12, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(value) => `$${value}`}
              stroke="#00cfff"
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
              itemStyle={{ color: "#00cfff", fontWeight: 'bold' }}
              formatter={(value) => [`$${value}`, "Equity"]}
              labelFormatter={(label) => `Day ${label}`}
            />
            <Area
              type="monotone"
              dataKey="end_balance"
              stroke="#00cfff"
              fillOpacity={1}
              fill="url(#colorBalance)"
              strokeWidth={3}
              style={{ filter: "drop-shadow(0 0 8px rgba(0,207,255,0.4))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* PnL Chart */}
      <div className="bg-[#0a0f1c]/60 p-6 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md h-[400px]">
        <h3 className="text-sm font-extrabold mb-4 text-[#00cfff] uppercase tracking-widest">
          Daily Profit / Loss
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aggregatedData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#00cfff"
              strokeOpacity={0.1}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="#00cfff"
              strokeOpacity={0.5}
              tick={{ fill: "rgba(0, 207, 255, 0.5)", fontSize: 12, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              stroke="#00cfff"
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

      {/* Table Section */}
      <div className="bg-[#0a0f1c]/60 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md overflow-hidden">
        {/* Table Tabs */}
        <div className="flex border-b border-[#00cfff]/20">
          <button
            onClick={() => setViewMode("daily")}
            className={`flex-1 sm:flex-none px-6 py-4 text-xs font-extrabold uppercase tracking-widest transition-all ${
              viewMode === "daily"
                ? "bg-[#00cfff]/10 text-[#00cfff] border-b-2 border-[#00cfff]"
                : "text-[#00cfff]/50 hover:bg-[#00cfff]/5 hover:text-[#00cfff]"
            }`}
          >
            Daily Breakdown
          </button>
          <button
            onClick={() => setViewMode("journal")}
            className={`flex-1 sm:flex-none px-6 py-4 text-xs font-extrabold uppercase tracking-widest transition-all ${
              viewMode === "journal"
                ? "bg-[#00cfff]/10 text-[#00cfff] border-b-2 border-[#00cfff]"
                : "text-[#00cfff]/50 hover:bg-[#00cfff]/5 hover:text-[#00cfff]"
            }`}
          >
            Trade Journal (Log)
          </button>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
          {viewMode === "daily" ? (
            <table className="min-w-full divide-y divide-[#00cfff]/10">
              <thead className="bg-[#030308]/80 backdrop-blur-md sticky top-0 z-10 border-b border-[#00cfff]/20">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">
                    Day
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">
                    Start Balance
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">
                    P/L
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">
                    End Balance
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[#00cfff]/5">
                {aggregatedData.map((row) => (
                  <tr key={row.day} className="hover:bg-[#00cfff]/5 transition-colors">
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
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-[#00cfff] font-mono">
                      {row.roi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-[#00cfff]/10">
              <thead className="bg-[#030308]/80 backdrop-blur-md sticky top-0 z-10 border-b border-[#00cfff]/20">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">
                    Day
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">
                    Result
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">
                    P/L ($)
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[#00cfff]/5">
                {trade_log &&
                  trade_log.map((trade) => (
                    <tr key={trade.trade_no} className="hover:bg-[#00cfff]/5 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-[#00cfff]/50 font-mono">
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
