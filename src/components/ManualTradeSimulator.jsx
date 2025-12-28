import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ManualTradeSimulator = ({ activeSymbol = "BINANCE:BTCUSDT" }) => {
  const [config, setConfig] = useState({
    initialCapital: 10000,
    tradeAmount: 1000, // Amount in USD to buy/sell
    stopLossPct: 1, // 1% stop loss default
    takeProfitPct: 2, // 2% take profit default
    isChallengeMode: false, // toggle for challenge mode
    challengeTargetPct: 10, // 10% target for challenge mode
    challengeMaxDrawdownPct: 10, // 10% max drawdown for challenge mode
    tradeNote: "", // optional note for each trade
  });

  const [marketState, setMarketState] = useState({
    price: 0,
    isLoading: true,
    lastUpdate: null
  });

  const [account, setAccount] = useState({
    balance: 10000,
    equity: 10000,
    positions: [], // { id, type, entryPrice, size, symbol, openTime, slPrice, tpPrice }
    history: []
  });

  const [challengeState, setChallengeState] = useState({
    status: 'IDLE', // IDLE, ACTIVE, WON, LOST
    startTime: null,
    endTime: null,
    reason: ''
  });

  const [isSessionActive, setIsSessionActive] = useState(false);
  const pollInterval = useRef(null);

  // Fetch Price Function
  const fetchPrice = async () => {
    try {
      // Encode symbol to handle special chars like ':'
      const encodedSymbol = encodeURIComponent(activeSymbol);
      const response = await axios.get(`http://127.0.0.1:8000/api/price/${encodedSymbol}`);
      
      if (response.data.status === 'success') {
        setMarketState(prev => ({
          price: response.data.price,
          isLoading: false,
          lastUpdate: new Date()
        }));
      }
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };

  // Start/Stop Polling when Session is Active
  useEffect(() => {
    if (isSessionActive) {
      fetchPrice(); // Initial fetch
      pollInterval.current = setInterval(fetchPrice, 5000); // Poll every 5 seconds
    } else {
      if (pollInterval.current) clearInterval(pollInterval.current);
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [isSessionActive, activeSymbol]);

  // Update Equity & Check TP/SL Logic
  useEffect(() => {
    if (account.positions.length > 0 && marketState.price > 0) {
      let totalFloatingPnL = 0;
      let positionsToClose = [];
      
      account.positions.forEach(pos => {
        let pnl = 0;
        const priceDiff = marketState.price - pos.entryPrice;
        // Calculate PnL based on position size and price movement percentage
        // Formula: (PriceDiff / EntryPrice) * TradeAmount
        if (pos.type === 'BUY') {
          pnl = (priceDiff / pos.entryPrice) * pos.size;
        } else {
          pnl = (-priceDiff / pos.entryPrice) * pos.size;
        }
        totalFloatingPnL += pnl;
        
        // Check Auto Close (TP/SL)
        if (pos.type === 'BUY') {
          if (marketState.price <= pos.slPrice) positionsToClose.push({ id: pos.id, reason: 'SL' });
          if (marketState.price >= pos.tpPrice) positionsToClose.push({ id: pos.id, reason: 'TP' });
        } else {
          // SELL
          if (marketState.price >= pos.slPrice) positionsToClose.push({ id: pos.id, reason: 'SL' });
          if (marketState.price <= pos.tpPrice) positionsToClose.push({ id: pos.id, reason: 'TP' });
        }
      });

      setAccount(prev => ({
        ...prev,
        equity: prev.balance + totalFloatingPnL,
      }));

      // challange mode logic
      if (config.isChallengeMode && challengeState.status === 'ACTIVE') {
        const maxDrawdownLimit = config.initialCapital * (1 - config.challengeMaxDrawdownPct / 100);
        const targetLimit = config.initialCapital * (1 + config.challengeTargetPct / 100);

        // check failure
        if (account.equity <= maxDrawdownLimit) {
          setChallengeState(prev => ({
            ...prev,
            status: 'FAILED',
            endTime: new Date(),
            reason: 'Max Drawdown Violated'
          }));
        }
        // check success
        else if (account.balance >= targetLimit) {
          setChallengeState(prev => ({
            ...prev,
            status: 'PASSED',
            endTime: new Date(),
            reason: 'Profit Target Reached'
          }));
        }
      }

      // Execute Auto Close
      if (positionsToClose.length > 0) {
        positionsToClose.forEach(item => {
          // Prevent duplicate closing calls if react renders multiple times quickly
          // We rely on the closePosition function to handle state update safely
          // Note: In a real app, use a ref to track processing IDs to avoid race conditions
          closePosition(item.id, item.reason);
        });
      }
    } else {
        setAccount(prev => ({ ...prev, equity: prev.balance }));
    }
  }, [marketState.price]);

  const startSession = (e) => {
    e.preventDefault();
    setAccount({
        balance: config.initialCapital,
        equity: config.initialCapital,
        positions: [],
        history: []
    });
    setIsSessionActive(true);

    if (config.isChallengeMode) {
      setChallengeState({
        status: 'ACTIVE',
        startTime: new Date(),
        endTime: null,
        reason: ''
      });
    } else {
      setChallengeState({ status: 'IDLE', startTime: null, endTime: null, reason: '' });
    }
  };

  const openPosition = (type) => {
    if (marketState.price === 0) return;

    // Calculate TP/SL Prices
    let slPrice, tpPrice;
    if (type === 'BUY') {
      slPrice = marketState.price * (1 - config.stopLossPct / 100);
      tpPrice = marketState.price * (1 + config.takeProfitPct / 100);
    } else {
      slPrice = marketState.price * (1 + config.stopLossPct / 100);
      tpPrice = marketState.price * (1 - config.takeProfitPct / 100);
    }
    
    const newPosition = {
      id: Date.now(),
      type,
      entryPrice: marketState.price,
      size: config.tradeAmount,
      symbol: activeSymbol,
      openTime: new Date(),
      slPrice,
      tpPrice,
      note: config.tradeNote || "-" // save note
    };

    setAccount(prev => ({
      ...prev,
      positions: [newPosition, ...prev.positions]
    }));
    setConfig(prev => ({ ...prev, tradeNote: '' })); // clear note after trade
  };

  const closePosition = (id, reason = 'MANUAL') => {
    const position = account.positions.find(p => p.id === id);
    if (!position) return;

    let pnl = 0;
    const priceDiff = marketState.price - position.entryPrice;
    if (position.type === 'BUY') {
      pnl = (priceDiff / position.entryPrice) * position.size;
    } else {
      pnl = (-priceDiff / position.entryPrice) * position.size;
    }

    const historyItem = {
      ...position,
      exitPrice: marketState.price,
      closeTime: new Date(),
      finalPnL: pnl,
      reason: reason // 'MANUAL', 'TP', 'SL'
    };

    setAccount(prev => ({
      ...prev,
      balance: prev.balance + pnl,
      equity: prev.balance + pnl, // Equity resets to balance after close
      positions: prev.positions.filter(p => p.id !== id),
      history: [historyItem, ...prev.history]
    }));
  };

  const downloadCSV = () => {
    if (!account.history || account.history.length === 0) return;

    const headers = ["ID", "Symbol", "Type", "Entry Price", "Exit Price", "Size", "PnL", "Reason", "Note", "Time"];
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
          `"${trade.note}"`, // Quote note to handle commas
          trade.closeTime.toLocaleString()
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `trade_history_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isSessionActive) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg max-w-md mx-auto mt-10 text-center">
        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wider">
          Live Market Simulator
        </h2>
        <p className="text-gray-400 mb-8 text-sm">
          Trade {activeSymbol} with real-time market data without risking real money.
        </p>
        <form onSubmit={startSession} className="space-y-6 text-left">
            <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Initial Capital ($)</label>
                <input
                    type="number"
                    value={config.initialCapital}
                    onChange={(e) => setConfig({...config, initialCapital: parseFloat(e.target.value)})}
                    className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                    required
                />
            </div>

            {/* Challenge Mode Toggle */}
            <div className="bg-gray-900 p-4 rounded border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-bold text-gray-300 uppercase">Enable Prop Firm Challenge</label>
                <input 
                  type="checkbox" 
                  checked={config.isChallengeMode} 
                  onChange={(e) => setConfig({...config, isChallengeMode: e.target.checked})}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              
              {config.isChallengeMode && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Profit Target (%)</label>
                      <input
                          type="number"
                          value={config.challengeTargetPct}
                          onChange={(e) => setConfig({...config, challengeTargetPct: parseFloat(e.target.value)})}
                          className="w-full bg-gray-800 border border-gray-600 rounded text-white p-2 text-sm"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Max Drawdown (%)</label>
                      <input
                          type="number"
                          value={config.challengeMaxDrawdownPct}
                          onChange={(e) => setConfig({...config, challengeMaxDrawdownPct: parseFloat(e.target.value)})}
                          className="w-full bg-gray-800 border border-gray-600 rounded text-white p-2 text-sm"
                      />
                   </div>
                </div>
              )}
            </div>

            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded font-bold uppercase tracking-wider transition duration-200 shadow-lg"
            >
                Start Trading
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
              <div className={`p-4 rounded-lg border ${
                challengeState.status === 'FAILED' ? 'bg-red-900/20 border-red-500' :
                challengeState.status === 'PASSED' ? 'bg-green-900/20 border-green-500' :
                'bg-blue-900/20 border-blue-500'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Challenge Status</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                     challengeState.status === 'FAILED' ? 'bg-red-600 text-white' :
                     challengeState.status === 'PASSED' ? 'bg-green-600 text-white' :
                     'bg-blue-600 text-white'
                  }`}>
                    {challengeState.status}
                  </span>
                </div>
                
                {challengeState.status === 'ACTIVE' && (
                  <div className="space-y-3 mt-3">
                    {/* Target Progress */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Target: ${ (config.initialCapital * (1 + config.challengeTargetPct/100)).toLocaleString() }</span>
                        <span className="text-green-400">{ ((account.balance - config.initialCapital) / (config.initialCapital * config.challengeTargetPct/100) * 100).toFixed(1) }%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, ((account.balance - config.initialCapital) / (config.initialCapital * config.challengeTargetPct/100) * 100)))}%` }}></div>
                      </div>
                    </div>

                    {/* Drawdown Limit */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Max Loss Limit: ${ (config.initialCapital * (1 - config.challengeMaxDrawdownPct/100)).toLocaleString() }</span>
                        <span className="text-red-400">Dist: ${ (account.equity - (config.initialCapital * (1 - config.challengeMaxDrawdownPct/100))).toLocaleString() }</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, (config.initialCapital - account.equity) / (config.initialCapital * config.challengeMaxDrawdownPct/100) * 100))}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
                {challengeState.reason && (
                  <p className="mt-2 text-xs text-center font-bold uppercase tracking-wide opacity-80">{challengeState.reason}</p>
                )}
              </div>
            )}

            {/* Account Stats */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-end mb-2">
                    <p className="text-xs text-gray-400 uppercase">Equity</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${account.equity >= account.balance ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                        {((account.equity - account.balance) / account.balance * 100).toFixed(2)}%
                    </span>
                </div>
                <p className="text-3xl font-mono font-bold text-white mb-4">${account.equity.toFixed(2)}</p>
                
                <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Balance</p>
                        <p className="text-sm font-mono text-gray-300">${account.balance.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Open PnL</p>
                        <p className={`text-sm font-mono font-bold ${account.equity - account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${(account.equity - account.balance).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Trading Controls */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-gray-300 uppercase">{activeSymbol}</h3>
                    <div className="text-right">
                        <p className="text-2xl font-mono font-bold text-white">
                            {marketState.isLoading ? "..." : marketState.price.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-500">
                            {marketState.isLoading ? "Fetching..." : "Live Price"}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Trade Amount ($)</label>
                    <input
                        type="number"
                        value={config.tradeAmount}
                        onChange={(e) => setConfig({...config, tradeAmount: parseFloat(e.target.value)})}
                        className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">SL (%)</label>
                    <input
                        type="number"
                        value={config.stopLossPct}
                        onChange={(e) => setConfig({...config, stopLossPct: parseFloat(e.target.value)})}
                        className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">TP (%)</label>
                        <input
                            type="number"
                            value={config.takeProfitPct}
                            onChange={(e) => setConfig({...config, takeProfitPct: parseFloat(e.target.value)})}
                            className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Entry Note / Reason (optional)</label>
                    <input
                        type="text"
                        value={config.tradeNote}
                        onChange={(e) => setConfig({...config, tradeNote: e.target.value})}
                        placeholder="e.g. Breakout, RSI Divergence..."
                        className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => openPosition('BUY')}
                        disabled={marketState.isLoading || challengeState.status === 'FAILED' || challengeState.status === 'PASSED'}
                        className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white py-4 rounded-lg font-bold uppercase tracking-wider shadow-lg active:transform active:scale-95 transition-all flex flex-col items-center"
                    >
                        <span>BUY / LONG</span>
                        <span className="text-[10px] opacity-70 font-normal">Profit if price goes UP</span>
                    </button>
                    <button
                        onClick={() => openPosition('SELL')}
                        disabled={marketState.isLoading || challengeState.status === 'FAILED' || challengeState.status === 'PASSED'}
                        className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white py-4 rounded-lg font-bold uppercase tracking-wider shadow-lg active:transform active:scale-95 transition-all flex flex-col items-center"
                    >
                        <span>SELL / SHORT</span>
                        <span className="text-[10px] opacity-70 font-normal">Profit if price goes DOWN</span>
                    </button>
                </div>
            </div>
            
            <div className="flex gap-4">
                <button 
                    onClick={() => setIsSessionActive(false)}
                    className="flex-1 py-2 text-xs text-gray-500 hover:text-white border border-gray-700 hover:bg-gray-700 rounded transition-colors"
                >
                    Reset Session
                </button>
                <button 
                    onClick={downloadCSV}
                    disabled={account.history.length === 0}
                    className="flex-1 py-2 text-xs font-bold text-blue-400 hover:text-white border border-blue-900 hover:bg-blue-900/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Export CSV
                </button>
            </div>
        </div>

        {/* RIGHT COLUMN: POSITIONS & HISTORY */}
        <div className="lg:col-span-2 space-y-6">
            {/* Open Positions */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden min-h-[200px]">
                <div className="p-3 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-400 uppercase">Open Positions</h3>
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 rounded-full">{account.positions.length}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entry</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">TP/SL</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PnL</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {account.positions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500 text-sm">
                                        No open positions. Place a trade to start.
                                    </td>
                                </tr>
                            ) : (
                                account.positions.map((pos) => {
                                    const currentPnL = pos.type === 'BUY' 
                                        ? ((marketState.price - pos.entryPrice) / pos.entryPrice) * pos.size
                                        : (-(marketState.price - pos.entryPrice) / pos.entryPrice) * pos.size;
                                    
                                    return (
                                        <tr key={pos.id} className="hover:bg-gray-700/30">
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${pos.type === 'BUY' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                    {pos.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono text-gray-300">{pos.entryPrice.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm font-mono text-white">{marketState.price.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm font-mono text-gray-400">${pos.size}</td>
                                            <td className="px-4 py-3 text-[10px] font-mono text-gray-500">
                                                <div className="text-green-500">TP: {pos.tpPrice.toFixed(2)}</div>
                                                <div className="text-red-500">SL: {pos.slPrice.toFixed(2)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-400 italic max-w-[150px] truncate">
                                                {pos.note}
                                            </td>
                                            <td className={`px-4 py-3 text-sm font-mono font-bold ${currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {currentPnL >= 0 ? '+' : ''}{currentPnL.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    onClick={() => closePosition(pos.id)}
                                                    className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded transition-colors"
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
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="p-3 border-b border-gray-700 bg-gray-900">
                    <h3 className="text-xs font-bold text-gray-400 uppercase">Trade History</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entry</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Exit</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PnL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {account.history.map((trade) => (
                                <tr key={trade.id} className="hover:bg-gray-700/30">
                                    <td className="px-4 py-2">
                                        <span className={`text-xs font-bold ${trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                                            {trade.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs font-mono text-gray-400">{trade.entryPrice.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-xs font-mono text-gray-400">{trade.exitPrice.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-xs">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.reason === 'TP' ? 'bg-green-900 text-green-400' : trade.reason === 'SL' ? 'bg-red-900 text-red-400' : 'bg-gray-700 text-gray-300'}`}>
                                            {trade.reason}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs text-gray-400 italic max-w-[150px] truncate">
                                        {trade.note}
                                    </td>
                                    <td className={`px-4 py-2 text-xs font-mono font-bold ${trade.finalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {trade.finalPnL >= 0 ? '+' : ''}{trade.finalPnL.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ManualTradeSimulator;
