import React, { useState, useRef, useEffect, useCallback } from "react";
import api from "../lib/axios";

import { useAuth } from "../contexts/AuthContext";

const ChatAssistant = () => {
  const { userData } = useAuth();
  const [trades, setTrades] = useState([]);



  const [isOpen, setIsOpen] = useState(false);
  const [showMarketPanel, setShowMarketPanel] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am Tip, your AI Trading Mentor. Ask me about market trends, trading strategies, or crypto analysis! 📈\n\n💡 Quick actions: Analyze trades or upload charts!",
    },
  ]);
  const [input, setInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const messagesEndRef = useRef(null);

  const recentTrades = trades.slice(-20); // Last 20 trades
  const hasTrades = recentTrades.length > 0;

  const createTradesSummary = useCallback(() => {
    if (!hasTrades) return null;
    const wins = recentTrades.filter((t) => t.finalPnL > 0);
    const losses = recentTrades.filter((t) => t.finalPnL <= 0);
    const totalPnl = recentTrades.reduce((sum, t) => sum + t.finalPnL, 0);
    const winRate = ((wins.length / recentTrades.length) * 100).toFixed(1);

    return {
      total_trades: recentTrades.length,
      total_pnl: totalPnl.toFixed(2),
      win_rate: `${winRate}%`,
      avg_win: wins.length
        ? (wins.reduce((sum, t) => sum + t.finalPnL, 0) / wins.length).toFixed(
            2
          )
        : 0,
      avg_loss: losses.length
        ? Math.abs(
            losses.reduce((sum, t) => sum + t.finalPnL, 0) / losses.length
          ).toFixed(2)
        : 0,
      recent: recentTrades.slice(0, 5).map((t) => ({
        symbol: t.symbol,
        pnl: t.finalPnL.toFixed(2),
        reason: t.reason || "Manual",
      })),
    };
  }, [recentTrades, hasTrades]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Fetch market data when panel opens
  // Fetch trades
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await api.get("/manual-trades");
        setTrades(res.data || []);
      } catch (error) {
        console.error("Failed to fetch trades for chat:", error);
      }
    };
    fetchTrades();
  }, []);

  useEffect(() => {
    if (showMarketPanel && marketData.length === 0) {
      fetchMarketData();
    }
  }, [showMarketPanel]);

  const fetchMarketData = async () => {
    setLoadingMarket(true);
    try {
      const response = await api.get(
        "/market-data?symbols=BTC,ETH,BNB,SOL,XRP"
      );
      setMarketData(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch market data", err);
    } finally {
      setLoadingMarket(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const payload = {
      message: input,
      trades_summary: createTradesSummary(),
      user_context: userData
        ? {
            username: userData.username,
            plan: userData.plan || "free",
          }
        : null,
    };

    try {
      const response = await api.post("/chat", payload);
      const aiMessage = { role: "assistant", content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I am having trouble responding. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick market analysis questions
  const quickQuestions = [
    "What's the BTC trend?",
    "Is ETH bullish?",
    "Market analysis",
    "Best crypto to trade?",
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Market Data Panel */}
      {isOpen && showMarketPanel && (
        <div className="bg-[#0a0f1c]/95 backdrop-blur-md border border-[#00cfff]/30 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.15)] w-80 sm:w-96 h-[400px] flex flex-col mb-4 overflow-hidden animate-fade-in z-50">
          {/* Header */}
          <div className="bg-[#030308] p-4 border-b border-[#00cfff]/20 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 bg-[#030308] border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)] rounded-full flex items-center justify-center text-green-400 font-bold text-xs">
                📈
              </div>
              <div>
                <h3 className="font-extrabold text-white text-[11px] uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Market Trends</h3>
                <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest mt-0.5">Live from Binance</p>
              </div>
            </div>
            <div className="flex gap-2 relative z-10">
              <button
                onClick={fetchMarketData}
                disabled={loadingMarket}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 ${loadingMarket ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowMarketPanel(false)}
                className="text-[#00cfff]/50 hover:text-[#00cfff] hover:drop-shadow-[0_0_5px_#00cfff] transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Market Data */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#0a0f1c]/50 custom-scrollbar">
            {loadingMarket ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                 <div className="w-6 h-6 border-2 border-[#00cfff]/30 border-t-[#00cfff] rounded-full animate-spin"></div>
                 <div className="text-[#00cfff]/50 text-[10px] font-extrabold uppercase tracking-widest">Loading market data...</div>
              </div>
            ) : marketData.length > 0 ? (
              <div className="space-y-3">
                {marketData.map((coin, idx) => (
                  <div
                    key={idx}
                    className="bg-[#030308]/80 p-4 rounded-xl border border-[#00cfff]/10 hover:border-[#00cfff]/30 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex justify-between items-center mb-3 border-b border-[#00cfff]/10 pb-2">
                      <span className="font-extrabold text-white text-[11px] uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                        {coin.symbol}/USDT
                      </span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          coin.change_24h >= 0
                            ? "text-green-400 drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]"
                            : "text-red-400 drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]"
                        }`}
                      >
                        {coin.change_24h >= 0 ? "📈" : "📉"}{" "}
                        {coin.change_24h >= 0 ? "+" : ""}
                        {coin.change_24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-widest mb-1">
                      <span className="text-[#00cfff]/50">Price:</span>
                      <span className="text-white font-mono text-xs drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">
                        $
                        {coin.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-widest mb-1">
                      <span className="text-[#00cfff]/50">24h High:</span>
                      <span className="text-green-400 font-mono text-xs">
                        $
                        {coin.high_24h.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-widest">
                      <span className="text-[#00cfff]/50">24h Low:</span>
                      <span className="text-red-400 font-mono text-xs">
                        $
                        {coin.low_24h.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#00cfff]/10">
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                          coin.trend.includes("Bullish")
                            ? "bg-green-900/20 text-green-400 border-green-500/30 shadow-[0_0_5px_rgba(74,222,128,0.2)]"
                            : coin.trend.includes("Bearish")
                            ? "bg-red-900/20 text-red-400 border-red-500/30 shadow-[0_0_5px_rgba(239,68,68,0.2)]"
                            : "bg-[#030308] text-[#00cfff]/70 border-[#00cfff]/20"
                        }`}
                      >
                        {coin.trend.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[#00cfff]/50 text-[10px] font-extrabold uppercase tracking-widest">
                No market data available
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div className="p-4 bg-[#030308] border-t border-[#00cfff]/20">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#00cfff]/50 mb-3">QUICK QUESTIONS:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q)}
                  className="text-[9px] font-extrabold uppercase tracking-wider bg-[#00cfff]/10 hover:bg-[#00cfff]/20 border border-[#00cfff]/30 hover:border-[#00cfff]/50 text-[#00cfff] hover:text-[#00e5ff] px-3 py-1.5 rounded-lg transition-all shadow-[0_0_5px_rgba(0,207,255,0.1)] hover:shadow-[0_0_10px_rgba(0,207,255,0.3)]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-[#0a0f1c]/95 backdrop-blur-md border border-[#00cfff]/30 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.15)] w-80 sm:w-96 h-[500px] flex flex-col mb-4 overflow-hidden animate-fade-in z-50 relative">
          {/* Header */}
          <div className="bg-[#030308] p-4 border-b border-[#00cfff]/20 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00cfff]/10 to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full absolute bottom-0 right-0 border border-[#030308] shadow-[0_0_5px_rgba(74,222,128,0.5)]"></div>
                <div className="w-8 h-8 bg-[#00cfff]/20 border border-[#00cfff]/50 rounded-full flex items-center justify-center text-[#00cfff] font-extrabold text-[10px] shadow-[0_0_10px_rgba(0,207,255,0.3)]">
                  TIP
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-white text-[11px] uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                  Tip (Trading Mentor)
                </h3>
                <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest mt-0.5">
                  AI Powered • Online
                </p>
              </div>
            </div>
            <div className="flex gap-3 relative z-10">
              {/* Market Trends Button */}
              <button
                onClick={() => setShowMarketPanel(!showMarketPanel)}
                className={`p-2 rounded-lg transition-all border ${
                  showMarketPanel
                    ? "bg-green-900/40 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.2)]"
                    : "bg-[#030308] border-[#00cfff]/30 text-[#00cfff]/70 hover:bg-[#00cfff]/10 hover:text-[#00cfff] hover:border-[#00cfff]/50"
                }`}
                title="View Market Trends"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#00cfff]/50 hover:text-[#00cfff] hover:drop-shadow-[0_0_5px_#00cfff] transition-all p-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0f1c]/50 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-[11px] leading-relaxed shadow-sm font-medium ${
                    msg.role === "user"
                      ? "bg-[#00cfff]/10 border border-[#00cfff]/30 text-white rounded-br-none shadow-[0_0_10px_rgba(0,207,255,0.1)]"
                      : "bg-[#030308]/80 text-gray-200 rounded-bl-none border border-[#00cfff]/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#030308]/80 border border-[#00cfff]/20 p-4 rounded-2xl rounded-bl-none flex gap-2 items-center h-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                  <div className="w-1.5 h-1.5 bg-[#00cfff] rounded-full animate-pulse shadow-[0_0_5px_#00cfff]"></div>
                  <div className="w-1.5 h-1.5 bg-[#00cfff] rounded-full animate-pulse delay-75 shadow-[0_0_5px_#00cfff]"></div>
                  <div className="w-1.5 h-1.5 bg-[#00cfff] rounded-full animate-pulse delay-150 shadow-[0_0_5px_#00cfff]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-[#030308] border-t border-[#00cfff]/20 flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ASK ABOUT MARKET TRENDS..."
              className="flex-1 bg-[#0a0f1c] text-white text-[11px] font-mono rounded-xl px-4 py-3 focus:outline-none border border-[#00cfff]/30 focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] placeholder-[#00cfff]/30 uppercase tracking-wider transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#00cfff] hover:bg-[#00e5ff] disabled:bg-[#030308] disabled:border disabled:border-[#00cfff]/30 disabled:text-[#00cfff]/30 disabled:shadow-none text-[#030308] p-3 rounded-xl transition-all flex items-center justify-center w-12 shadow-[0_0_10px_rgba(0,207,255,0.4)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transform rotate-90"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen 
            ? "bg-[#030308] border border-[#00cfff]/50 text-[#00cfff] rotate-90 hover:bg-[#00cfff]/10" 
            : "bg-[#00cfff] text-[#030308] hover:bg-[#00e5ff] shadow-[0_0_20px_rgba(0,207,255,0.5)]"
        } p-4 rounded-full transition-all duration-300 flex items-center justify-center group hover:scale-105 z-50`}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 drop-shadow-[0_0_5px_#00cfff]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#030308] border border-red-500 shadow-[0_0_5px_rgba(239,68,68,1)]"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatAssistant;
