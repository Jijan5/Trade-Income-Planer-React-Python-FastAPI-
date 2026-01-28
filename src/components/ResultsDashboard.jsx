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
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${ruinProb > 20 ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            🔮 What-If Future Projection
          </h3>
          
          <div className={`p-5 rounded-lg border ${ruinProb > 20 ? 'bg-red-900/20 border-red-500/30' : 'bg-blue-900/20 border-blue-500/30'}`}>
            <p className="text-xl font-medium text-gray-200 leading-relaxed">
              "With your current strategy, there is a <span className={`font-bold text-2xl ${ruinProb > 0 ? 'text-red-400' : 'text-green-400'}`}>{ruinProb}% probability</span> that your account will be <span className="text-white font-bold underline decoration-red-500">DEPLETED</span> within <span className="text-white font-bold">{summary.day_simulated} days</span>."
              {ruinProb > 0 && (
                <>
                 Based on your strategy and a ruin probability of {ruinProb}%, depletion is projected to occur within 
                <span className="text-white font-bold">
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
              <p className="mt-3 text-sm text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="text-xl">💀</span> Critical Warning: This is gambling, not trading.
              </p>
            )}
            <p className="text-xs text-gray-500 mt-4 italic">
              *Based on {monte_carlo.iterations} Monte Carlo simulations of your specific parameters.
            </p>
          </div>
        </div>
      )}
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Inital Capital
          </p>
          <p className="text-xl font-mono font-bold text-white">
            ${summary.initial_balance}
          </p>
        </div>
        <div className="p-3 border-l border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Closing Balance
          </p>
          <p className="text-xl font-mono font-bold text-green-400">
            ${summary.final_balance}
          </p>
        </div>
        <div className="p-3 border-l border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Net Profit
          </p>
          <p className="text-xl font-mono font-bold text-blue-400">
            +${summary.total_profit}
          </p>
        </div>
        <div className="p-3 border-l border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            ROI Growth
          </p>
          <p className="text-xl font-mono font-bold text-purple-400">
            {summary.total_roi}
          </p>
        </div>
        <div className="p-3 border-l border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Max Drawdown
          </p>
          <p className="text-xl font-mono font-bold text-red-400">
            -{summary.max_drawdown || "0.00%"}
          </p>
        </div>
        <div className="p-3 border-l border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Profit Factor
          </p>
          <p
            className={`text-xl font-mono font-bold ${
              parseFloat(summary.profit_factor) >= 1.5
                ? "text-green-400"
                : "text-yellow-400"
            }`}
          >
            {summary.profit_factor}
          </p>
        </div>
        <div className="p-3 border-l border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Expectancy
          </p>
          <p className="text-xl font-mono font-bold text-blue-300">
            ${summary.expectancy}
          </p>
        </div>
        <div className="p-3 border-l border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Risk of Ruin
          </p>
          <p
            className={`text-xl font-mono font-bold ${
              parseFloat(summary.risk_of_ruin) < 1
                ? "text-green-400"
                : "text-red-500"
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
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider flex items-center gap-2">
              Monte Carlo Simulation{" "}
              <span className="text-xs text-gray-500 normal-case">
                (500 Iterations)
              </span>
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded border border-gray-700/50">
                <span className="text-sm text-gray-400">
                  Worst Case (Bottom 5%)
                </span>
                <span className="font-mono font-bold text-red-400">
                  ${monte_carlo.worst_case}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded border border-gray-700/50">
                <span className="text-sm text-gray-400">
                  Median (Most Likely)
                </span>
                <span className="font-mono font-bold text-blue-400">
                  ${monte_carlo.median}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded border border-gray-700/50">
                <span className="text-sm text-gray-400">
                  Best Case (Top 5%)
                </span>
                <span className="font-mono font-bold text-green-400">
                  ${monte_carlo.best_case}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
              *This simulation randomizes the win/loss sequence to see the possible variations in your fate.
              </p>
            </div>
          </div>
        )}

        {/* Risk Analysis / Warnings */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
            Risk Analysis
          </h3>
          <div className="space-y-3">
            {warnings.length > 0 ? (
              warnings.map((w, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded border flex items-start gap-3 ${
                    w.type === "danger"
                      ? "bg-red-900/20 border-red-500/30 text-red-200"
                      : "bg-yellow-900/20 border-yellow-500/30 text-yellow-200"
                  }`}
                >
                  <span className="text-lg">
                    {w.type === "danger" ? "VX" : "⚠"}
                  </span>
                  <span className="text-sm font-medium">{w.msg}</span>
                </div>
              ))
            ) : (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded text-green-200 flex items-center gap-3">
                <span className="text-lg">✓</span>
                <span className="text-sm font-medium">
                  Strategy looks healthy! No critical risks detected.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap justify-between items-center bg-gray-800 p-2 rounded-lg border border-gray-700">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={downloadCSV}
          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2"
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
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-[400px]">
        <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
          Equity Growth Projections
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={aggregatedData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(value) => `$${value}`}
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                borderColor: "#374151",
                color: "#f3f4f6",
              }}
              itemStyle={{ color: "#60a5fa" }}
              formatter={(value) => [`$${value}`, "Equity"]}
              labelFormatter={(label) => `Day ${label}`}
            />
            <Area
              type="monotone"
              dataKey="end_balance"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorBalance)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* PnL Chart */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-[400px]">
        <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
          Daily Profit / Loss
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aggregatedData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                borderColor: "#374151",
                color: "#f3f4f6",
              }}
              cursor={{ fill: "#374151", opacity: 0.4 }}
              formatter={(value) => [`$${value}`, "PnL"]}
              labelFormatter={(label) => `Day ${label}`}
            />
            <ReferenceLine y={0} stroke="#4b5563" />
            <Bar dataKey="profit_loss" name="Profit/Loss">
              {aggregatedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={parseFloat(entry.profit_loss) >= 0 ? "#4ade80" : "#f87171"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table Section */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {/* Table Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setViewMode("daily")}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
              viewMode === "daily"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:bg-gray-700/50"
            }`}
          >
            Daily Breakdown
          </button>
          <button
            onClick={() => setViewMode("journal")}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
              viewMode === "journal"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:bg-gray-700/50"
            }`}
          >
            Trade Journal (Log)
          </button>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          {viewMode === "daily" ? (
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Start Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    P/L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    End Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {aggregatedData.map((row) => (
                  <tr key={row.day} className="hover:bg-gray-700/30">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
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
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-200 font-mono">
                      ${row.end_balance}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                      {row.roi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    P/L ($)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {trade_log &&
                  trade_log.map((trade) => (
                    <tr key={trade.trade_no} className="hover:bg-gray-700/30">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        #{trade.trade_no}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                        Day {trade.day}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            trade.result === "WIN"
                              ? "bg-green-900/50 text-green-400"
                              : "bg-red-900/50 text-red-400"
                          }`}
                        >
                          {trade.result}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-3 whitespace-nowrap text-sm font-mono font-medium ${
                          parseFloat(trade.pnl) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {parseFloat(trade.pnl) >= 0 ? "+" : ""}
                        {trade.pnl}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">
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
