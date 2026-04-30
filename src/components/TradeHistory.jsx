import React, { useState, useEffect, useMemo } from "react";
import api from "../lib/axios";
import { useOutletContext } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { getPlanLevel } from "../utils/permissions";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { Lock } from "lucide-react";

const TradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPnl: 0, winRate: 0, lossRate: 0, breakevenRate: 0, totalTrades: 0,
    avgWin: 0, avgLoss: 0, largestWin: 0, largestLoss: 0,
    bestTrade: { pnl: 0, symbol: '-' }, worstTrade: { pnl: 0, symbol: '-' },
    winStreak: 0, lossStreak: 0, currentStreak: 0,
    profitFactor: 0, avgRR: 0, winsCount: 0, lossesCount: 0, breakevensCount: 0
  });
  
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
    } catch (error) {
      console.error("Failed to fetch trade history", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = useMemo(() => {
    const now = new Date();
    return trades.filter(t => {
      if (timeFilter === "all") return true;
      const tradeDate = new Date(t.trade_date);
      const diffTime = Math.abs(now - tradeDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (timeFilter === "30") return diffDays <= 30;
      if (timeFilter === "7") return diffDays <= 7;
      return true;
    });
  }, [trades, timeFilter]);

  useEffect(() => {
    calculateStats(filteredTrades);
  }, [filteredTrades]);

  const calculateStats = (data) => {
    if (!data || !data.length) {
      setStats({
        totalPnl: 0, winRate: 0, lossRate: 0, breakevenRate: 0, totalTrades: 0,
        avgWin: 0, avgLoss: 0, largestWin: 0, largestLoss: 0,
        bestTrade: { pnl: 0, symbol: '-' }, worstTrade: { pnl: 0, symbol: '-' },
        winStreak: 0, lossStreak: 0, currentStreak: 0,
        profitFactor: 0, avgRR: 0, winsCount: 0, lossesCount: 0, breakevensCount: 0
      });
      return;
    }
    
    const pnls = data.map(t => parseFloat(t.pnl));
    const wins = data.filter(t => parseFloat(t.pnl) > 0);
    const losses = data.filter(t => parseFloat(t.pnl) < 0);
    const breakevens = data.filter(t => parseFloat(t.pnl) === 0);
    
    const totalPnl = pnls.reduce((a, b) => a + b, 0);
    const winRate = (wins.length / data.length) * 100;
    const lossRate = (losses.length / data.length) * 100;
    const breakevenRate = (breakevens.length / data.length) * 100;
    
    const avgWin = wins.length ? wins.reduce((a, b) => a + parseFloat(b.pnl), 0) / wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a, b) => a + parseFloat(b.pnl), 0) / losses.length) : 0;
    
    let bestTrade = data[0];
    let worstTrade = data[0];
    if (data.length > 0) {
       bestTrade = data.reduce((max, t) => parseFloat(t.pnl) > parseFloat(max.pnl) ? t : max, data[0]);
       worstTrade = data.reduce((min, t) => parseFloat(t.pnl) < parseFloat(min.pnl) ? t : min, data[0]);
    }
    
    // Calculate streaks
    let winStreak = 0, lossStreak = 0, maxWinStreak = 0, maxLossStreak = 0;
    for (let i = 0; i < data.length; i++) {
      if (parseFloat(data[i].pnl) > 0) {
        if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
        lossStreak = 0;
        winStreak++;
        if (winStreak > maxWinStreak) maxWinStreak = winStreak;
      } else if (parseFloat(data[i].pnl) < 0) {
        if (winStreak > maxWinStreak) maxWinStreak = winStreak;
        winStreak = 0;
        lossStreak++;
        if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
      } else {
        // Breakeven breaks streaks
        if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
        if (winStreak > maxWinStreak) maxWinStreak = winStreak;
        lossStreak = 0;
        winStreak = 0;
      }
    }
    if (winStreak > maxWinStreak) maxWinStreak = winStreak;
    if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
    
    const currentStreak = parseFloat(data[0]?.pnl) > 0 ? maxWinStreak : parseFloat(data[0]?.pnl) < 0 ? -maxLossStreak : 0;
    
    const grossProfit = wins.reduce((a, b) => a + parseFloat(b.pnl), 0);
    const grossLoss = Math.abs(losses.reduce((a, b) => a + parseFloat(b.pnl), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    setStats({
      totalPnl, winRate, lossRate, breakevenRate, totalTrades: data.length,
      avgWin, avgLoss, bestTrade, worstTrade, largestWin: parseFloat(bestTrade?.pnl || 0), largestLoss: parseFloat(worstTrade?.pnl || 0),
      winStreak: maxWinStreak, lossStreak: maxLossStreak, currentStreak,
      profitFactor, avgRR, winsCount: wins.length, lossesCount: losses.length, breakevensCount: breakevens.length
    });
  };

  const getTradeType = (t) => {
    const entry = parseFloat(t.entry_price);
    const exit = parseFloat(t.exit_price);
    const pnl = parseFloat(t.pnl);
    if (entry < exit) {
        return pnl > 0 ? "LONG" : "SHORT";
    } else if (entry > exit) {
        return pnl > 0 ? "SHORT" : "LONG";
    }
    return "LONG"; // Default
  };

  const pnlChartData = useMemo(() => {
    if (!filteredTrades.length) return [];
    const sorted = [...filteredTrades].reverse();
    let running = 0;
    return sorted.map((t) => {
      running += parseFloat(t.pnl);
      return { pnl: running };
    });
  }, [filteredTrades]);

  const pieData = [
    { name: 'Wins', value: stats.winsCount, color: '#00e5ff' },
    { name: 'Losses', value: stats.lossesCount, color: '#3b82f6' },
    { name: 'Breakeven', value: stats.breakevensCount, color: '#4b5563' }
  ].filter(d => d.value > 0); // Hide empty segments

  const handleExportCSV = () => {
    if (planLevel < 1 && !isAdmin) return showFlash("Upgrade to Basic Plan to export CSV.", "error");
    if (filteredTrades.length === 0) return showFlash("No trades to export.", "info");
    const headers = ["Date", "Time", "Symbol", "Entry Price", "Exit Price", "PnL", "Result", "Notes"];
    const csvRows = [headers.join(",")];
    filteredTrades.forEach(trade => {
      const date = new Date(trade.trade_date);
      const row = [
        format(date, "yyyy-MM-dd"),
        format(date, "HH:mm:ss"),
        trade.symbol,
        trade.entry_price,
        trade.exit_price,
        trade.pnl,
        parseFloat(trade.pnl) > 0 ? "WIN" : parseFloat(trade.pnl) < 0 ? "LOSS" : "BREAKEVEN",
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

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#00cfff]/20 border-t-[#00cfff] rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#0a0f1c]/80 backdrop-blur-md p-4 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_15px_rgba(0,207,255,0.05)]">
        <h2 className="text-xl font-extrabold text-white uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
          Overview & Performance
        </h2>
        <div className="flex gap-3 items-center">
            <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-[#030308] border border-[#00cfff]/30 text-white text-xs font-bold uppercase tracking-widest rounded-lg px-4 py-2 outline-none focus:border-[#00cfff] transition-all"
            >
                <option value="all">All Time</option>
                <option value="30">Last 30 Days</option>
                <option value="7">Last 7 Days</option>
            </select>
            {planLevel >= 1 || isAdmin ? (
            <button onClick={handleExportCSV} className="bg-[#00cfff]/10 hover:bg-[#00cfff] text-[#00cfff] hover:text-[#030308] border border-[#00cfff]/50 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,207,255,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                EXPORT
            </button>
            ) : (
            <button disabled className="bg-[#030308] border border-gray-700 text-gray-500 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-widest cursor-not-allowed flex items-center gap-2"><Lock className="w-3 h-3" /> EXPORT</button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Win Rate Analysis */}
        <div className="lg:col-span-4 bg-[#111827] rounded-2xl border border-gray-800 shadow-2xl p-6 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-4 opacity-50 cursor-pointer hover:opacity-100 transition-opacity">
            <span className="text-gray-400 font-bold tracking-widest">•••</span>
          </div>
          <h3 className="text-xs font-extrabold text-gray-300 uppercase tracking-widest mb-1">Win Rate Analysis</h3>
          <p className="text-[10px] text-gray-500 mb-8 font-medium">Total Trades: {stats.totalTrades}</p>

          <div className="relative h-64 w-full flex items-center justify-center mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius="70%"
                  outerRadius="90%"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 10px ${entry.color}80)` }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-extrabold text-white drop-shadow-md">{stats.winRate.toFixed(1)}%</span>
              <span className="text-[11px] text-gray-400 font-medium">Win Rate</span>
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full mt-2 font-bold border border-green-500/20">
                 {stats.profitFactor >= 1 ? "+" : ""}{stats.profitFactor.toFixed(1)} PF
              </span>
            </div>
          </div>

          <div className="space-y-3 mt-auto">
            <div className="flex justify-between items-center text-xs font-bold">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-3 h-3 rounded-full bg-[#00cfff] shadow-[0_0_8px_#00cfff]"></span>
                WINS ({stats.winsCount})
              </div>
              <span className="text-white">{stats.winRate.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]"></span>
                LOSSES ({stats.lossesCount})
              </div>
              <span className="text-white">{stats.lossRate.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-3 h-3 rounded-full bg-[#4b5563]"></span>
                BREAKEVEN ({stats.breakevensCount})
              </div>
              <span className="text-white">{stats.breakevenRate.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Trading Stats */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          <div className="bg-[#111827] rounded-2xl border border-gray-800 shadow-2xl p-6 relative flex-1">
            <div className="absolute top-0 right-0 p-4 opacity-50 cursor-pointer hover:opacity-100 transition-opacity">
              <span className="text-gray-400 font-bold tracking-widest">•••</span>
            </div>
            <h3 className="text-xs font-extrabold text-gray-300 uppercase tracking-widest mb-6">Trading Stats</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Total Profit Card */}
              <div className="bg-[#1e293b]/50 border border-green-500/30 rounded-xl p-5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent z-0"></div>
                <div className="relative z-10">
                  <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Total Profit</p>
                  <div className="flex items-baseline gap-3">
                    <p className={`text-2xl font-bold font-mono ${stats.totalPnl >= 0 ? "text-white" : "text-red-400"} drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`}>
                      ${stats.totalPnl.toFixed(2)}
                    </p>
                    <span className={`text-[10px] font-bold ${stats.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {stats.totalPnl >= 0 ? "↑" : "↓"} Active
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-12 z-0 opacity-50 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={pnlChartData}>
                            <YAxis domain={['auto', 'auto']} hide />
                            <Line type="monotone" dataKey="pnl" stroke={stats.totalPnl >= 0 ? "#22c55e" : "#ef4444"} strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
              </div>
              
              {/* Streak / Count Card */}
              <div className="bg-[#1e293b]/50 border border-gray-700/50 rounded-xl p-5 relative overflow-hidden">
                <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Trade Consistency</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                        <p className="text-lg font-bold font-mono text-white">{stats.totalTrades}</p>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Trades</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold font-mono text-green-400">{stats.winStreak}</p>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Win Strk</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold font-mono text-red-400">{stats.lossStreak}</p>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Loss Strk</p>
                    </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-[#1e293b]/50 border border-gray-700/50 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Avg Win</p>
                <p className="text-lg font-bold font-mono text-white">${stats.avgWin.toFixed(2)}</p>
              </div>
              <div className="bg-[#1e293b]/50 border border-gray-700/50 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Avg Loss</p>
                <p className="text-lg font-bold font-mono text-red-300">-${stats.avgLoss.toFixed(2)}</p>
              </div>
              <div className="bg-[#1e293b]/50 border border-gray-700/50 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Risk/Reward</p>
                <p className="text-lg font-bold font-mono text-white">1:{stats.avgRR.toFixed(1)} <span className="text-[9px] text-gray-500 font-sans">Ratio</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1e293b]/50 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Best Trade</p>
                  <p className="text-lg font-bold font-mono text-green-400">${parseFloat(stats.bestTrade?.pnl || 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-gray-300 border-l border-gray-700 pl-3">{stats.bestTrade?.symbol || '-'}</span>
                </div>
              </div>
              <div className="bg-[#1e293b]/50 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Worst Trade</p>
                  <p className="text-lg font-bold font-mono text-red-400">-${Math.abs(parseFloat(stats.worstTrade?.pnl || 0)).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-gray-300 border-l border-gray-700 pl-3">{stats.worstTrade?.symbol || '-'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="bg-[#111827] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-gray-300 uppercase tracking-widest">Recent Trades</h3>
            <span className="text-gray-400 font-bold tracking-widest cursor-pointer hover:text-white">•••</span>
        </div>
        <div className="overflow-x-auto custom-scrollbar max-h-[600px]">
          {filteredTrades.length === 0 ? (
            <div className="text-center text-gray-500 py-16 text-[11px] font-extrabold uppercase tracking-widest">
              NO TRADE HISTORY FOUND.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-[#0f172a]">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Asset</th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-right text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Entry</th>
                  <th className="px-6 py-4 text-right text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Exit</th>
                  <th className="px-6 py-4 text-right text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">P/L</th>
                  <th className="px-6 py-4 text-center text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 bg-[#111827]">
                {filteredTrades.map((trade) => {
                  const type = getTradeType(trade);
                  const pnl = parseFloat(trade.pnl);
                  return (
                  <tr key={trade.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-xs text-gray-400 font-mono">{format(new Date(trade.trade_date), "MM/dd/yy")}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-white">{trade.symbol}</td>
                    <td className="px-6 py-4">
                        <span className={`text-[10px] font-extrabold tracking-widest ${type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>{type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-300 font-mono">${parseFloat(trade.entry_price).toFixed(trade.entry_price < 1 ? 4 : 2)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-300 font-mono">${parseFloat(trade.exit_price).toFixed(trade.exit_price < 1 ? 4 : 2)}</td>
                    <td className={`px-6 py-4 text-sm text-right font-bold font-mono ${pnl > 0 ? "text-green-400" : pnl < 0 ? "text-red-400" : "text-gray-400"}`}>
                      {pnl > 0 ? "+" : ""}${pnl.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-[9px] font-extrabold rounded-md uppercase tracking-widest bg-transparent ${pnl > 0 ? "text-green-400" : pnl < 0 ? "text-red-400" : "text-gray-400"}`}>
                        {pnl > 0 ? "Win" : pnl < 0 ? "Loss" : "Break"}
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;
