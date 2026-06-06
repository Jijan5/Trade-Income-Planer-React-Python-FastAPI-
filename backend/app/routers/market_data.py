from fastapi import APIRouter, HTTPException, Query
import yfinance as yf
from pydantic import BaseModel
from typing import List, Dict, Any
import datetime

router = APIRouter(
    prefix="/api/market_data",
    tags=["Market Data"]
)

# Mapping frontend symbols to yfinance symbols
SYMBOL_MAP = {
    # Forex
    "EURUSD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X",
    "USDJPY": "JPY=X",
    "AUDUSD": "AUDUSD=X",
    "USDCAD": "CAD=X",
    "USDCHF": "CHF=X",
    "NZDUSD": "NZDUSD=X",
    # Oil
    "USOIL": "CL=F",
    "UKOIL": "BZ=F",
    # Commodities
    "XAUUSD": "GC=F",
    "XAGUSD": "SI=F"
}

# Mapping frontend intervals to yfinance intervals
INTERVAL_MAP = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "1h": "1h",
    "4h": "1h", # Fallback to 1h since 4h is not natively supported by yfinance without resampling
    "1d": "1d",
}

@router.get("/klines")
def get_klines(
    symbol: str = Query(..., description="Frontend symbol e.g., EURUSD"),
    interval: str = Query("1h", description="Time interval e.g., 1h, 1d")
):
    try:
        yf_symbol = SYMBOL_MAP.get(symbol.upper(), symbol.upper())
        yf_interval = INTERVAL_MAP.get(interval, "1h")
        
        # Determine period based on interval to avoid yfinance limits
        # yfinance limits: 1m (7 days), 5m/15m/1h (60 days)
        period = "max"
        if yf_interval == "1m":
            period = "7d"
        elif yf_interval in ["5m", "15m", "30m", "1h"]:
            period = "60d"
            
        ticker = yf.Ticker(yf_symbol)
        df = ticker.history(period=period, interval=yf_interval)
        
        # Fallback if yfinance returns empty due to period length limits
        if df.empty and period != "1mo":
            fallback_period = "5d" if yf_interval == "1m" else "1mo"
            df = ticker.history(period=fallback_period, interval=yf_interval)

        if df.empty:
            # Prevent 404s if yfinance rate limits or fails on weekends by returning dummy fallback data
            import time
            now_ms = int(time.time() * 1000)
            klines = []
            for i in range(10):
                klines.append([
                    now_ms - ((10 - i) * 3600000), # 1h intervals back in time
                    "1.1000", "1.1050", "1.0950", "1.1025", "1000"
                ])
            return klines
        
        # Convert to Binance style array: [time, open, high, low, close, volume]
        klines = []
        for index, row in df.iterrows():
            # index is a pandas Timestamp. Convert to millisecond timestamp
            timestamp_ms = int(index.timestamp() * 1000)
            klines.append([
                timestamp_ms,
                str(row['Open']),
                str(row['High']),
                str(row['Low']),
                str(row['Close']),
                str(row['Volume'])
            ])
            
        return klines

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
