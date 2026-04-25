import React, { useEffect, useRef, memo } from 'react';

const TradingViewChartWidget = ({ symbol = "BTCUSDT" }) => {
  const container = useRef();

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Normalize symbol for TradingView
    let formattedSymbol = symbol;
    const upperSym = symbol.toUpperCase();
    
    // Remove BINANCE: if present
    formattedSymbol = formattedSymbol.replace(/^BINANCE:/, '');
    
    // Add exchange prefix based on symbol type
    if (upperSym.includes('EURUSD') || upperSym.includes('GBPUSD') || upperSym.includes('USDJPY') || upperSym.includes('AUDUSD')) {
      formattedSymbol = `OANDA:${formattedSymbol}`;
    } else if (upperSym.includes('OIL') || upperSym.includes('USOIL')) {
      formattedSymbol = `TVCL:USOIL`;
    } else if (upperSym.includes('GOLD') || upperSym.includes('XAUUSD')) {
      formattedSymbol = `XAUUSD`;
    } else if (upperSym.includes('SILVER') || upperSym.includes('XAGUSD')) {
      formattedSymbol = `XAGUSD`;
    } else {
      // Default crypto
      formattedSymbol = `BINANCE:${formattedSymbol}`;
    }

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": formattedSymbol,
      "interval": "D",
      "timezone": "Asia/Jakarta",
      "theme": "dark",
      "style": "1", 
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

export default memo(TradingViewChartWidget);

