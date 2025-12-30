import React, { useEffect, useRef, memo } from 'react';

const BinanceChartWidget = ({ symbol = "BTCUSDT" }) => {
  const container = useRef();

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    const formattedSymbol = symbol.includes(":") ? symbol : `BINANCE:${symbol}`;

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": formattedSymbol,
      "interval": "D",
      "timezone": "Asia/Jakarta",
      "theme": "dark",
      "style": "1", // 1 = Candle, 2 = Line, 3 = Area
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "hide_side_toolbar": false, 
      "withdateranges": true,     
      "hide_volume": false,
      "studies": [                
        "RSI@tv-basicstudies",
        "MASimple@tv-basicstudies"
      ]
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
};

// Menggunakan memo agar widget tidak re-render jika props tidak berubah
export default memo(BinanceChartWidget);
