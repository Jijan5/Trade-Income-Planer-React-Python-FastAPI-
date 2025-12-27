import React, { useState } from "react";
import axios from "axios";
import SimulationForm from "./components/SimulationForm";
import ResultsDashboard from "./components/ResultsDashboard";
import TradingViewWidget from "./components/TradingViewWidget";
import GoalPlanner from "./components/GoalPlanner";
import ManualTradeSimulator from "./components/ManualTradeSimulator";

function App() {
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSymbol, setActiveSymbol] = useState("BINANCE:BTCUSDT");
  const [activeCategory, setActiveCategory] = useState("Crypto");
  const [activeView, setActiveView] = useState("simulator");

  const assetCategories = {
    "Saham (Stock)": [
      { label: "ANTM", symbol: "IDX:ANTM" },
      { label: "BBRI", symbol: "IDX:BBRI" },
      { label: "TLKM", symbol: "IDX:TLKM" },
      { label: "TSLA", symbol: "NASDAQ:TSLA" },
      { label: "NVDA", symbol: "NASDAQ:NVDA" },
      { label: "AAPL", symbol: "NASDAQ:AAPL" },
      { label: "META", symbol: "NASDAQ:META" },
      { label: "AMZN", symbol: "NASDAQ:AMZN" },
      { label: "MSFT", symbol: "NASDAQ:MSFT" },
      { label: "NFLX", symbol: "NASDAQ:NFLX" },
      { label: "GOOGL", symbol: "NASDAQ:GOOGL" },
      { label: "GOOG", symbol: "NASDAQ:GOOG" },
      { label: "INTC", symbol: "NASDAQ:INTC" },
      { label: "BABA", symbol: "NYSE:BABA" },
    ],
    Funds: [
      { label: "SPY", symbol: "AMEX:SPY" },
      { label: "QQQ", symbol: "NASDAQ:QQQ" },
      { label: "IWM", symbol: "AMEX:IWM" },
      { label: "SLV", symbol: "AMEX:SLV" },
      { label: "GLD", symbol: "AMEX:GLD" },
      { label: "IBIT", symbol: "NASDAQ:IBIT" },
    ],
    Forex: [
      { label: "EURUSD", symbol: "FX:EURUSD" },
      { label: "GBPUSD", symbol: "FX:GBPUSD" },
      { label: "USDJPY", symbol: "FX:USDJPY" },
      { label: "USDCAD", symbol: "FX:USDCAD" },
      { label: "AUDUSD", symbol: "FX:AUDUSD" },
      { label: "EURJPY", symbol: "FX:EURJPY" },
    ],
    Futures: [
      { label: "USOIL", symbol: "TVC:USOIL" },
      { label: "UKOIL", symbol: "TVC:UKOIL" },
      { label: "GOLD", symbol: "COMEX:GC1!" },
      { label: "NQ", symbol: "CME_MINI:NQ1!" },
      { label: "ES", symbol: "CME_MINI:ES1!" },
      { label: "GC", symbol: "COMEX:GC1!" },
      { label: "SI", symbol: "COMEX:SI1!" },
      { label: "BTC", symbol: "CME:BTC1!" },
      { label: "SILVER", symbol: "COMEX:SI1!" },
    ],
    Crypto: [
      { label: "BTCUSD", symbol: "COINBASE:BTCUSD" },
      { label: "BTCUSDT", symbol: "BINANCE:BTCUSDT" },
      { label: "ETHUSD", symbol: "COINBASE:ETHUSD" },
      { label: "ETHUSDT", symbol: "BINANCE:ETHUSDT" },
      { label: "SOLUSD", symbol: "COINBASE:SOLUSD" },
      { label: "USDT.D", symbol: "CRYPTOCAP:USDT.D" },
    ],
    Indices: [
      { label: "SPX", symbol: "SP:SPX" },
      { label: "NIFTY", symbol: "NSE:NIFTY" },
      { label: "DXY", symbol: "TVC:DXY" },
      { label: "VIX", symbol: "TVC:VIX" },
      { label: "BANKNIFTY", symbol: "NSE:BANKNIFTY" },
    ],
  };

  const handleSimulate = async (params) => {
    setLoading(true);
    setError(null);
    try {
      // Pastikan backend berjalan di port 8000
      const response = await axios.post(
        "http://localhost:8000/api/simulate",
        params
      );
      setSimulationData(response.data);
    } catch (err) {
      console.error("Simulation Error:", err);
      setError("Gagal menghubungi server. Pastikan backend Python berjalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans w-full">
      {/* Override default Vite styles that constrain width */}
      <style>{`
        body { display: block !important; }
        #root { max-width: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #111827; /* gray-900 */
        }
        ::-webkit-scrollbar-thumb {
          background: #374151; /* gray-700 */
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #4b5563; /* gray-600 */
        }
      `}</style>
      {/* Navbar Sederhana */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white"></div>
            <h1 className="text-xl font-bold tracking-wider">
              TRADE INCOME<span className="text-blue-500"> PLANER</span>
            </h1>
          </div>
          <div className="text-sm text-gray-400">
            Professional Equity Simulator
          </div>
        </div>
      </nav>

      <div className="w-full p-6 space-y-8">
        {/* SECTION 1: MARKET OVERVIEW (CHART & ASSETS) */}
        <div className="space-y-6">
          {/* Asset Selection Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="w-full sm:w-1/4">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Market Category
              </label>
              <select
                value={activeCategory}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setActiveCategory(newCategory);
                  // Otomatis pilih aset pertama saat kategori berubah
                  setActiveSymbol(assetCategories[newCategory][0].symbol);
                }}
                className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                {Object.keys(assetCategories).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-1/4">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Select Asset
              </label>
              <select
                value={activeSymbol}
                onChange={(e) => setActiveSymbol(e.target.value)}
                className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                {assetCategories[activeCategory].map((asset) => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart Container (Wide & Tall) */}
          <div className="h-[600px] bg-gray-800 rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
            <TradingViewWidget symbol={activeSymbol} />
          </div>
        </div>

        {/* SECTION 2: SIMULATION TOOLS */}
        <div className="space-y-8">
          {/* View Switcher */}
          <div className="flex justify-center border-b border-gray-700">
            <button
              onClick={() => setActiveView("simulator")}
              className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeView === "simulator"
                  ? "text-gray-500 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Strategy Simulator
            </button>
            <button
              onClick={() => setActiveView("planner")}
              className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeView === "planner"
                  ? "text-gray-500 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Goal Planner
            </button>
            <button
              onClick={() => setActiveView("manual")}
              className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeView === "manual"
                  ? "text-gray-500 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Manual Trade
            </button>
          </div>
          {activeView === "simulator" && (
            <div className="space-y-6">
              <SimulationForm onSimulate={handleSimulate} isLoading={loading} />
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm">
                  <p>{error}</p>
                </div>
              )}
              {simulationData ? (
                <ResultsDashboard data={simulationData} />
              ) : (
                <div className="bg-gray-800 p-10 rounded-lg border border-gray-700 text-center h-[300px] flex flex-col justify-center items-center text-gray-500">
                  <svg
                    className="w-16 h-16 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-lg">
                    Masukkan parameter di atas dan klik "Jalankan Simulasi"
                    untuk melihat hasil.
                  </p>
                </div>
              )}
            </div>
          )}
          {activeView === "planner" && (
            <GoalPlanner />
          )}
          {activeView === "manual" && (
            <ManualTradeSimulator activeSymbol={activeSymbol} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
