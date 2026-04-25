import React, { useState } from "react";
import api from "../lib/axios";

const GoalPlanner = () => {
  const [params, setParams] = useState({
    initial_balance: 10000,
    target_balance: 50000,
    deadline_months: 12,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setParams({ ...params, [name]: parseFloat(value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await api.post("/plan", params);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to calculate plan.");
    } finally {
      setLoading(false);
    }
  };

  const getFeasibilityColor = (feasibility) => {
    switch (feasibility) {
      case "Realistic": return "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]";
      case "Ambitious": return "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]";
      case "Very Unlikely": return "text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="bg-[#0a0f1c]/60 p-8 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md">
      <h2 className="text-2xl font-extrabold text-white uppercase tracking-widest border-b border-[#00cfff]/10 pb-6 mb-8 flex items-center gap-3">
        <span className="text-[#00cfff] drop-shadow-[0_0_5px_#00cfff]">🎯</span> Time-Based Goal Planner
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-extrabold text-[#00cfff] mb-2 uppercase tracking-widest">Initial Capital ($)</label>
            <input
              type="number"
              name="initial_balance"
              value={params.initial_balance}
              onChange={handleChange}
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-[#00cfff] mb-2 uppercase tracking-widest">Target Balance ($)</label>
            <input
              type="number"
              name="target_balance"
              value={params.target_balance}
              onChange={handleChange}
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-[#00cfff] mb-2 uppercase tracking-widest">Deadline (Months)</label>
            <input
              type="number"
              name="deadline_months"
              value={params.deadline_months}
              onChange={handleChange}
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-extrabold uppercase tracking-widest transition-all duration-300 mt-4 ${
              loading 
                ? "bg-transparent border border-[#00cfff]/30 text-[#00cfff] opacity-50 cursor-not-allowed" 
                : "bg-[#00cfff] text-[#030308] hover:bg-[#00e5ff] shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5"
            }`}
          >
            {loading ? "CALCULATING PATH..." : "FIND MY PATH"}
          </button>
        </form>

        {/* Results Display */}
        <div className="flex flex-col justify-center items-center bg-[#030308]/50 p-8 rounded-2xl border border-dashed border-[#00cfff]/30 relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#00cfff]/5 to-transparent pointer-events-none"></div>

          {loading && (
             <div className="flex flex-col items-center gap-3">
               <div className="w-8 h-8 border-4 border-[#00cfff]/20 border-t-[#00cfff] rounded-full animate-spin"></div>
               <p className="text-[#00cfff] font-mono text-sm tracking-widest animate-pulse">CALCULATING...</p>
             </div>
          )}
          {error && <p className="text-red-400 font-bold tracking-wide text-center drop-shadow-[0_0_5px_rgba(248,113,113,0.5)] z-10">{error}</p>}
          {result && (
            <div className="text-center space-y-6 animate-fade-in z-10 w-full">
              <div>
                <p className="text-xs font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">Required Monthly Return</p>
                <p className="text-6xl font-mono font-bold text-[#00cfff] drop-shadow-[0_0_15px_rgba(0,207,255,0.4)]">
                  {result.required_monthly_return}
                </p>
              </div>
              
              <div className="bg-[#0a0f1c]/80 p-4 rounded-xl border border-[#00cfff]/10 inline-block w-full max-w-[250px]">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Feasibility</p>
                <p className={`text-xl font-extrabold uppercase tracking-widest ${getFeasibilityColor(result.feasibility)}`}>
                  {result.feasibility}
                </p>
              </div>
              
              <p className="text-gray-300 text-sm max-w-sm mx-auto pt-6 border-t border-[#00cfff]/10 font-medium leading-relaxed">
                {result.message}
              </p>
            </div>
          )}
          {!loading && !result && !error && (
            <div className="text-center text-[#00cfff]/40 z-10 flex flex-col items-center gap-4">
              <span className="text-5xl opacity-50">🧭</span>
              <p className="text-sm font-medium max-w-[200px] uppercase tracking-wider leading-relaxed">
                Enter your financial goal and deadline to see the required performance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalPlanner;

