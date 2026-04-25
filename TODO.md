# API Migration: Binance → TradingView/yfinance [COMPLETED ✅]

## Summary of Changes:

- ✅ Backend engine.py: get_market_price() now uses yfinance with symbol normalization (Forex =X, Oil=CL=F, Gold=GC=F)
- ✅ Tests: Updated test_engine.py with yfinance mocks
- ✅ Backend general.py: /api/market-data & single symbol now yfinance, supports new markets
- ✅ Frontend: Renamed BinanceChartWidget → TradingViewChartWidget with exchange prefix logic (OANDA:EURUSD, TVCL:USOIL etc.)
- ✅ App.jsx: Updated import and usage
- ✅ Removed old BinanceChartWidget.jsx

## Test Commands:

```
# Backend (new directory since no cd)
cd backend && uvicorn app.main:app --reload

# Frontend
npm run dev

# Test API
curl http://127.0.0.1:8000/api/price/BTCUSDT
curl http://127.0.0.1:8000/api/price/EURUSD
curl http://127.0.0.1:8000/api/price/USOIL
curl http://127.0.0.1:8000/api/market-data?s=CL=F,GC=F,EURUSD=X

# Test in UI: ManualTradeSimulator with EURUSD, USOIL
```

All Binance API calls removed. App now supports Forex, Oil, Commodities via yfinance + TradingView widget.
