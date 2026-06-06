import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, AreaSeries } from 'lightweight-charts';
import { RefreshCw, Activity, AlertCircle, BarChart2, TrendingUp } from 'lucide-react';
import api from '../lib/axios';

const timeframes = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1D', value: '1d' },
];

const CustomPlatformChart = ({ symbol = "BTCUSDT" }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const [interval, setInterval] = useState('1h');
  const [chartType, setChartType] = useState('candlestick'); // 'candlestick' or 'area'
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceInfo, setPriceInfo] = useState(null);

  // Parse CSS Variables for styling
  const getCssVar = useCallback((name, fallback) => {
    if (typeof window === 'undefined') return fallback;
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!val) return fallback;
    if (val.includes(',')) return `rgb(${val})`;
    return val;
  }, []);

  // Initialize Chart Container Once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Inject CSS to hide TradingView watermark
    const style = document.createElement('style');
    style.innerHTML = `
      .tv-lightweight-charts-logo {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    const neonColor = getCssVar('--engine-neon-rgb', '0, 255, 255');
    const isRgb = neonColor.startsWith('rgb');
    const formattedNeon = isRgb ? neonColor : `rgb(${neonColor})`;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: formattedNeon, width: 1, style: 3, labelBackgroundColor: formattedNeon },
        horzLine: { color: formattedNeon, width: 1, style: 3, labelBackgroundColor: formattedNeon },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
      autoSize: true,
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
    };
  }, [getCssVar]);

  // Handle Chart Type Switching (Area vs Candlestick)
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove old series if it exists
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    const neonColor = getCssVar('--engine-neon-rgb', '0, 255, 255');
    const isRgb = neonColor.startsWith('rgb');
    const formattedNeon = isRgb ? neonColor : `rgb(${neonColor})`;
    const rgbaTop = isRgb ? `rgba(${neonColor.replace('rgb(', '').replace(')', '')}, 0.5)` : 'rgba(0, 255, 255, 0.5)';
    const rgbaBottom = isRgb ? `rgba(${neonColor.replace('rgb(', '').replace(')', '')}, 0.0)` : 'rgba(0, 255, 255, 0.0)';

    let newSeries;
    if (chartType === 'area') {
      newSeries = chartRef.current.addSeries(AreaSeries, {
        lineColor: formattedNeon,
        topColor: rgbaTop,
        bottomColor: rgbaBottom,
        lineWidth: 3,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        crosshairMarkerBorderColor: '#ffffff',
        crosshairMarkerBackgroundColor: formattedNeon,
      });
    } else {
      newSeries = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#00e676',
        downColor: '#ff1744',
        borderVisible: false,
        wickUpColor: '#00e676',
        wickDownColor: '#ff1744',
      });
    }

    seriesRef.current = newSeries;
    
    // Inject data if we already fetched it
    if (chartData.length > 0) {
      newSeries.setData(chartData);
    }
  }, [chartType, getCssVar, chartData.length]); // Don't re-run on every chartData change, only length or type

  // Data Fetching & Subscriptions
  useEffect(() => {
    let isMounted = true;

    const fetchAndSubscribe = async () => {
      setIsLoading(true);
      setError(null);
      setPriceInfo(null);
      setChartData([]);

      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }

      const isCrypto = symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('ETH');

      const loadData = async () => {
        let formattedData = [];
        try {
          if (isCrypto) {
            const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=1000`);
            if (!response.ok) throw new Error("Failed to fetch data from Binance");
            const data = await response.json();
            formattedData = data.map(d => ({
              time: d[0] / 1000, open: parseFloat(d[1]), high: parseFloat(d[2]), low: parseFloat(d[3]), close: parseFloat(d[4]), value: parseFloat(d[4]),
            }));
          } else {
            // Forex / Commodities via Backend (yfinance)
            const res = await api.get(`/market_data/klines`, { params: { symbol, interval } });
            formattedData = res.data.map(d => ({
              time: d[0] / 1000, open: parseFloat(d[1]), high: parseFloat(d[2]), low: parseFloat(d[3]), close: parseFloat(d[4]), value: parseFloat(d[4]),
            }));
          }

          // Clean data: remove NaNs, sort by time, and remove duplicates (prevents lightweight-charts crash)
          formattedData = formattedData
            .filter(d => !isNaN(d.open) && !isNaN(d.close) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.time))
            .sort((a, b) => a.time - b.time);
          
          const uniqueTimes = new Set();
          formattedData = formattedData.filter(d => {
            if (uniqueTimes.has(d.time)) return false;
            uniqueTimes.add(d.time);
            return true;
          });

          if (isMounted) {
            setChartData(formattedData);
            if (seriesRef.current) seriesRef.current.setData(formattedData);
            if (formattedData.length > 0) setPriceInfo(formattedData[formattedData.length - 1].close);
            setIsLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            console.error(err);
            setError("Data feed error. The market may be closed or the symbol is invalid.");
            setIsLoading(false);
          }
        }
      };

      await loadData();

      // Setup Live Updates
      if (isCrypto) {
        const wsSymbol = symbol.toLowerCase();
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@kline_${interval}`);
        ws.onmessage = (event) => {
          if (!isMounted || !seriesRef.current) return;
          const kline = JSON.parse(event.data).k;
          const candle = {
            time: kline.t / 1000, open: parseFloat(kline.o), high: parseFloat(kline.h), low: parseFloat(kline.l), close: parseFloat(kline.c), value: parseFloat(kline.c),
          };
          seriesRef.current.update(candle);
          setPriceInfo(candle.close);
          
          setChartData(prev => {
            const arr = [...prev];
            if (arr.length > 0 && arr[arr.length - 1].time === candle.time) {
              arr[arr.length - 1] = candle;
            } else {
              arr.push(candle);
            }
            return arr;
          });
        };
        wsRef.current = ws;
      } else {
        // Poll backend every 60 seconds for non-crypto
        pollIntervalRef.current = setInterval(loadData, 60000);
      }
    };

    fetchAndSubscribe();

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [symbol, interval]);

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Custom Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-engine-panel border-b border-engine-neon/20 shadow-[0_4px_20px_rgba(var(--engine-neon-rgb),0.05)] z-10 rounded-t-2xl">
        <div className="flex items-center gap-4">
          <div className="font-extrabold text-white text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-engine-neon" />
            {symbol.toUpperCase()}
          </div>
          {priceInfo && (
            <div className="font-mono text-sm font-bold text-engine-neon bg-engine-neon/10 px-3 py-1 rounded-lg">
              ${priceInfo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-engine-bg p-1 rounded-xl border border-white/5 mr-2">
            <button
              onClick={() => setChartType('candlestick')}
              className={`p-1.5 rounded-lg transition-all ${chartType === 'candlestick' ? "bg-engine-neon text-engine-bg shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.5)]" : "text-gray-400 hover:text-white hover:bg-engine-button/10"}`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition-all ${chartType === 'area' ? "bg-engine-neon text-engine-bg shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.5)]" : "text-gray-400 hover:text-white hover:bg-engine-button/10"}`}
              title="Area Line Chart"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>

          {/* Timeframes */}
          <div className="flex items-center bg-engine-bg p-1 rounded-xl border border-white/5 hidden sm:flex">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setInterval(tf.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  interval === tf.value
                    ? "bg-engine-neon text-engine-bg shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.5)]"
                    : "text-gray-400 hover:text-white hover:bg-engine-button/10"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative bg-engine-bg/50">
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-sm bg-engine-panel/50">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-engine-neon animate-spin" />
              <p className="text-engine-neon font-bold text-sm tracking-widest animate-pulse">CONNECTING TO FEED...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-engine-panel/80 p-8 text-center">
            <div className="flex flex-col items-center gap-4 max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h3 className="text-white font-bold text-lg">Market Data Unavailable</h3>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />
      </div>
    </div>
  );
};

export default memo(CustomPlatformChart);
