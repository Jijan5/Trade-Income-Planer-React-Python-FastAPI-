import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ManualTradeSimulator = () => {
  const [config, setConfig] = useState({
    initialCapital: 10000,
    riskType: 'percent', // 'percent' or 'fixed'
    riskValue: 1, // 1% or $1
    riskReward: 2,
  });

  const [tradingState, setTradingState] = useState({
    isStarted: false,
    currentBalance: 10000,
    history: [], // { id, type: 'WIN'|'LOSS', pnl, balance }
    chartData: [], // { trade: 0, balance: 10000 }
  });

  const startTrading = (e) => {
    e.preventDefault();
    setTradingState({
      isStarted: true,
      currentBalance: config.initialCapital,
      history: [],
      chartData: [{ trade: 0, balance: config.initialCapital }],
    });
  };

  const executeTrade = (outcome) => {
    const { currentBalance } = tradingState;
    const { riskType, riskValue, riskReward } = config;

    let riskAmount = 0;
    if (riskType === 'percent') {
      riskAmount = currentBalance * (riskValue / 100);
    } else {
      riskAmount = parseFloat(riskValue);
    }

    let pnl = 0;
    if (outcome === 'WIN') {
      pnl = riskAmount * riskReward;
    } else {
      pnl = -riskAmount;
    }

    const newBalance = currentBalance + pnl;
    const newTrade = {
      id: tradingState.history.length + 1,
      type: outcome,
      pnl: pnl,
      balance: newBalance,
    };

    setTradingState(prev => ({
      ...prev,
      currentBalance: newBalance,
      history: [newTrade, ...prev.history],
      chartData: [...prev.chartData, { trade: prev.history.length + 1, balance: newBalance }]
    }));
  };

  const resetTrading = () => {
     setTradingState({
      isStarted: true, // Keep started, just reset data
      currentBalance: config.initialCapital,
      history: [],
      chartData: [{ trade: 0, balance: config.initialCapital }],
    });
  };

  const changeCapital = () => {
    setTradingState(prev => ({ ...prev, isStarted: false }));
  };

  if (!tradingState.isStarted) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg max-w-2xl mx-auto mt-10">
        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider border-b border-gray-700 pb-4">
          Manual Trading Simulator
        </h2>
        <form onSubmit={startTrading} className="space-y-6">
            {/* Input for Initial Capital */}
            <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Initial Capital ($)</label>
                <input
                    type="number"
                    value={config.initialCapital}
                    onChange={(e) => setConfig({...config, initialCapital: parseFloat(e.target.value)})}
                    className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                    required
                />
            </div>
            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded font-bold uppercase tracking-wider transition duration-200"
            >
                Start Trading Session
            </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 uppercase">Current Balance</p>
                <p className="text-2xl font-mono font-bold text-white">${tradingState.currentBalance.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 uppercase">Total PnL</p>
                <p className={`text-2xl font-mono font-bold ${tradingState.currentBalance >= config.initialCapital ? 'text-green-400' : 'text-red-400'}`}>
                    {tradingState.currentBalance >= config.initialCapital ? '+' : ''}
                    ${(tradingState.currentBalance - config.initialCapital).toFixed(2)}
                </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col justify-center gap-2">
                 <button onClick={resetTrading} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded text-xs font-bold uppercase transition-colors">
                    Reset Session (Keep Capital)
                 </button>
                 <button onClick={changeCapital} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded text-xs font-bold uppercase transition-colors">
                    Change Capital
                 </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6 h-fit">
                <h3 className="text-sm font-bold text-gray-300 uppercase border-b border-gray-700 pb-2">Trade Settings</h3>
                
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Risk Type</label>
                    <div className="flex bg-gray-900 p-1 rounded border border-gray-600">
                        {['percent', 'fixed'].map(type => (
                            <button
                                key={type}
                                onClick={() => setConfig({...config, riskType: type})}
                                className={`flex-1 py-1 text-xs font-bold uppercase rounded transition-colors ${config.riskType === type ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
                        Risk Value ({config.riskType === 'percent' ? '%' : '$'})
                    </label>
                    <input
                        type="number"
                        value={config.riskValue}
                        onChange={(e) => setConfig({...config, riskValue: parseFloat(e.target.value)})}
                        className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Risk : Reward</label>
                    <input
                        type="number"
                        value={config.riskReward}
                        onChange={(e) => setConfig({...config, riskReward: parseFloat(e.target.value)})}
                        className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={() => executeTrade('WIN')}
                        className="bg-green-600 hover:bg-green-500 text-white py-4 rounded-lg font-bold uppercase tracking-wider shadow-lg active:transform active:scale-95 transition-all"
                    >
                        WIN
                    </button>
                    <button
                        onClick={() => executeTrade('LOSS')}
                        className="bg-red-600 hover:bg-red-500 text-white py-4 rounded-lg font-bold uppercase tracking-wider shadow-lg active:transform active:scale-95 transition-all"
                    >
                        LOSS
                    </button>
                </div>
            </div>

            {/* Chart & History */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={tradingState.chartData}>
                            <defs>
                                <linearGradient id="colorBalanceManual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="trade" stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 10}} />
                            <YAxis domain={['auto', 'auto']} stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 10}} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                formatter={(value) => [`$${value.toFixed(2)}`, 'Balance']}
                                labelFormatter={(label) => `Trade #${label}`}
                            />
                            <Area type="monotone" dataKey="balance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBalanceManual)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="p-3 border-b border-gray-700 bg-gray-900">
                        <h3 className="text-xs font-bold text-gray-400 uppercase">Recent Trades</h3>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-900 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Result</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">PnL</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {tradingState.history.map((trade) => (
                                    <tr key={trade.id} className="hover:bg-gray-700/50">
                                        <td className="px-4 py-2 text-xs text-gray-500">{trade.id}</td>
                                        <td className="px-4 py-2 text-xs">
                                            <span className={`px-2 py-0.5 rounded font-bold ${trade.type === 'WIN' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                                {trade.type}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-2 text-xs font-mono font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-xs font-mono text-gray-300">${trade.balance.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ManualTradeSimulator;
