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
    return () => {
      isMounted.current = false;
    };
  }, []);

  // --- 1. Fetch News Logic ---
  const fetchNews = async () => {
    try {
      const response = await api.get("/news");
      console.log("News API Response:", response.data);
      if (isMounted.current && response.data && response.data.Data) {
        setNews(response.data.Data);
      } else {
        console.log("No data.Data found, full response:", response.data);
      }
      if (isMounted.current) setLoading(false);
    } catch (err) {
      if (isMounted.current) {
        console.error("News Fetch Error:", err);
        setError("Failed to load news.");
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const loadNews = async () => {
      await fetchNews();
    };

    loadNews();
    // Auto-update every 5 minutes (300000 ms)
    const interval = setInterval(() => {
      loadNews();
    }, 300000);
    return () => {
      clearInterval(interval);
      isMounted.current = false;
    };
  }, []);

  // --- 2. TradingView Ticker Widget ---
  useEffect(() => {
    if (tickerContainer.current) {
      tickerContainer.current.innerHTML = "";
      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
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
      <div className="rounded-2xl overflow-hidden border border-[#00cfff]/20 shadow-[0_0_15px_rgba(0,207,255,0.05)] bg-[#0a0f1c]/60 backdrop-blur-md">
        <div className="tradingview-widget-container" ref={tickerContainer}>
          <div className="tradingview-widget-container__widget"></div>
        </div>
      </div>

      {/* News Section */}
      <div>
        <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-3 tracking-wider">
          <span className="text-[#00cfff] drop-shadow-[0_0_8px_rgba(0,207,255,0.6)]">📰</span> 
          Market Insights & News
        </h2>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-[#0a0f1c]/60 rounded-2xl h-[350px] animate-pulse border border-[#00cfff]/10"
              ></div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl text-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="bg-[#0a0f1c]/60 backdrop-blur-md rounded-2xl border border-[#00cfff]/20 overflow-hidden hover:border-[#00cfff]/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,207,255,0.15)] hover:-translate-y-1 flex flex-col group"
              >
                {/* Image */}
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={item.imageurl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] to-transparent opacity-60"></div>
                  <div className="absolute top-3 right-3 bg-[#030308]/80 text-[#00cfff] text-xs px-3 py-1 rounded-full border border-[#00cfff]/30 backdrop-blur-md shadow-[0_0_10px_rgba(0,207,255,0.1)] font-bold">
                    {item.source_info?.name || "News"}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col relative z-10 -mt-6 bg-[#0a0f1c]/80 backdrop-blur-xl rounded-t-2xl border-t border-[#00cfff]/10">
                  <h3 className="text-lg font-extrabold text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#00cfff] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3 mb-5 flex-1 leading-relaxed">
                    {item.body}
                  </p>

                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-[#00cfff]/10">
                    <span className="text-xs font-medium text-gray-500">
                      {new Date(item.published_on * 1000).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-extrabold text-[#00cfff] hover:text-[#00b3e6] flex items-center gap-1 transition-all group-hover:translate-x-1"
                    >
                      Read More
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
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
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
