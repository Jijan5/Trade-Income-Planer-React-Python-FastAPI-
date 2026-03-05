import React, { useState, useEffect, useMemo } from "react";
import api from "../lib/axios";
import { useOutletContext } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { getPlanLevel } from "../utils/permissions";

const TradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPnl: 0, winRate: 0, totalTrades: 0,
    avgWin: 0, avgLoss: 0, largestWin: 0, largestLoss: 0,
    winStreak: 0, lossStreak: 0, currentStreak: 0,
    profitFactor: 0, avgRR: 0
  });
  const [chartView, setChartView] = useState("pnl");
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
    
    const pnls = data.map(t => parseFloat(t.pnl));
    const wins = data.filter(t => t.is_win);
    const losses = data.filter(t => !t.is_win);
    
    const totalPnl = pnls.reduce((a, b) => a + b, 0);
    const winRate = (wins.length / data.length) * 100;
    const avgWin = wins.length ? wins.reduce((a, b) => a + parseFloat(b.pnl), 0) / wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a, b) => a + parseFloat(b.pnl), 0) / losses.length) : 0;
    const largestWin = Math.max(...pnls.filter(p => p > 0), 0);
    const largestLoss = Math.min(...pnls.filter(p => p < 0), 0);
    
    // Calculate streaks
    let winStreak = 0, lossStreak = 0, maxWinStreak = 0, maxLossStreak = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i].is_win) {
        if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
        lossStreak = 0;
        winStreak++;
        if (winStreak > maxWinStreak) maxWinStreak = winStreak;
      } else {
        if (winStreak > maxWinStreak) maxWinStreak = winStreak;
        winStreak = 0;
        lossStreak++;
        if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
      }
    }
    if (winStreak > maxWinStreak) maxWinStreak = winStreak;
    if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
    
    const currentStreak = data[0]?.is_win ? maxWinStreak : -maxLossStreak;
    
    // Profit factor
    const grossProfit = wins.reduce((a, b) => a + parseFloat(b.pnl), 0);
    const grossLoss = Math.abs(losses.reduce((a, b) => a + parseFloat(b.pnl), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    // Average R/R
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    setStats({
      totalPnl, winRate, totalTrades: data.length,
      avgWin, avgLoss, largestWin, largestLoss,
      winStreak: maxWinStreak, lossStreak: maxLossStreak, currentStreak,
      profitFactor, avgRR
    });
  };

  // Chart data for PnL over time
  const pnlChartData = useMemo(() => {
    if (!trades.length) return [];
    const sorted = [...trades].reverse();
    let running = 0;
    return sorted.map((t) => {
      running += parseFloat(t.pnl);
      return { date: format(new Date(t.trade_date), "MM/dd"), pnl: running };
    });
  }, [trades]);

  // Win/Loss streak chart data
  const streakChartData = useMemo(() => {
    if (!trades.length) return [];
    return trades.slice(0, 20).reverse().map((t) => ({
      value: t.is_win ? 1 : -1,
      label: t.is_win ? "W" : "L"
    }));
  }, [trades]);

  // Daily PnL chart data
  const dailyPnLData = useMemo(() => {
    if (!trades.length) return [];
    const daily = {};
    trades.forEach(t => {
      const day = format(new Date(t.trade_date), "yyyy-MM-dd");
      daily[day] = (daily[day] || 0) + parseFloat(t.pnl);
    });
    return Object.entries(daily).map(([date, pnl]) => ({ 
      date: format(new Date(date), "MM/dd"), 
      pnl 
    })).slice(-7);
  }, [trades]);

  // Bar chart component
  const renderBarChart = (data, maxVal) => {
    if (!data.length) return <p className="text-gray-500 text-sm">No data</p>;
    return (
      <div className="flex items-end h-32 gap-1">
        {data.map((d, i) => {
          const height = Math.abs(d.pnl) / maxVal * 100;
          const isPositive = d.pnl >= 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full ${isPositive ? 'bg-green-500' : 'bg-red-500'} rounded-t transition-all`}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              <span className="text-[8px] text-gray-500 mt-1">{d.date}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Win rate pie chart
  const renderWinRateChart = () => {
    const wins = stats.totalTrades * stats.winRate / 100;
    const winAngle = (wins / stats.totalTrades) * 360;
    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${winAngle} ${100 - winAngle}`} />
          <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#ef4444" strokeWidth="3" strokeDasharray={`${100 - winAngle} ${winAngle}`} strokeDashoffset={-winAngle} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">{stats.winRate.toFixed(0)}%</span>
          <span className="text-xs text-gray-400">Win Rate</span>
        </div>
      </div>
    );
  };

  // Streak visualization
  const renderStreakChart = () => {
    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {streakChartData.map((d, i) => (
          <div 
            key={i} 
            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
              d.value > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
            title={d.label}
          >
            {d.label}
          </div>
        ))}
      </div>
    );
  };

  const groupedTrades = trades.reduce((groups, trade) => {
    const date = format(new Date(trade.trade_date), "yyyy-MM-dd");
    if (!groups[date]) groups[date] = [];
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
        `"${(trade.notes || "").replace(/"/g, '""')}"`
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

  const maxPnL = Math.max(...pnlChartData.map(d => Math.abs(d.pnl)), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end">
        {planLevel >= 1 || isAdmin ? (
          <button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Export CSV
          </button>
        ) : (
          <button disabled className="bg-gray-700 text-gray-500 px-4 py-2 rounded text-sm font-bold cursor-not-allowed">Export CSV 🔒</button>
        )}
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700">
          <p className="text-xs text-gray-400 uppercase font-bold">Total PnL</p>
          <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            ${stats.totalPnl.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats.totalTrades} trades</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700">
          <p className="text-xs text-gray-400 uppercase font-bold">Win Rate</p>
          <p className="text-2xl font-bold text-blue-400">{stats.winRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">{Math.floor(stats.totalTrades * stats.winRate / 100)}W / {Math.ceil(stats.totalTrades * (100 - stats.winRate) / 100)}L</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700">
          <p className="text-xs text-gray-400 uppercase font-bold">Current Streak</p>
          <p className={`text-2xl font-bold ${stats.currentStreak > 0 ? "text-green-400" : stats.currentStreak < 0 ? "text-red-400" : "text-gray-400"}`}>
            {stats.currentStreak > 0 ? `+${stats.currentStreak}` : stats.currentStreak < 0 ? stats.currentStreak : 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Best: {stats.winStreak}W / {stats.lossStreak}L</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700">
          <p className="text-xs text-gray-400 uppercase font-bold">Profit Factor</p>
          <p className={`text-2xl font-bold ${stats.profitFactor >= 1 ? "text-green-400" : "text-red-400"}`}>
            {stats.profitFactor.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Avg R/R: 1:{stats.avgRR.toFixed(1)}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700">
          <p className="text-xs text-gray-400 uppercase font-bold">Total Trades</p>
          <p className={`text-2xl font-bold ${stats.totalTrades}`}>
            {stats.totalTrades}
          </p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 uppercase">Avg Win</p>
          <p className="text-green-400 font-bold">+${stats.avgWin.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 uppercase">Avg Loss</p>
          <p className="text-red-400 font-bold">-${stats.avgLoss.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 uppercase">Largest Win</p>
          <p className="text-green-400 font-bold">+${stats.largestWin.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 uppercase">Largest Loss</p>
          <p className="text-red-400 font-bold">${stats.largestLoss.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 uppercase">Best Win Streak</p>
          <p className="text-green-400 font-bold">{stats.winStreak}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 uppercase">Best Loss Streak</p>
          <p className="text-red-400 font-bold">{stats.lossStreak}</p>
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
                      <tr key={trade.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{format(new Date(trade.trade_date), "HH:mm")}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white">{trade.symbol}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300 font-mono">{parseFloat(trade.entry_price).toFixed(trade.entry_price < 1 ? 6 : 2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300 font-mono">{parseFloat(trade.exit_price).toFixed(trade.exit_price < 1 ? 6 : 2)}</td>
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
