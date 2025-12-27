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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSimulate(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg"
    >
      <h2 className="text-lg font-semibold mb-6 text-gray-100 uppercase tracking-wider border-b border-gray-700 pb-2">
        Configuration
      </h2>
      <div className="space-y-4">
        {/* Modal Awal */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            INITIAL CAPITAL ($)
          </label>
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
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            CAPITAL UTILIZATION (%)
          </label>
          <input
            type="number"
            name="capital_utilization"
            value={formData.capital_utilization}
            onChange={handleChange}
            className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Resiko Per Trade */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              RISK / TRADE (%)
            </label>
            <input
              type="number"
              name="risk_per_trade"
              value={formData.risk_per_trade}
              onChange={handleChange}
              step="0.1"
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Risk Reward */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              RISK : REWARD
            </label>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Win Rate */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              WIN RATE (%)
            </label>
            <input
              type="number"
              name="win_rate"
              value={formData.win_rate}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Trades Per Day */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              TRADES / DAY
            </label>
            <input
              type="number"
              name="trades_per_day"
              value={formData.trades_per_day}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
        </div>

        {/* Simulation Days */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            DURATION (DAYS)
          </label>
          <input
            type="number"
            name="simulation_days"
            value={formData.simulation_days}
            onChange={handleChange}
            className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded font-bold uppercase tracking-wider transition duration-200 disabled:bg-gray-700 disabled:text-gray-500"
      >
        {isLoading ? "CALCULATING..." : "RUN SIMULATION"}
      </button>
    </form>
  );
};

export default SimulationForm;
