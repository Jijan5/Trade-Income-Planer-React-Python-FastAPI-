import React, { useState } from "react";
import axios from "axios";
import SimulationForm from "./components/SimulationForm";
import ResultsDashboard from "./components/ResultsDashboard";
import TradingViewWidget from "./components/TradingViewWidget";

function App() {
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSymbol, setActiveSymbol] = useState("BINANCE:BTCUSDT");

  const assets = [
    { label: "Bitcoin", symbol: "BINANCE:BTCUSDT" },
    { label: "Ethereum", symbol: "BINANCE:ETHUSDT" },
    { label: "Gold", symbol: "OANDA:XAUUSD" },
    { label: "EUR/USD", symbol: "FX:EURUSD" },
    { label: "Oil", symbol: "TVC:USOIL" },
  ];

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
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Navbar Sederhana */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
            </div>
            <h1 className="text-xl font-bold tracking-wider">
              TRADE INCOME<span className="text-blue-500"> PLANER</span>
            </h1>
          </div>
          <div className="text-sm text-gray-400">
            Professional Equity Simulator
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-3 space-y-6">
            <SimulationForm onSimulate={handleSimulate} isLoading={loading} />

            {error && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm">
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Charts & Data */}
          <div className="lg:col-span-9 space-y-6">
            {/* Asset Selector */}
            <div className="flex flex-wrap gap-2">
              {assets.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setActiveSymbol(asset.symbol)}
                  className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
                    activeSymbol === asset.symbol
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  {asset.label}
                </button>
              ))}
            </div>
            {/* Market Overview (TradingView) */}
            <div className="h-[500px] bg-gray-800 rounded-lg border border-gray-700">
              <TradingViewWidget symbol={activeSymbol} />
            </div>

            {/* Simulation Results */}
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
                  Masukkan parameter di sebelah kiri dan klik "Jalankan
                  Simulasi" untuk melihat hasil.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
