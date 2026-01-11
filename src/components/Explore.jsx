import React, { useState, useEffect, useRef } from "react";
import api from "../lib/axios";

const Explore = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tickerContainer = useRef();

  // Track mounted state
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // --- 1. Fetch News Logic ---
  const fetchNews = async () => {
    try {
      // Panggil endpoint proxy backend kita
      const response = await api.get("/news");
      if (isMounted.current && response.data && response.data.Data) {
        setNews(response.data.Data);
      }
      if (isMounted.current) setLoading(false);
    } catch (err) {
      if (isMounted.current) {
        console.error("News Fetch Error:", err);
        setError("Gagal memuat berita pasar.");
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNews();
    // Auto-update setiap 5 menit (300000 ms)
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, []);

  // --- 2. TradingView Ticker Widget ---
  useEffect(() => {
    if (tickerContainer.current) {
      tickerContainer.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.async = true;
      script.innerHTML = JSON.stringify({
        symbols: [
          { proName: "BINANCE:BTCUSDT", title: "Bitcoin" },
          { proName: "BINANCE:ETHUSDT", title: "Ethereum" },
          { proName: "BINANCE:BNBUSDT", title: "BNB" },
          { proName: "BINANCE:SOLUSDT", title: "Solana" },
          { proName: "BINANCE:XRPUSDT", title: "XRP" },
          { proName: "BINANCE:DOGEUSDT", title: "Dogecoin" },
          { proName: "BINANCE:ADAUSDT", title: "Cardano" },
          { proName: "BINANCE:AVAXUSDT", title: "Avalanche" },
        ],
        showSymbolLogo: true,
        isTransparent: false,
        displayMode: "adaptive",
        colorTheme: "dark",
        locale: "en",
      });
      tickerContainer.current.appendChild(script);
    }
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header / Ticker Tape */}
      <div className="rounded-lg overflow-hidden border border-gray-700 shadow-lg">
        <div className="tradingview-widget-container" ref={tickerContainer}>
          <div className="tradingview-widget-container__widget"></div>
        </div>
      </div>

      {/* News Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-blue-500">📰</span> Market Insights & News
        </h2>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg h-64 animate-pulse border border-gray-700"></div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500 text-red-200 rounded text-center">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col"
              >
                {/* Image */}
                <div className="h-48 overflow-hidden relative group">
                  <img
                    src={item.imageurl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    {item.source_info.name}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                    {item.body}
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-700">
                    <span className="text-xs text-gray-500">
                      {new Date(item.published_on * 1000).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      Read More 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
