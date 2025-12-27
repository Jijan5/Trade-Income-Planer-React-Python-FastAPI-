import React, { useState } from "react";
import axios from "axios";

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
      const response = await axios.post("http://localhost:8000/api/plan", params);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to calculate plan.");
    } finally {
      setLoading(false);
    }
  };

  const getFeasibilityColor = (feasibility) => {
    switch (feasibility) {
      case "Realistic": return "text-green-400";
      case "Ambitious": return "text-yellow-400";
      case "Very Unlikely": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-100 uppercase tracking-wider border-b border-gray-700 pb-4 mb-6">
        Time-Based Goal Planner
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Initial Capital ($)</label>
            <input
              type="number"
              name="initial_balance"
              value={params.initial_balance}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Target Balance ($)</label>
            <input
              type="number"
              name="target_balance"
              value={params.target_balance}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Deadline (Months)</label>
            <input
              type="number"
              name="deadline_months"
              value={params.deadline_months}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded font-bold uppercase tracking-wider transition duration-200 disabled:bg-gray-700"
          >
            {loading ? "Calculating Path..." : "Find My Path"}
          </button>
        </form>

        {/* Results Display */}
        <div className="flex flex-col justify-center items-center bg-gray-900/50 p-6 rounded-lg border border-dashed border-gray-600">
          {loading && <p className="text-gray-400">Calculating...</p>}
          {error && <p className="text-red-400 text-center">{error}</p>}
          {result && (
            <div className="text-center space-y-4 animate-fade-in">
              <p className="text-sm text-gray-400">Required Monthly Return</p>
              <p className="text-5xl font-bold text-blue-400">
                {result.required_monthly_return}
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-gray-400">Feasibility:</p>
                <p className={`text-sm font-bold ${getFeasibilityColor(result.feasibility)}`}>
                  {result.feasibility}
                </p>
              </div>
              <p className="text-gray-300 text-sm max-w-md mx-auto pt-4 border-t border-gray-700">
                {result.message}
              </p>
            </div>
          )}
          {!loading && !result && !error && (
            <div className="text-center text-gray-500">
              <p>Enter your financial goal and deadline to see the required performance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalPlanner;

