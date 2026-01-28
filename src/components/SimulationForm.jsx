import React, { useState } from "react";

const SimulationForm = ({ onSimulate, isLoading }) => {
  const [formData, setFormData] = useState({
    initial_balance: 10000,
    capital_utilization: 30,
    risk_per_trade: 1,
    risk_reward_ratio: 2,
    win_rate: 50,
    trades_per_day: 3,
    simulation_days: 30,
    fees_per_trade: 0,
    risk_type: "dynamic",
  });

  const [activeTooltip, setActiveTooltip] = useState(null);

  // Preset Strategi Umum
  const STRATEGY_PRESETS = [
    {
      name: "Scalper (Aggressive)",
      data: { initial_balance: 2000, capital_utilization: 100, risk_per_trade: 1, risk_reward_ratio: 1.5, win_rate: 60, trades_per_day: 10, simulation_days: 30, fees_per_trade: 0.5, risk_type: "dynamic" }
    },
    {
      name: "Day Trader (Balanced)",
      data: { initial_balance: 10000, capital_utilization: 50, risk_per_trade: 1, risk_reward_ratio: 2, win_rate: 50, trades_per_day: 3, simulation_days: 30, fees_per_trade: 2, risk_type: "dynamic" }
    },
    {
      name: "Swing Trader (Relaxed)",
      data: { initial_balance: 5000, capital_utilization: 30, risk_per_trade: 2, risk_reward_ratio: 3, win_rate: 40, trades_per_day: 1, simulation_days: 90, fees_per_trade: 5, risk_type: "fixed" }
    },
    {
      name: "Gambler (High Risk)",
      data: { initial_balance: 1000, capital_utilization: 100, risk_per_trade: 10, risk_reward_ratio: 1, win_rate: 40, trades_per_day: 5, simulation_days: 30, fees_per_trade: 0, risk_type: "fixed" }
    }
  ];

  const breakEvenWinRate = (1 / (1 + formData.risk_reward_ratio) * 100).toFixed(1);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Hanya parse ke float jika tipe inputnya number
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSimulate(formData);
  };

  const loadPreset = (presetData) => {
    setFormData({ ...formData, ...presetData });
  };

  const renderInfoIcon = (title, content) => (
    <button
      type="button"
      onClick={() => setActiveTooltip({ title, content })}
      className="ml-auto text-gray-500 hover:text-blue-400 transition-colors focus:outline-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    </button>
  );

  return (
    <>
      {/* Tooltip Modal */}
      {activeTooltip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setActiveTooltip(null)}
        >
          <div
            className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveTooltip(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-blue-500">ℹ</span>
              {activeTooltip.title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {activeTooltip.content}
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-700 pb-4 gap-4">
          <h2 className="text-lg font-semibold text-gray-100 uppercase tracking-wider">
            Configuration
          </h2>
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {STRATEGY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => loadPreset(preset.data)}
                className="px-3 py-1 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-blue-300 rounded border border-gray-600 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Risk Type Selection */}
          <div className="relative md:col-span-2 lg:col-span-4 mb-2">
            <div className="flex items-center mb-2">
              <label className="block text-xs font-medium text-gray-400">
                RISK MANAGEMENT TYPE
              </label>
              {renderInfoIcon(
                "Risk Type",
                "Dynamic: Adjusts size based on current balance (Harder to blow up). Fixed: Constant size based on initial capital (Higher risk of ruin)."
              )}
            </div>
            <div className="flex bg-gray-900 p-1 rounded border border-gray-600 w-fit">
              {["dynamic", "fixed"].map((type) => (
                <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, risk_type: type })}
                className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                  formData.risk_type === type
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {type}
              </button>
              ))}
            </div>
          </div>
          {/* Modal Awal */}
          <div className="relative">
            <div className="flex items-center mb-1">
              <label className="block text-xs font-medium text-gray-400">
                INITIAL CAPITAL ($)
              </label>
              {renderInfoIcon(
                "Initial Capital",
                "The total amount of cash you have available to start trading."
              )}
            </div>
            <input
              type="number"
              name="initial_balance"
              value={formData.initial_balance}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          {/* Penggunaan Modal */}
          <div className="relative">
            <div className="flex items-center mb-1">
              <label className="block text-xs font-medium text-gray-400">
                CAPITAL UTILIZATION (%)
              </label>
              {renderInfoIcon(
                "Capital Utilization",
                "Percentage of initial capital actually used for trading (the rest is cash reserves)."
              )}
            </div>
            <input
              type="number"
              name="capital_utilization"
              value={formData.capital_utilization}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          {/* Resiko Per Trade */}
          <div className="relative">
            <div className="flex items-center mb-1">
              <label className="block text-xs font-medium text-gray-400">
                RISK / TRADE (%)
              </label>
              {renderInfoIcon(
                "Risk Per Trade",
                "Percentage of capital that is ready to be lost (Stop Loss) per trade."
              )}
            </div>
            <input
              type="number"
              name="risk_per_trade"
              value={formData.risk_per_trade}
              onChange={handleChange}
              step="0.1"
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            {formData.risk_per_trade > 2 && (
              <div className="mt-1 text-xs text-yellow-400 flex items-center gap-1">
                <span>⚠</span>
                <span>High risk. Professionals rarely risk > 2%.</span>
              </div>
            )}
          </div>

          {/* Risk Reward */}
          <div className="relative">
            <div className="flex items-center mb-1">
              <label className="block text-xs font-medium text-gray-400">
                RISK : REWARD
              </label>
              {renderInfoIcon(
                "Risk : Reward Ratio",
                "Comparison of profit targets to risk. Example 2.0 means a profit target of 2x the risk."
              )}
            </div>
            <input
              type="number"
              name="risk_reward_ratio"
              value={formData.risk_reward_ratio}
              onChange={handleChange}
              step="0.1"
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Win Rate */}
          <div className="relative">
            <div className="flex items-center mb-1">
              <label className="block text-xs font-medium text-gray-400">
                WIN RATE (%)
              </label>
              {renderInfoIcon(
                "Win Rate",
                "The probability percentage of your strategy's success (Example: 50% means half wins, half losses)."
              )}
            </div>
            <input
              type="number"
              name="win_rate"
              value={formData.win_rate}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            {/* Break Even Indicator */}
            <div className="mt-1 text-[10px] flex justify-between">
              <span className="text-gray-500">Min to not lose:</span>
              <span className={`font-bold ${formData.win_rate < breakEvenWinRate ? 'text-red-500' : 'text-green-500'}`}>
                {breakEvenWinRate}%
              </span>
            </div>
          </div>

          {/* Trades Per Day */}
          <div className="relative">
            <div className="flex items-center mb-1">
              <label className="block text-xs font-medium text-gray-400">
                TRADES / DAY
              </label>
              {renderInfoIcon(
                "Trades Per Day",
                "The average number of trading positions taken each day."
              )}
            </div>
            <input
              type="number"
              name="trades_per_day"
              value={formData.trades_per_day}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Fees Per Trade */}
          <div className="relative">
            <div className="flex items-center mb-1">
              <label className="block text-xs font-medium text-gray-400">
                FEES / TRADE ($)
              </label>
              {renderInfoIcon(
                "Fees Per Trade",
                "Commission, spread, or swap fees per transaction (in US dollars)."
              )}
            </div>
            <input
              type="number"
              name="fees_per_trade"
              value={formData.fees_per_trade}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Simulation Days */}
          <div className="relative">
            <div className="flex items-center mb-1">
              <label className="block text-xs font-medium text-gray-400">
                DURATION (DAYS)
              </label>
              {renderInfoIcon(
                "Duration",
                "The duration of the simulation (in days)."
              )}
            </div>
            <input
              type="number"
              name="simulation_days"
              value={formData.simulation_days}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded font-bold uppercase tracking-wider transition duration-200 disabled:bg-gray-700 disabled:text-gray-500 h-[42px]"
            >
              {isLoading ? "CALCULATING..." : "RUN SIMULATION"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default SimulationForm;
