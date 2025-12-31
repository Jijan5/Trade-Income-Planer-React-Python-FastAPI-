import React, { useState, useEffect } from "react";
import axios from "axios";
import SimulationForm from "./components/SimulationForm";
import ResultsDashboard from "./components/ResultsDashboard";
import BinanceChartWidget from "./components/BinanceChartWidget";
import GoalPlanner from "./components/GoalPlanner";
import ManualTradeSimulator from "./components/ManualTradeSimulator";
import ChatAssistant from "./components/ChatAssistant";
import Auth from "./components/Auth";
import Explore from "./components/Explore";
import Community from "./components/Community";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showAuth, setShowAuth] = useState(false);
  const [authInitialLogin, setAuthInitialLogin] = useState(true);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  const [activeCategory, setActiveCategory] = useState("Crypto");
  const [activeView, setActiveView] = useState(
    () => localStorage.getItem("activeView") || "simulator"
  );
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeView");
    setToken(null);
    // Reset to home view on logout
    setActiveView("simulator");
  };

  useEffect(() => {
    localStorage.setItem("activeView", activeView);
  }, [activeView]);

  if (showAuth) {
    return (
      <Auth
        onLogin={(newToken) => {
          setToken(newToken);
          setShowAuth(false);
        }}
        initialIsLogin={authInitialLogin}
        onClose={() => setShowAuth(false)}
      />
    );
  }

  const assetCategories = {
    Crypto: [
      { label: "Bitcoin (BTC)", symbol: "BTCUSDT" },
      { label: "Ethereum (ETH)", symbol: "ETHUSDT" },
      { label: "Binance Coin (BNB)", symbol: "BNBUSDT" },
      { label: "Solana (SOL)", symbol: "SOLUSDT" },
      { label: "Ripple (XRP)", symbol: "XRPUSDT" },
      { label: "Cardano (ADA)", symbol: "ADAUSDT" },
      { label: "Dogecoin (DOGE)", symbol: "DOGEUSDT" },
      { label: "Shiba Inu (SHIB)", symbol: "SHIBUSDT" },
      { label: "Polkadot (DOT)", symbol: "DOTUSDT" },
      { label: "Litecoin (LTC)", symbol: "LTCUSDT" },
      { label: "Chainlink (LINK)", symbol: "LINKUSDT" },
      { label: "Tron (TRX)", symbol: "TRXUSDT" },
      { label: "Avalanche (AVAX)", symbol: "AVAXUSDT" },
      { label: "Uniswap (UNI)", symbol: "UNIUSDT" },
      { label: "Cosmos (ATOM)", symbol: "ATOMUSDT" },
      { label: "Near Protocol (NEAR)", symbol: "NEARUSDT" },
      { label: "Pepe (PEPE)", symbol: "PEPEUSDT" },
    ],
    "Meme Coins": [
      { label: "DOGE", symbol: "DOGEUSDT" },
      { label: "SHIB", symbol: "SHIBUSDT" },
      { label: "PEPE", symbol: "PEPEUSDT" },
      { label: "FLOKI", symbol: "FLOKIUSDT" },
      { label: "BONK", symbol: "BONKUSDT" },
    ],
  };

  const handleSimulate = async (params) => {
    setLoading(true);
    setError(null);
    try {
      // Pastikan backend berjalan di port 8000
      const response = await axios.post(
        "http://127.0.0.1:8000/api/simulate",
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
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans w-full flex flex-col">
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
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between w-full">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveView("simulator")}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white"></div>
            <h1 className="text-xl font-bold tracking-wider">
              TRADE INCOME<span className="text-blue-500"> PLANER</span>
            </h1>
          </div>

          {/* Main Navigation (Center) */}
          <div className="hidden md:flex items-center space-x-2 bg-gray-900/50 p-1 rounded-lg border border-gray-700/50">
            <button
              onClick={() => setActiveView("simulator")}
              className={`px-6 py-1.5 text-sm font-bold rounded transition-all ${
                activeView !== "explore" && activeView !== "community"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Home TIP
            </button>
            <button
              onClick={() => setActiveView("explore")}
              className={`px-6 py-1.5 text-sm font-bold rounded transition-all ${
                activeView === "explore"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveView("community")}
              className={`px-6 py-1.5 text-sm font-bold rounded transition-all ${
                activeView === "community"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Community
            </button>
          </div>

          <div className="flex items-center gap-4">
            {token ? (
              <>
                <span className="text-sm text-gray-400 hidden sm:block">
                  Professional Equity Simulator
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/50 px-3 py-1 rounded transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthInitialLogin(true);
                    setShowAuth(true);
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthInitialLogin(false);
                    setShowAuth(true);
                  }}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 px-4 py-2 rounded transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="w-full p-6 space-y-8 pt-24">
        {activeView === "explore" ? (
          <Explore />
        ) : activeView === "community" ? (
          <Community />
        ) : (
          <>
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
                <BinanceChartWidget symbol={activeSymbol} />
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
                  <SimulationForm
                    onSimulate={handleSimulate}
                    isLoading={loading}
                  />
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
              {activeView === "planner" && <GoalPlanner />}
              {activeView === "manual" && (
                <ManualTradeSimulator activeSymbol={activeSymbol} />
              )}
            </div>
          </>
        )}
      </div>
      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-auto py-8 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-lg font-bold tracking-wider mb-1">
              TRADE INCOME<span className="text-blue-500"> PLANER</span>
            </h2>
            <p className="text-gray-400 text-sm">
              Professional Equity Simulator & Trading Assistant
            </p>
          </div>

          <div className="text-gray-500 text-xs text-center md:text-right">
            &copy; {new Date().getFullYear()} Trade Income Planer.<br/>All rights reserved.
          </div>
        </div>
      </footer>
      {/* AI Chat Assistant Widget */}
      <ChatAssistant />
    </div>
  );
}

export default App;
