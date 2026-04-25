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
      data: {
        initial_balance: 2000,
        capital_utilization: 100,
        risk_per_trade: 1,
        risk_reward_ratio: 1.5,
        win_rate: 60,
        trades_per_day: 10,
        simulation_days: 30,
        fees_per_trade: 0.5,
        risk_type: "dynamic",
      },
    },
    {
      name: "Day Trader (Balanced)",
      data: {
        initial_balance: 10000,
        capital_utilization: 50,
        risk_per_trade: 1,
        risk_reward_ratio: 2,
        win_rate: 50,
        trades_per_day: 3,
        simulation_days: 30,
        fees_per_trade: 2,
        risk_type: "dynamic",
      },
    },
    {
      name: "Swing Trader (Relaxed)",
      data: {
        initial_balance: 5000,
        capital_utilization: 30,
        risk_per_trade: 2,
        risk_reward_ratio: 3,
        win_rate: 40,
        trades_per_day: 1,
        simulation_days: 90,
        fees_per_trade: 5,
        risk_type: "fixed",
      },
    },
    {
      name: "Gambler (High Risk)",
      data: {
        initial_balance: 1000,
        capital_utilization: 100,
        risk_per_trade: 10,
        risk_reward_ratio: 1,
        win_rate: 40,
        trades_per_day: 5,
        simulation_days: 30,
        fees_per_trade: 0,
        risk_type: "fixed",
      },
    },
  ];

  const breakEvenWinRate = (
    (1 / (1 + formData.risk_reward_ratio)) *
    100
  ).toFixed(1);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Hanya parse ke float jika tipe inputnya number
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) : value,
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4"
          onClick={() => setActiveTooltip(null)}
        >
          <div
            className="bg-[#0a0f1c]/95 border border-[#00cfff]/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.15)] max-w-sm w-full relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveTooltip(null)}
              className="absolute top-4 right-4 text-[#00cfff]/50 hover:text-[#00cfff] hover:rotate-90 transition-all duration-300"
            >
              ✕
            </button>
            <h3 className="text-xl font-extrabold text-white mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00cfff]/10 flex items-center justify-center border border-[#00cfff]/20 text-[#00cfff] shadow-[0_0_10px_rgba(0,207,255,0.2)]">ℹ</div>
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
        className="bg-[#0a0f1c]/60 p-8 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-[#00cfff]/10 pb-6 gap-6">
          <h2 className="text-2xl font-extrabold text-white uppercase tracking-widest flex items-center gap-3">
            <span className="text-[#00cfff] drop-shadow-[0_0_5px_#00cfff]">⚙</span> Configuration
          </h2>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-3">
            {STRATEGY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => loadPreset(preset.data)}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#030308]/50 hover:bg-[#00cfff]/10 text-[#00cfff]/70 hover:text-[#00cfff] rounded-lg border border-[#00cfff]/20 hover:border-[#00cfff]/50 transition-all hover:shadow-[0_0_10px_rgba(0,207,255,0.2)]"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Risk Type Selection */}
          <div className="relative md:col-span-2 lg:col-span-4 mb-2">
            <div className="flex items-center mb-3">
              <label className="block text-xs font-extrabold text-[#00cfff] tracking-widest uppercase">
                RISK MANAGEMENT TYPE
              </label>
              {renderInfoIcon(
                "Risk Type",
                "Dynamic: Adjusts size based on current balance (Harder to blow up). Fixed: Constant size based on initial capital (Higher risk of ruin)."
              )}
            </div>
            <div className="flex bg-[#030308] p-1.5 rounded-xl border border-[#00cfff]/30 w-fit">
              {["dynamic", "fixed"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, risk_type: type })}
                  className={`px-8 py-2.5 text-xs font-extrabold uppercase tracking-widest rounded-lg transition-all ${
                    formData.risk_type === type
                      ? "bg-[#00cfff] text-[#030308] shadow-[0_0_15px_rgba(0,207,255,0.4)]"
                      : "text-[#00cfff]/50 hover:text-[#00cfff] hover:bg-[#00cfff]/10"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          {/* Modal Awal */}
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
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
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>

          {/* Penggunaan Modal */}
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
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
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>

          {/* Resiko Per Trade */}
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
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
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
            {formData.risk_per_trade > 2 && (
              <div className="mt-2 text-[10px] font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5 bg-yellow-500/10 p-1.5 rounded border border-yellow-500/20">
                <span>⚠</span>
                <span>High risk. Pros rarely risk {">"} 2%.</span>
              </div>
            )}
          </div>

          {/* Risk Reward */}
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
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
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>

          {/* Win Rate */}
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
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
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
            {/* Break Even Indicator */}
            <div className="mt-2 text-[10px] font-bold uppercase tracking-wider flex justify-between bg-[#030308]/50 p-1.5 rounded border border-[#00cfff]/10">
              <span className="text-gray-500">Min to not lose:</span>
              <span
                className={`font-mono ${
                  formData.win_rate < breakEvenWinRate
                    ? "text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                    : "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]"
                }`}
              >
                {breakEvenWinRate}%
              </span>
            </div>
          </div>

          {/* Trades Per Day */}
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
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
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>

          {/* Fees Per Trade */}
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
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
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>

          {/* Simulation Days */}
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
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
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#00cfff] text-[#030308] py-3.5 px-6 rounded-xl font-extrabold uppercase tracking-widest transition-all duration-300 h-[52px] ${
                isLoading 
                  ? "opacity-50 cursor-not-allowed border border-[#00cfff]/30 bg-transparent text-[#00cfff]" 
                  : "hover:bg-[#00e5ff] shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5"
              }`}
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
