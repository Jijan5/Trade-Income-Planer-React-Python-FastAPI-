import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ResultsDashboard = ({ data }) => {
  if (!data) return null;

  const { summary, daily_breakdown } = data;

  const [filter, setFilter] = useState("daily");

  const filters = [
    { id: "daily", label: "Harian", days: 1 },
    { id: "weekly", label: "Mingguan (5 Hari)", days: 5 },
    { id: "monthly", label: "Bulanan (20 Hari)", days: 20 },
    { id: "3months", label: "3 Bulan", days: 60 },
    { id: "6months", label: "6 Bulan", days: 120 },
    { id: "9months", label: "9 Bulan", days: 180 },
    { id: "yearly", label: "Tahunan", days: 240 },
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

    const headers = ["Day", "Start Balance", "Profit/Loss", "End Balance", "ROI"];
    const csvContent = [
      headers.join(","),
      ...daily_breakdown.map((row) =>
        [row.day, row.start_balance, row.profit_loss, row.end_balance, row.roi].join(",")
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Modal Awal
          </p>
          <p className="text-xl font-mono font-bold text-white">
            ${summary.initial_balance}
          </p>
        </div>
        <div className="p-3 border-l border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Saldo Akhir
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Chart */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-[400px]">
        <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
          Proyeksi Pertumbuhan Ekuitas
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

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
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
                <tr key={row.day} className="hover:bg-gray-50">
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
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
