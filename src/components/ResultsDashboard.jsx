import React from "react";
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
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
      </div>

      {/* Chart */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-[400px]">
        <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
          Proyeksi Pertumbuhan Ekuitas
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={daily_breakdown}>
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
              {daily_breakdown.map((row) => (
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
