import React, { useState, useEffect } from "react";
import api from "../lib/axios";
import { useOutletContext } from "react-router-dom";
import { useManualTrade } from "../contexts/ManualTradeContext";
import { useAuth } from "../contexts/AuthContext";
import { getPlanLevel } from "../utils/permissions";
import { BeginnerWidgetsPanel } from "./BeginnerWidgets";
import { QuickTemplateSelector } from "./TradeSetupTemplates";
import {
  TradingGlossary,
  PreTradeChecklist,
  TutorialOverlay,
  BeginnerHelpButtons,
} from "./BeginnerHelpWidgets";
import RiskManagementCalculator from "./RiskManagementCalculator";

// Memoized History Table to prevent re-renders on price ticks
const TradeHistoryTable = React.memo(({ history }) => (
  <div className="bg-[#0a0f1c]/60 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md overflow-hidden">
    <div className="p-4 border-b border-[#00cfff]/10 bg-[#030308]/80">
      <h3 className="text-xs font-extrabold text-[#00cfff] uppercase tracking-widest flex items-center gap-2">
        <span className="text-lg">📜</span> Trade History
      </h3>
    </div>
    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
      <table className="min-w-full divide-y divide-[#00cfff]/10">
        <thead className="bg-[#030308] sticky top-0 z-10 border-b border-[#00cfff]/10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
              Entry
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
              Exit
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
              Reason
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
              Note
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
              PnL
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#00cfff]/5">
          {history.map((trade) => (
            <tr key={trade.id} className="hover:bg-[#00cfff]/5 transition-colors">
              <td className="px-4 py-3">
                <span
                  className={`text-xs font-extrabold ${
                    trade.type === "BUY" ? "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" : "text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]"
                  }`}
                >
                  {trade.type}
                </span>
              </td>
              <td className="px-4 py-3 text-xs font-mono text-gray-300">
                {trade.entryPrice.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-xs font-mono text-gray-300">
                {trade.exitPrice.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-xs">
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    trade.reason === "TP"
                      ? "bg-green-900/30 text-green-400 border-green-500/30"
                      : trade.reason === "SL"
                      ? "bg-red-900/30 text-red-400 border-red-500/30"
                      : "bg-[#00cfff]/10 text-[#00cfff] border-[#00cfff]/30"
                  }`}
                >
                  {trade.reason}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400 italic max-w-[150px] truncate">
                {trade.note}
              </td>
              <td
                className={`px-4 py-3 text-sm font-mono font-bold ${
                  trade.finalPnL >= 0 ? "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" : "text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]"
                }`}
              >
                {trade.finalPnL >= 0 ? "+" : ""}
                {trade.finalPnL.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
));

const ManualTradeSimulator = ({ activeSymbol = "BINANCE:BTCUSDT" }) => {
  const {
    config,
    setConfig,
    marketState,
    account,
    challengeState,
    isSessionActive,
    healthData,
    setHealthData,
    lockout,
    timeLeft,
    startSession,
    openPosition,
    closePosition,
    resetSession,
  } = useManualTrade();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Beginner help modal states
  const [showGlossary, setShowGlossary] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [checklistConfirmed, setChecklistConfirmed] = useState(false);
  const [showRiskCalculator, setShowRiskCalculator] = useState(false);

  const { showFlash } = useOutletContext();
  const { userData } = useAuth();
  const planLevel = getPlanLevel(userData?.plan);
  const isAdmin = userData?.role === "admin";

  // Show tutorial on first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hideTutorial");
    if (!hasSeenTutorial && isSessionActive) {
      setShowTutorial(true);
    }
  }, [isSessionActive]);

  // Handle applying position size from calculator
  const handleApplyPositionSize = (size) => {
    setConfig((prev) => ({ ...prev, tradeAmount: size }));
    showFlash(`Position size applied: $${size.toFixed(2)}`, "success");
  };

  // Handle applying risk calculator settings
  const handleApplyRiskSettings = (settings) => {
    setConfig((prev) => ({
      ...prev,
      tradeAmount: settings.tradeAmount,
      stopLossPct: settings.stopLossPct,
      takeProfitPct: settings.takeProfitPct,
    }));
    setShowRiskCalculator(false);
    showFlash("Risk management settings applied!", "success");
  };

  // Handle applying trade setup template
  const handleApplyTemplate = (template) => {
    setConfig((prev) => ({
      ...prev,
      stopLossPct: template.slPct,
      takeProfitPct: template.tpPct,
    }));
    setSelectedTemplate(template.id);
    showFlash(`${template.name} template applied!`, "success");
  };

  // Handle checklist confirmation
  const handleChecklistConfirm = () => {
    setChecklistConfirmed(true);
    setShowChecklist(false);
  };

  // Open position with checklist requirement
  const handleOpenPosition = (type) => {
    if (!checklistConfirmed) {
      setShowChecklist(true);
      return;
    }
    openPosition(type);
  };

  const downloadCSV = () => {
    if (planLevel < 1 && !isAdmin)
      return showFlash("Upgrade to Basic Plan to export CSV.", "error");
    if (!account.history || account.history.length === 0) return;

    const headers = [
      "ID",
      "Symbol",
      "Type",
      "Entry Price",
      "Exit Price",
      "Size",
      "PnL",
      "Reason",
      "Note",
      "Time",
    ];
    const csvContent = [
      headers.join(","),
      ...account.history.map((trade) =>
        [
          trade.id,
          trade.symbol,
          trade.type,
          trade.entryPrice,
          trade.exitPrice,
          trade.size,
          trade.finalPnL.toFixed(2),
          trade.reason,
          `"${trade.note}"`,
          trade.closeTime.toLocaleString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `trade_history_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analyzeHealth = async () => {
    if (planLevel < 2)
      return showFlash("Upgrade to Premium Plan to use AI Coach.", "error");
    if (account.history.length === 0) return;
    setIsAnalyzing(true);
    try {
      let runningBal = config.initialCapital;
      const chronologicalTrades = [...account.history].reverse();

      const tradesPayload = chronologicalTrades.map((t) => {
        let riskAmt = 0;
        const entry = parseFloat(t.entryPrice);
        const sl = parseFloat(t.slPrice);
        const size = parseFloat(t.size);
        const pnl = parseFloat(t.finalPnL);

        if (!isNaN(entry) && !isNaN(sl) && !isNaN(size) && entry > 0) {
          riskAmt = (Math.abs(entry - sl) / entry) * size;
        }

        if ((!riskAmt || riskAmt === 0) && pnl < 0) {
          riskAmt = Math.abs(pnl);
        }

        const tradeItem = {
          pnl: pnl,
          risk_amount: riskAmt,
          balance: runningBal,
          is_win: pnl > 0,
        };
        runningBal += pnl;
        return tradeItem;
      });

      const res = await api.post("/analyze/health", { trades: tradesPayload });
      setHealthData(res.data);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isSessionActive) {
    if (lockout) {
      return (
        <div className="bg-[#030308]/95 border border-red-500/50 p-8 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.1)] backdrop-blur-md max-w-md mx-auto mt-10 text-center animate-fade-in">
          <div className="text-6xl mb-4 animate-bounce">⛔</div>
          <h2 className="text-2xl font-extrabold text-red-400 mb-2 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
            Trading Disabled
          </h2>
          <p className="text-white font-bold text-lg mb-4 max-w-xs mx-auto">
            {lockout.reason}
          </p>
          <p className="text-xs text-gray-500 mb-4 uppercase tracking-widest">
            Account: <span className="text-[#00cfff] font-mono">{userData?.username}</span>
          </p>
          <div className="text-5xl font-mono font-extrabold text-red-400 bg-black/50 p-6 rounded-xl border border-red-500/30 inline-block mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            {timeLeft || "30:00"}
          </div>
          <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
            Discipline is key. Take a walk, drink some water, and come back
            later.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-[#0a0f1c]/60 p-8 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md max-w-md mx-auto mt-10 text-center">
        <h2 className="text-2xl font-extrabold text-white mb-2 uppercase tracking-widest drop-shadow-[0_0_5px_#00cfff]">
          Live Market Simulator
        </h2>
        <p className="text-[#00cfff]/70 mb-8 text-sm uppercase tracking-wider">
          Trade <span className="text-[#00cfff] font-bold">{activeSymbol}</span> with real-time market data without risking real money.
        </p>

        <form onSubmit={startSession} className="space-y-6 text-left relative">
          <div>
            <label className="block text-xs font-extrabold text-[#00cfff] mb-2 uppercase tracking-widest">
              Initial Capital ($)
            </label>
            <input
              type="number"
              value={config.initialCapital}
              onChange={(e) =>
                setConfig({
                  ...config,
                  initialCapital: parseFloat(e.target.value),
                })
              }
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none text-lg font-mono transition-all"
              required
            />
          </div>

          {/* Challenge Mode Toggle */}
          <div className="bg-[#030308]/50 p-5 rounded-xl border border-[#00cfff]/20 transition-all hover:border-[#00cfff]/40">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-extrabold text-gray-300 uppercase tracking-widest">
                Enable Prop Firm Challenge
              </label>
              {planLevel >= 1 || isAdmin ? (
                <input
                  type="checkbox"
                  checked={config.isChallengeMode}
                  onChange={(e) =>
                    setConfig({ ...config, isChallengeMode: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#00cfff] rounded cursor-pointer"
                />
              ) : (
                <span className="text-xs text-[#00cfff]/50 flex items-center gap-1 border border-[#00cfff]/20 px-2 py-1 rounded">
                  Basic+
                </span>
              )}
            </div>

            {config.isChallengeMode && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in mt-4 pt-4 border-t border-[#00cfff]/10">
                <div>
                  <label className="block text-[10px] font-extrabold text-[#00cfff]/70 mb-2 uppercase tracking-widest">
                    Profit Target (%)
                  </label>
                  <input
                    type="number"
                    value={config.challengeTargetPct}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        challengeTargetPct: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-lg text-white p-2 text-sm focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-[#00cfff]/70 mb-2 uppercase tracking-widest">
                    Max Drawdown (%)
                  </label>
                  <input
                    type="number"
                    value={config.challengeMaxDrawdownPct}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        challengeMaxDrawdownPct: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-lg text-white p-2 text-sm focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] outline-none transition-all font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trading Rules Toggle */}
          <div className="bg-[#030308]/50 p-5 rounded-xl border border-[#00cfff]/20 transition-all hover:border-[#00cfff]/40">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-extrabold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                Enable Discipline Rules
              </label>
              {planLevel >= 2 || isAdmin ? (
                <input
                  type="checkbox"
                  checked={config.enableRules}
                  onChange={(e) =>
                    setConfig({ ...config, enableRules: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#00cfff] rounded cursor-pointer"
                />
              ) : (
                <span className="text-xs text-[#00cfff]/50 flex items-center gap-1 border border-[#00cfff]/20 px-2 py-1 rounded">
                  Premium
                </span>
              )}
            </div>

            {config.enableRules && (
              <div className="space-y-4 animate-fade-in mt-4 pt-4 border-t border-[#00cfff]/10">
                <div>
                  <label className="block text-[10px] font-extrabold text-[#00cfff]/70 mb-2 uppercase tracking-widest">
                    Max Trades / Session
                  </label>
                  <input
                    type="number"
                    value={config.maxTradesPerDay}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxTradesPerDay: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-lg text-white p-2 text-sm focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-[#00cfff]/70 mb-2 uppercase tracking-widest">
                    Max Loss Limit ($)
                  </label>
                  <input
                    type="number"
                    value={config.maxDailyLoss}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxDailyLoss: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-lg text-white p-2 text-sm focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-[#00cfff]/70 mb-2 uppercase tracking-widest">
                    Max Consecutive Losses
                  </label>
                  <input
                    type="number"
                    value={config.maxConsecutiveLosses}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxConsecutiveLosses: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-lg text-white p-2 text-sm focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] outline-none transition-all font-mono"
                  />
                </div>
                <p className="text-[10px] text-yellow-400 font-bold tracking-wider mt-2 border border-yellow-500/30 bg-yellow-900/20 p-2 rounded">
                  ⚠️ Violation will lock trading for 30 mins.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#00cfff] hover:bg-[#00e5ff] text-[#030308] py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5"
          >
            START TRADING
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN: CONTROLS */}
      <div className="space-y-6">
        {/* Challenge Status Card */}
        {config.isChallengeMode && (
          <div
            className={`p-5 rounded-2xl border backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.2)] ${
              challengeState.status === "FAILED"
                ? "bg-red-900/10 border-red-500/40"
                : challengeState.status === "PASSED"
                ? "bg-green-900/10 border-green-500/40"
                : "bg-[#00cfff]/5 border-[#00cfff]/30"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
                <span className="text-lg">🏆</span> Challenge Status
              </h3>
              <span
                className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${
                  challengeState.status === "FAILED"
                    ? "bg-red-500/20 text-red-400 border-red-500/50"
                    : challengeState.status === "PASSED"
                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                    : "bg-[#00cfff]/20 text-[#00cfff] border-[#00cfff]/50"
                }`}
              >
                {challengeState.status}
              </span>
            </div>

            {challengeState.status === "ACTIVE" && (
              <div className="space-y-4">
                <div className="bg-[#030308]/50 p-3 rounded-xl border border-[#00cfff]/10">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#00cfff]/70 font-bold uppercase tracking-wider">
                      Target: $
                      {(
                        config.initialCapital *
                        (1 + config.challengeTargetPct / 100)
                      ).toLocaleString()}
                    </span>
                    <span className="text-green-400 font-mono font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                      {(
                        ((account.balance - config.initialCapital) /
                          ((config.initialCapital * config.challengeTargetPct) /
                            100)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-[#030308] rounded-full h-1.5 border border-[#00cfff]/20 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all duration-500 relative"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((account.balance - config.initialCapital) /
                              ((config.initialCapital *
                                config.challengeTargetPct) /
                                100)) *
                              100
                          )
                        )}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#030308]/50 p-3 rounded-xl border border-[#00cfff]/10">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#00cfff]/70 font-bold uppercase tracking-wider">
                      Max Loss Limit: $
                      {(
                        config.initialCapital *
                        (1 - config.challengeMaxDrawdownPct / 100)
                      ).toLocaleString()}
                    </span>
                    <span className="text-red-400 font-mono font-bold drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">
                      Dist: $
                      {(
                        account.equity -
                        config.initialCapital *
                          (1 - config.challengeMaxDrawdownPct / 100)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-[#030308] rounded-full h-1.5 border border-[#00cfff]/20 overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((config.initialCapital - account.equity) /
                              ((config.initialCapital *
                                config.challengeMaxDrawdownPct) /
                                100)) *
                              100
                          )
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {challengeState.reason && (
              <p className="mt-4 p-2 bg-[#030308]/50 rounded-lg text-xs text-center font-bold text-[#00cfff] uppercase tracking-widest border border-[#00cfff]/20">
                {challengeState.reason}
              </p>
            )}
          </div>
        )}

        {/* AI Trading Coach Widget */}
        <div className="col-span-1 bg-[#0a0f1c]/60 p-5 rounded-2xl border border-[#00cfff]/30 shadow-[0_0_15px_rgba(0,207,255,0.05)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00cfff]/5 to-transparent pointer-events-none"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
              <span className="text-[#00cfff] text-lg">🤖</span> AI Trading Coach
            </h3>
            {planLevel >= 2 || isAdmin ? (
              <button
                onClick={analyzeHealth}
                disabled={isAnalyzing || account.history.length < 2}
                className={`text-[10px] font-extrabold px-3 py-1.5 rounded uppercase tracking-wider transition-all ${
                  isAnalyzing || account.history.length < 2
                    ? "bg-transparent border border-[#00cfff]/30 text-[#00cfff]/50 cursor-not-allowed"
                    : "bg-[#00cfff]/20 text-[#00cfff] border border-[#00cfff]/50 hover:bg-[#00cfff]/30 hover:shadow-[0_0_10px_rgba(0,207,255,0.3)]"
                }`}
              >
                {isAnalyzing ? "ANALYZING..." : "ANALYZE"}
              </button>
            ) : (
              <span className="text-[10px] bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded font-bold uppercase">
                Premium
              </span>
            )}
          </div>

          {healthData ? (
            <div className="space-y-4 animate-fade-in relative z-10">
              <div className="bg-[#030308]/80 p-4 rounded-xl border border-[#00cfff]/20">
                <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-extrabold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{healthData.trading_identity}</span>
                  <p className="text-[9px] text-[#00cfff] uppercase font-extrabold tracking-widest border border-[#00cfff]/30 px-2 py-0.5 rounded-full">
                    Persona
                  </p>
                </div>
                <p className="text-xs text-gray-300 italic mb-3">
                  "{healthData.identity_insight}"
                </p>
                {healthData.ai_insight && (
                  <div className="p-3 bg-[#00cfff]/10 rounded-lg border border-[#00cfff]/30">
                    <p className="text-[11px] text-[#00cfff] font-medium leading-relaxed">
                      <span className="font-bold mr-1">🎯 AI Advice:</span> {healthData.ai_insight}
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-[#030308]/80 p-4 rounded-xl border border-[#00cfff]/20">
                <p className="text-[10px] text-[#00cfff] uppercase mb-3 font-extrabold tracking-widest">
                  Recommended Risk & Action
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    Risk: <span className="text-2xl font-mono text-[#00cfff]">{healthData.recommended_risk}%</span>
                  </span>
                  <span className={`px-3 py-1 text-xs font-extrabold rounded-full border uppercase tracking-wider ${
                    healthData.overall_score >= 70 ? 'bg-green-900/30 text-green-400 border-green-500/50' :
                    healthData.overall_score >= 50 ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50' :
                    'bg-red-900/30 text-red-400 border-red-500/50'
                  }`}>
                    Score: {healthData.overall_score}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {healthData.recommendation_reason}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#030308]/60 p-3 rounded-xl border border-[#00cfff]/10">
                  <div className="text-lg font-mono font-bold text-[#00cfff]">{healthData.risk_score}</div>
                  <div className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest mt-1">Risk</div>
                </div>

                <div className="bg-[#030308]/60 p-3 rounded-xl border border-[#00cfff]/10">
                  <div className="text-lg font-mono font-bold text-[#00cfff]">{healthData.emotional_score}</div>
                  <div className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest mt-1">Emotion</div>
                </div>
                <div className="bg-[#030308]/60 p-3 rounded-xl border border-[#00cfff]/10">
                  <div className="text-lg font-mono font-bold text-green-400">{healthData.system_score}</div>
                  <div className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest mt-1">System</div>
                </div>
              </div>
              <div className="text-[11px] text-gray-400 p-3 bg-[#030308]/80 rounded-xl border border-[#00cfff]/10 leading-relaxed">
                {healthData.summary}
              </div>
              {healthData.warnings.length > 0 && (
                <div className="space-y-2 bg-red-900/10 p-3 rounded-xl border border-red-500/30">
                  <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="text-base">⚠️</span> Warnings
                  </p>
                  {healthData.warnings.map((warning, idx) => (
                    <p key={idx} className="text-[11px] text-gray-300 ml-2">• {warning}</p>
                  ))}
                </div>
                )}
            </div>
          ) : (
            <div className="text-center py-6 text-[#00cfff]/40 text-xs font-bold uppercase tracking-widest border border-dashed border-[#00cfff]/20 rounded-xl bg-[#030308]/30">
              <span className="text-2xl block mb-2 opacity-50">🤖</span>
              <p>Complete 2 trades for AI analysis.</p>
            </div>
          )}
        </div>

        {/* Account Stats */}
        <div className="bg-[#0a0f1c]/60 p-6 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00cfff]/5 rounded-full blur-3xl"></div>
          <div className="flex justify-between items-end mb-2 relative z-10">
            <p className="text-xs font-extrabold text-[#00cfff]/70 uppercase tracking-widest">Equity</p>
            <span
              className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${
                account.equity >= account.balance
                  ? "bg-green-900/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.2)]"
                  : "bg-red-900/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(248,113,113,0.2)]"
              }`}
            >
              {(
                ((account.equity - account.balance) / account.balance) *
                100
              ).toFixed(2)}
              %
            </span>
          </div>
          <p className="text-4xl font-mono font-bold text-white mb-6 relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            ${account.equity.toFixed(2)}
          </p>

          <div className="grid grid-cols-2 gap-4 border-t border-[#00cfff]/10 pt-5 relative z-10">
            <div>
              <p className="text-[10px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest mb-1">Balance</p>
              <p className="text-sm font-mono text-gray-300">
                ${account.balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest mb-1">Open PnL</p>
              <p
                className={`text-sm font-mono font-bold ${
                  account.equity - account.balance >= 0
                    ? "text-green-400 drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]"
                    : "text-red-400 drop-shadow-[0_0_3px_rgba(248,113,113,0.5)]"
                }`}
              >
                ${(account.equity - account.balance).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Trading Controls */}
        <div className="bg-[#0a0f1c]/60 p-6 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-extrabold text-[#00cfff] uppercase tracking-widest bg-[#00cfff]/10 px-3 py-1.5 rounded-lg border border-[#00cfff]/30">
              {activeSymbol}
            </h3>
            <div className="text-right">
              <p className="text-2xl font-mono font-bold text-white drop-shadow-[0_0_5px_#00cfff]">
                {marketState.isLoading
                  ? "..."
                  : marketState.price > 0
                  ? marketState.price < 1
                    ? marketState.price.toFixed(8)
                    : marketState.price.toFixed(2)
                  : "Unavailable"}
              </p>
              <p className="text-[9px] font-extrabold text-[#00cfff]/50 uppercase tracking-widest">
                {marketState.isLoading ? "FETCHING..." : "LIVE PRICE"}
              </p>
            </div>
          </div>

          {/* Beginner Help Buttons */}
          <BeginnerHelpButtons
            onOpenGlossary={() => setShowGlossary(true)}
            onOpenChecklist={() => setShowChecklist(true)}
            onOpenTutorial={() => setShowTutorial(true)}
          />

          {/* Risk Calculator Button - Premium Feature */}
          {planLevel >= 2 || isAdmin ? (
            <button
              onClick={() => setShowRiskCalculator(true)}
              className="w-full bg-[#030308] border border-[#00cfff]/50 hover:border-[#00cfff] text-[#00cfff] text-xs font-extrabold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 mb-5 uppercase tracking-widest shadow-[0_0_10px_rgba(0,207,255,0.1)] hover:shadow-[0_0_20px_rgba(0,207,255,0.3)]"
            >
              <span className="text-lg">⚖️</span> Risk Calculator
            </button>
          ) : (
            <button
              onClick={() => showFlash("Upgrade to Premium Plan to unlock Risk Calculator!", "error")}
              className="w-full bg-[#030308]/50 border border-gray-700 text-gray-500 text-xs font-extrabold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all mb-5 uppercase tracking-widest cursor-not-allowed"
            >
              <span className="text-lg opacity-50">🔒</span> Risk Calculator
            </button>
          )}

          {/* Trade Setup Template Selector */}
          <QuickTemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            onApplyTemplate={handleApplyTemplate}
          />

          {/* Beginner Widgets Panel */}
          <BeginnerWidgetsPanel
            accountBalance={account.balance}
            stopLossPct={config.stopLossPct}
            takeProfitPct={config.takeProfitPct}
            currentPrice={marketState.price}
            tradeType="BUY"
            recentPnL={
              account.history.length > 0 ? account.history[0]?.finalPnL || 0 : 0
            }
            totalTrades={account.history.length}
            initialCapital={config.initialCapital}
            onApplyPositionSize={handleApplyPositionSize}
          />

          <div className="mb-5 mt-4">
            <label className="block text-[10px] font-extrabold text-[#00cfff]/70 mb-2 uppercase tracking-widest">
              Trade Amount ($)
            </label>
            <input
              type="number"
              value={config.tradeAmount}
              onChange={(e) =>
                setConfig({
                  ...config,
                  tradeAmount: parseFloat(e.target.value),
                })
              }
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[10px] font-extrabold text-[#00cfff]/70 mb-2 uppercase tracking-widest">
                SL (%)
              </label>
              <input
                type="number"
                value={config.stopLossPct}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    stopLossPct: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-[#00cfff]/70 mb-2 uppercase tracking-widest">
                TP (%)
              </label>
              <input
                type="number"
                value={config.takeProfitPct}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    takeProfitPct: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono transition-all"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[10px] font-extrabold text-[#00cfff]/70 mb-2 uppercase tracking-widest">
              Entry Note / Reason (optional)
            </label>
            <input
              type="text"
              value={config.tradeNote}
              onChange={(e) =>
                setConfig({ ...config, tradeNote: e.target.value })
              }
              placeholder="e.g. Breakout, RSI Divergence..."
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none text-sm transition-all placeholder-[#00cfff]/20"
            />
          </div>

          {/* Checklist indicator */}
          {!checklistConfirmed && (
            <div className="mb-5 p-3 bg-[#030308] border border-yellow-500/50 rounded-xl text-center shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-400">
                ⚠️ Complete checklist before trading
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleOpenPosition("BUY")}
              disabled={
                marketState.isLoading ||
                marketState.price <= 0 ||
                challengeState.status === "FAILED" ||
                challengeState.status === "PASSED"
              }
              className="bg-green-500 hover:bg-green-400 disabled:bg-gray-800 disabled:border-gray-700 disabled:text-gray-500 disabled:shadow-none border border-transparent text-[#030308] py-4 rounded-xl font-extrabold uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:-translate-y-0.5 active:transform active:scale-95 transition-all flex flex-col items-center"
            >
              <span className="text-lg mb-1">📈</span>
              <span>BUY / LONG</span>
              <span className="text-[9px] opacity-70 font-bold tracking-wider mt-1">
                Profit if price goes UP
              </span>
            </button>
            <button
              onClick={() => handleOpenPosition("SELL")}
              disabled={
                marketState.isLoading ||
                marketState.price <= 0 ||
                challengeState.status === "FAILED" ||
                challengeState.status === "PASSED"
              }
              className="bg-red-500 hover:bg-red-400 disabled:bg-gray-800 disabled:border-gray-700 disabled:text-gray-500 disabled:shadow-none border border-transparent text-[#030308] py-4 rounded-xl font-extrabold uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:-translate-y-0.5 active:transform active:scale-95 transition-all flex flex-col items-center"
            >
              <span className="text-lg mb-1">📉</span>
              <span>SELL / SHORT</span>
              <span className="text-[9px] opacity-70 font-bold tracking-wider mt-1">
                Profit if price goes DOWN
              </span>
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={resetSession}
            className="flex-1 py-3 text-xs font-extrabold uppercase tracking-widest text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-500/30 hover:bg-red-900/20 rounded-xl transition-all"
          >
            Reset Session
          </button>
          {planLevel >= 1 || isAdmin ? (
            <button
              onClick={downloadCSV}
              disabled={account.history.length === 0}
              className="flex-1 py-3 text-xs font-extrabold uppercase tracking-widest text-[#00cfff] border border-[#00cfff]/30 hover:bg-[#00cfff]/10 hover:shadow-[0_0_15px_rgba(0,207,255,0.2)] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          ) : (
            <button
              disabled
              className="flex-1 py-3 text-xs font-extrabold uppercase tracking-widest text-gray-600 border border-gray-700 rounded-xl cursor-not-allowed"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: POSITIONS & HISTORY */}
      <div className="lg:col-span-2 space-y-6">
        {/* Open Positions */}
        <div className="bg-[#0a0f1c]/60 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md overflow-hidden min-h-[200px]">
          <div className="p-4 border-b border-[#00cfff]/10 bg-[#030308]/80 flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-[#00cfff] uppercase tracking-widest flex items-center gap-2">
              <span className="text-lg">🎯</span> Open Positions
            </h3>
            <span className="text-xs font-bold bg-[#00cfff]/20 text-[#00cfff] px-3 py-1 rounded-full border border-[#00cfff]/30">
              {account.positions.length}
            </span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-[#00cfff]/10">
              <thead className="bg-[#030308]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
                    Entry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
                    Current
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
                    TP/SL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
                    PnL
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#00cfff]/70 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00cfff]/5">
                {account.positions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-10 text-center text-[#00cfff]/40 text-sm font-medium uppercase tracking-widest"
                    >
                      No open positions. Place a trade to start.
                    </td>
                  </tr>
                ) : (
                  account.positions.map((pos) => {
                    const currentPnL =
                      pos.type === "BUY"
                        ? ((marketState.price - pos.entryPrice) /
                            pos.entryPrice) *
                          pos.size
                        : (-(marketState.price - pos.entryPrice) /
                            pos.entryPrice) *
                          pos.size;

                    return (
                      <tr key={pos.id} className="hover:bg-[#00cfff]/5 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold tracking-wider border ${
                              pos.type === "BUY"
                                ? "bg-green-900/20 text-green-400 border-green-500/30"
                                : "bg-red-900/20 text-red-400 border-red-500/30"
                            }`}
                          >
                            {pos.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-300">
                          {pos.entryPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                          {marketState.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-400">
                          ${pos.size}
                        </td>
                        <td className="px-4 py-3 text-[10px] font-mono font-bold tracking-wider">
                          <div className="text-green-500 drop-shadow-[0_0_3px_rgba(74,222,128,0.3)]">
                            TP: {pos.tpPrice.toFixed(2)}
                          </div>
                          <div className="text-red-500 drop-shadow-[0_0_3px_rgba(248,113,113,0.3)] mt-0.5">
                            SL: {pos.slPrice.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 italic max-w-[150px] truncate">
                          {pos.note}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-mono font-bold ${
                            currentPnL >= 0 ? "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" : "text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]"
                          }`}
                        >
                          {currentPnL >= 0 ? "+" : ""}
                          {currentPnL.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => closePosition(pos.id)}
                            className="bg-[#030308] border border-[#00cfff]/30 hover:bg-[#00cfff] hover:border-[#00cfff] text-[#00cfff] hover:text-[#030308] font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded transition-all shadow-[0_0_10px_rgba(0,207,255,0.1)] hover:shadow-[0_0_15px_rgba(0,207,255,0.4)]"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trade History */}
        <TradeHistoryTable history={account.history} />
      </div>

      {/* Beginner Help Modals - Rendered at the bottom */}
      <TradingGlossary
        isOpen={showGlossary}
        onClose={() => setShowGlossary(false)}
      />
      <PreTradeChecklist
        isOpen={showChecklist}
        onClose={() => setShowChecklist(false)}
        onConfirm={handleChecklistConfirm}
      />
      <TutorialOverlay
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
      <RiskManagementCalculator
        isOpen={showRiskCalculator}
        onClose={() => setShowRiskCalculator(false)}
        onApplySettings={handleApplyRiskSettings}
        accountBalance={account.balance}
      />
    </div>
  );
};

export default ManualTradeSimulator;