import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget({ symbol = "BINANCE:BTCUSDT" }) {
  const container = useRef();

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = "";
      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": symbol,
        "interval": "D",
        "timezone": "Asia/Jakarta",
        "theme": "dark",
        "style": "1",
        "locale": "id",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com"
      });
      container.current.appendChild(script);
    }
  }, [symbol]);

  return (
    <div
      className="tradingview-widget-container h-full w-full rounded-lg overflow-hidden shadow-lg border border-gray-700"
      ref={container}
    >
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}

export default memo(TradingViewWidget);
