import React from 'react';
import { Activity, Lock, ArrowRight } from 'lucide-react';

const BrokerIntegrations = () => {
  const brokers = [
    { name: "MetaTrader 5", type: "Forex & CFD", color: "from-orange-500 to-red-500", glow: "rgba(249,115,22,0.3)" },
    { name: "MetaTrader 4", type: "Forex & CFD", color: "from-blue-500 to-cyan-500", glow: "rgba(6,182,212,0.3)" },
    { name: "Interactive Brokers", type: "Multi-Asset", color: "from-red-600 to-red-800", glow: "rgba(220,38,38,0.3)" },
    { name: "TradeStation", type: "Stocks & Futures", color: "from-blue-600 to-indigo-600", glow: "rgba(79,70,229,0.3)" },
    { name: "Alpaca", type: "API Trading", color: "from-yellow-400 to-yellow-600", glow: "rgba(234,179,8,0.3)" },
    { name: "cTrader", type: "Forex & CFD", color: "from-green-500 to-emerald-700", glow: "rgba(16,185,129,0.3)" },
    { name: "OANDA", type: "Forex", color: "from-orange-600 to-orange-800", glow: "rgba(234,88,12,0.3)" },
    { name: "NinjaTrader", type: "Futures", color: "from-stone-500 to-stone-700", glow: "rgba(120,113,108,0.3)" }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative pb-12">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-[#00cfff]/5 rounded-[100%] blur-[100px] pointer-events-none"></div>

      {/* Header Section */}
      <div className="bg-engine-panel p-8 md:p-12 rounded-3xl border border-[#00cfff]/20 shadow-[0_0_50px_rgba(0,207,255,0.05)] backdrop-blur-engine relative overflow-hidden">
        {/* Cyberpunk decorative lines */}
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#00cfff]/10 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 border-l-2 border-b-2 border-[#00cfff]/30 opacity-50"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-purple-500/30 opacity-50"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00cfff]/10 border border-[#00cfff]/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00cfff] animate-pulse"></span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00cfff]">Coming Soon in v2.0</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-white uppercase tracking-tight mb-6 drop-shadow-md flex items-center gap-4">
            <Activity className="w-12 h-12 text-[#00cfff] drop-shadow-[0_0_10px_rgba(0,207,255,0.5)]" />
            Connect Your Broker
          </h1>
          
          <p className="text-gray-400 text-lg leading-relaxed font-medium mb-8">
            Seamlessly sync your live trading data, open positions, and account history directly into the Trade Income Planner. Eliminate manual entry and keep your journal 100% accurate.
          </p>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <Lock className="w-5 h-5 text-gray-500" />
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-3">
               <Activity className="w-5 h-5 text-gray-500" />
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Real-Time Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
        {brokers.map((broker, index) => (
          <div 
            key={index} 
            className="group bg-[#030308]/80 backdrop-blur-sm border border-engine-panel-border/40 hover:border-[#00cfff]/50 p-6 rounded-2xl transition-all duration-500 flex flex-col justify-between h-64 relative overflow-hidden"
            style={{ 
               boxShadow: `0 0 20px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Dynamic Glow Background on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${broker.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${broker.color} p-0.5 shadow-lg`}>
                   <div className="w-full h-full bg-[#030308] rounded-[10px] flex items-center justify-center font-extrabold text-white text-xl">
                      {broker.name.substring(0, 1)}
                   </div>
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest bg-gray-800/50 text-gray-400 px-2 py-1 rounded-md border border-gray-700">
                  {broker.type}
                </span>
              </div>
              
              <h3 className="text-xl font-extrabold text-white mb-1 group-hover:text-[#00cfff] transition-colors">{broker.name}</h3>
              <p className="text-xs text-gray-500 font-medium">Read-only connection</p>
            </div>

            <button 
              disabled
              className="relative z-10 w-full mt-6 flex items-center justify-between px-5 py-3 rounded-xl bg-engine-bg border border-engine-button-border/30 text-gray-500 text-[11px] font-extrabold uppercase tracking-widest cursor-not-allowed group-hover:border-gray-600/50 transition-all overflow-hidden"
            >
              <span>Coming Soon</span>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrokerIntegrations;
