import React, { useState, useEffect } from "react";
import api from "../lib/axios";
import { useOutletContext } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { getPlanLevel } from "../utils/permissions";

const TradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPnl: 0, winRate: 0, totalTrades: 0 });
  const { showFlash } = useOutletContext();
  const { userData } = useAuth();
  const planLevel = getPlanLevel(userData?.plan);
  const isAdmin = userData?.role === 'admin';


  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await api.get("/manual-trades");
      setTrades(res.data);
      calculateStats(res.data);
    } catch (error) {
      console.error("Failed to fetch trade history", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    if (!data.length) return;
    const totalPnl = data.reduce((acc, curr) => acc + parseFloat(curr.pnl), 0);
    const wins = data.filter((t) => t.is_win).length;
    const winRate = (wins / data.length) * 100;
    setStats({ totalPnl, winRate, totalTrades: data.length });
  };

  // Group trades by date
  const groupedTrades = trades.reduce((groups, trade) => {
    const date = format(new Date(trade.trade_date), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(trade);
    return groups;
  }, {});

  const handleExportCSV = () => {
    if (planLevel < 1 && !isAdmin) return showFlash("Upgrade to Basic Plan to export CSV.", "error");
    if (trades.length === 0) return showFlash("No trades to export.", "info");

    const headers = ["Date", "Time", "Symbol", "Entry Price", "Exit Price", "PnL", "Result", "Notes"];
    const csvRows = [headers.join(",")];

    trades.forEach(trade => {
      const date = new Date(trade.trade_date);
      const row = [
        format(date, "yyyy-MM-dd"),
        format(date, "HH:mm:ss"),
        trade.symbol,
        trade.entry_price,
        trade.exit_price,
        trade.pnl,
        trade.is_win ? "WIN" : "LOSS",
        `"${(trade.notes || "").replace(/"/g, '""')}"` // Escape quotes
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trade_history_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <div className="text-center text-gray-500 py-10">Loading history...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end">
      {planLevel >= 1 || isAdmin ? (
          <button 
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        ) : (
          <button disabled className="bg-gray-700 text-gray-500 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 cursor-not-allowed">Export CSV 🔒</button>
        )}
      </div>
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 uppercase font-bold">Total PnL</p>
          <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            ${stats.totalPnl.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 uppercase font-bold">Win Rate</p>
          <p className="text-2xl font-bold text-blue-400">{stats.winRate.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 uppercase font-bold">Total Trades</p>
          <p className="text-2xl font-bold text-white">{stats.totalTrades}</p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-8">
        {Object.keys(groupedTrades).length === 0 ? (
          <div className="text-center text-gray-500 py-10 bg-gray-800 rounded-lg border border-gray-700">
            No trade history found. Start trading in Manual Simulator!
          </div>
        ) : (
          Object.keys(groupedTrades).map((date) => (
            <div key={date} className="space-y-3">
              <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {format(new Date(date), "EEEE, d MMMM yyyy")}
              </h3>
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Symbol</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Entry</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Exit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">PnL</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {groupedTrades[date].map((trade) => (
                      <tr key={trade.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          {format(new Date(trade.trade_date), "HH:mm")}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-white">{trade.symbol}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300 font-mono">
                          {parseFloat(trade.entry_price).toFixed(trade.entry_price < 1 ? 6 : 2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300 font-mono">
                          {parseFloat(trade.exit_price).toFixed(trade.exit_price < 1 ? 6 : 2)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-bold font-mono ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {trade.pnl >= 0 ? "+" : ""}{parseFloat(trade.pnl).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${trade.is_win ? "bg-green-900/50 text-green-400 border border-green-500/30" : "bg-red-900/50 text-red-400 border border-red-500/30"}`}>
                            {trade.is_win ? "WIN" : "LOSS"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TradeHistory;
