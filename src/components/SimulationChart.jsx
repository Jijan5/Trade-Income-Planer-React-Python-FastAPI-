import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

const PAD = { top: 20, right: 75, bottom: 40, left: 12 };
const C = {
  bg: '#030308', grid: 'rgba(0,207,255,0.07)', text: 'rgba(0,207,255,0.55)',
  cross: 'rgba(0,207,255,0.5)', line: '#00cfff', bull: '#26a69a', bear: '#ef5350',
  sma10: '#f39c12', sma20: '#9b59b6', bb: 'rgba(0,207,255,0.4)', bbFill: 'rgba(0,207,255,0.04)',
  draw: 'rgba(255,200,0,0.85)',
};
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
const FIB_COLORS = ['#ef5350','#ff9800','#ffeb3b','#4caf50','#2196f3','#9c27b0','#ef5350'];

function sma(data, n) {
  return data.map((_, i) => i < n - 1 ? null : data.slice(i - n + 1, i + 1).reduce((s, d) => s + d.close, 0) / n);
}
function bband(data, n = 20, m = 2) {
  const mid = sma(data, n);
  return data.map((_, i) => {
    if (mid[i] === null) return { u: null, l: null, m: null };
    const sl = data.slice(Math.max(0, i - n + 1), i + 1);
    const std = Math.sqrt(sl.reduce((s, d) => s + Math.pow(d.close - mid[i], 2), 0) / sl.length);
    return { u: mid[i] + m * std, l: mid[i] - m * std, m: mid[i] };
  });
}

const TOOLS = [
  { id: 'pointer', label: '↖', tip: 'Pan' },
  { id: 'trendline', label: '╱', tip: 'Trend Line' },
  { id: 'hline', label: '─', tip: 'Horizontal Line' },
  { id: 'rect', label: '▭', tip: 'Rectangle' },
  { id: 'fib', label: 'Φ', tip: 'Fibonacci' },
  { id: 'text', label: 'T', tip: 'Text' },
  { id: 'eraser', label: '⌫', tip: 'Eraser' },
];

export default function SimulationChart({ data }) {
  const mainRef = useRef(null);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const drawingsRef = useRef([]);
  const panRef = useRef({ active: false, lastX: 0 });
  const viewRef = useRef({ startIdx: 0, visible: 60 });
  const mouseRef = useRef({ x: -1, y: -1 });
  const drawStartRef = useRef(null);
  const rafRef = useRef(null);

  const [tool, setTool] = useState('pointer');
  const [chartType, setChartType] = useState('candle');
  const [ind, setInd] = useState({ sma10: false, sma20: false, bb: false });
  const [, forceUpdate] = useState(0);

  const candles = useMemo(() => {
    if (!data?.length) return [];
    return data.map(d => {
      const o = parseFloat(d.start_balance), c = parseFloat(d.end_balance);
      const p = Math.abs(parseFloat(d.profit_loss));
      const w = p * 0.35 + o * 0.0015;
      return { day: d.day, open: o, close: c, high: Math.max(o, c) + w, low: Math.min(o, c) - w, pnl: parseFloat(d.profit_loss), bull: c >= o };
    });
  }, [data]);

  const s10 = useMemo(() => sma(candles, 10), [candles]);
  const s20 = useMemo(() => sma(candles, 20), [candles]);
  const bb = useMemo(() => bband(candles, 20), [candles]);

  // Reset viewport on every new data set (new simulation run)
  useEffect(() => {
    if (candles.length) {
      const vis = Math.min(60, candles.length);
      viewRef.current = { startIdx: Math.max(0, candles.length - vis), visible: vis };
    }
  }, [candles]); // full array reference — changes on every new simulation

  const render = useCallback(() => {
    const cv = mainRef.current;
    if (!cv || !candles.length) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const { startIdx, visible } = viewRef.current;
    const slice = candles.slice(startIdx, startIdx + visible);
    if (!slice.length) return;
    const cW = W - PAD.left - PAD.right, cH = H - PAD.top - PAD.bottom;
    const barW = cW / visible, candleW = Math.max(2, barW * 0.6);

    // price range
    const highs = slice.map(c => c.high), lows = slice.map(c => c.low);
    if (ind.bb) { bb.slice(startIdx, startIdx + visible).forEach(b => { if (b.u) { highs.push(b.u); lows.push(b.l); } }); }
    const pMax = Math.max(...highs) * 1.004, pMin = Math.min(...lows) * 0.996, pRange = pMax - pMin;
    const toX = i => PAD.left + ((i - startIdx) + 0.5) * barW;
    const toY = p => PAD.top + (1 - (p - pMin) / pRange) * cH;

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

    // grid
    for (let i = 0; i <= 6; i++) {
      const y = PAD.top + (i / 6) * cH;
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      ctx.fillStyle = C.text; ctx.font = '10px monospace'; ctx.textAlign = 'left';
      ctx.fillText('$' + (pMax - (i / 6) * pRange).toFixed(0), W - PAD.right + 4, y + 4);
    }
    const step = Math.max(1, Math.floor(visible / 8));
    slice.forEach((c, i) => { if (i % step === 0) { ctx.fillStyle = C.text; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(`D${c.day}`, toX(startIdx + i), H - 8); } });

    // BB
    if (ind.bb) {
      const bbSlice = bb.slice(startIdx, startIdx + visible);
      const draw2 = (key, color) => {
        ctx.beginPath(); let first = true;
        bbSlice.forEach((b, i) => { if (b[key] === null) return; const x = toX(startIdx + i); if (first) { ctx.moveTo(x, toY(b[key])); first = false; } else ctx.lineTo(x, toY(b[key])); });
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
      };
      draw2('u', C.bb); draw2('l', C.bb);
    }

    // SMAs
    [[s10, ind.sma10, C.sma10], [s20, ind.sma20, C.sma20]].forEach(([arr, on, col]) => {
      if (!on) return;
      ctx.beginPath(); let first = true;
      arr.slice(startIdx, startIdx + visible).forEach((v, i) => { if (v === null) return; const x = toX(startIdx + i); if (first) { ctx.moveTo(x, toY(v)); first = false; } else ctx.lineTo(x, toY(v)); });
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // chart
    if (chartType === 'line') {
      const grad = ctx.createLinearGradient(0, PAD.top, 0, H - PAD.bottom);
      grad.addColorStop(0, 'rgba(0,207,255,0.25)'); grad.addColorStop(1, 'rgba(0,207,255,0)');
      ctx.beginPath();
      slice.forEach((c, i) => { const x = toX(startIdx + i), y = toY(c.close); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      const lx = toX(startIdx + slice.length - 1), fx = toX(startIdx);
      ctx.lineTo(lx, H - PAD.bottom); ctx.lineTo(fx, H - PAD.bottom); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath();
      slice.forEach((c, i) => { const x = toX(startIdx + i), y = toY(c.close); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.strokeStyle = C.line; ctx.lineWidth = 2.5; ctx.shadowColor = 'rgba(0,207,255,0.4)'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
    } else {
      slice.forEach((c, i) => {
        const x = toX(startIdx + i), col = c.bull ? C.bull : C.bear;
        ctx.strokeStyle = col; ctx.fillStyle = col;
        ctx.lineWidth = Math.max(1, candleW * 0.08);
        ctx.beginPath(); ctx.moveTo(x, toY(c.high)); ctx.lineTo(x, toY(c.low)); ctx.stroke();
        const bTop = toY(Math.max(c.open, c.close)), bH = Math.max(1, Math.abs(toY(c.open) - toY(c.close)));
        ctx.fillRect(x - candleW / 2, bTop, candleW, bH);
      });
    }

    // drawings
    drawingsRef.current.forEach(d => drawShape(ctx, d, W, PAD, cH, pMin, pMax, pRange));
  }, [candles, chartType, ind, s10, s20, bb]);

  function drawShape(ctx, d, W, pad, cH, pMin, pMax, pRange) {
    ctx.save();
    if (d.type === 'trendline') {
      ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2);
      ctx.strokeStyle = C.draw; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (d.type === 'hline') {
      ctx.setLineDash([6, 3]);
      ctx.beginPath(); ctx.moveTo(pad.left, d.y1); ctx.lineTo(W - pad.right, d.y1);
      ctx.strokeStyle = C.draw; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      const price = pMax - ((d.y1 - pad.top) / cH) * pRange;
      ctx.fillStyle = C.draw; ctx.font = '10px monospace'; ctx.textAlign = 'left';
      ctx.fillText('$' + price.toFixed(2), W - pad.right + 4, d.y1 + 4);
    } else if (d.type === 'rect') {
      ctx.beginPath(); ctx.rect(Math.min(d.x1, d.x2), Math.min(d.y1, d.y2), Math.abs(d.x2 - d.x1), Math.abs(d.y2 - d.y1));
      ctx.strokeStyle = C.draw; ctx.fillStyle = 'rgba(255,200,0,0.06)'; ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke();
    } else if (d.type === 'fib') {
      FIB_LEVELS.forEach((lvl, idx) => {
        const y = d.y1 + (d.y2 - d.y1) * lvl;
        ctx.setLineDash([4, 2]);
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y);
        ctx.strokeStyle = FIB_COLORS[idx]; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = FIB_COLORS[idx]; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`${(lvl * 100).toFixed(1)}%`, W - pad.right + 4, y + 4);
      });
    } else if (d.type === 'text') {
      ctx.fillStyle = C.draw; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
      ctx.fillText(d.text || 'Label', d.x1, d.y1);
    }
    ctx.restore();
  }

  const renderOverlay = useCallback((tmpDraw) => {
    const ov = overlayRef.current, cv = mainRef.current;
    if (!ov || !cv) return;
    const ctx = ov.getContext('2d'); ctx.clearRect(0, 0, ov.width, ov.height);
    const { x, y } = mouseRef.current;
    if (x < 0) return;
    ctx.strokeStyle = C.cross; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, cv.height - PAD.bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(cv.width - PAD.right, y); ctx.stroke();
    ctx.setLineDash([]);
    if (tmpDraw) {
      const { visible, startIdx } = viewRef.current;
      const cW = cv.width - PAD.left - PAD.right, cH = cv.height - PAD.top - PAD.bottom;
      const pMax = Math.max(...candles.slice(startIdx, startIdx + visible).map(c => c.high)) * 1.004;
      const pMin = Math.min(...candles.slice(startIdx, startIdx + visible).map(c => c.low)) * 0.996;
      drawShape(ctx, tmpDraw, cv.width, PAD, cH, pMin, pMax, pMax - pMin);
    }
  }, [candles]);

  useEffect(() => { render(); }, [render]);

  const resize = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    [mainRef, overlayRef].forEach(r => { if (r.current) { r.current.width = W; r.current.height = H; } });
    render();
  }, [render]);

  useEffect(() => {
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resize]);

  const getPos = e => { const r = mainRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  const onMouseMove = e => {
    const { x, y } = getPos(e);
    mouseRef.current = { x, y };
    if (panRef.current.active && tool === 'pointer') {
      const dx = x - panRef.current.lastX; panRef.current.lastX = x;
      const cv = mainRef.current;
      const barW = (cv.width - PAD.left - PAD.right) / viewRef.current.visible;
      const shift = Math.round(-dx / barW);
      if (shift !== 0) {
        const v = viewRef.current;
        const newStart = Math.max(0, Math.min(candles.length - v.visible, v.startIdx + shift));
        viewRef.current = { ...v, startIdx: newStart };
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => { render(); renderOverlay(null); });
        return;
      }
    }
    const tmp = drawStartRef.current
      ? { type: drawStartRef.current.type, x1: drawStartRef.current.x, y1: drawStartRef.current.y, x2: x, y2: y }
      : null;
    renderOverlay(tmp);
  };

  const onMouseDown = e => {
    const { x, y } = getPos(e);
    if (tool === 'pointer') { panRef.current = { active: true, lastX: x }; return; }
    if (tool === 'hline') {
      drawingsRef.current.push({ type: 'hline', x1: x, y1: y, x2: x, y2: y });
      render(); renderOverlay(null); return;
    }
    if (tool === 'eraser') {
      drawingsRef.current = drawingsRef.current.filter(d => {
        const dist = Math.sqrt(Math.pow(d.x1 - x, 2) + Math.pow(d.y1 - y, 2));
        return dist > 20;
      });
      render(); renderOverlay(null); return;
    }
    if (tool === 'text') {
      const label = prompt('Enter label:') || 'Label';
      drawingsRef.current.push({ type: 'text', x1: x, y1: y, text: label });
      render(); return;
    }
    drawStartRef.current = { type: tool, x, y };
  };

  const onMouseUp = e => {
    panRef.current.active = false;
    if (!drawStartRef.current) return;
    const { x, y } = getPos(e);
    const s = drawStartRef.current;
    if (Math.abs(x - s.x) > 3 || Math.abs(y - s.y) > 3) {
      drawingsRef.current.push({ type: s.type, x1: s.x, y1: s.y, x2: x, y2: y });
    }
    drawStartRef.current = null;
    render(); renderOverlay(null);
  };

  const onWheel = e => {
    e.preventDefault();
    const v = viewRef.current;
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    const newVis = Math.round(Math.min(Math.max(10, v.visible * factor), candles.length));
    const newStart = Math.max(0, Math.min(candles.length - newVis, v.startIdx + Math.round((v.visible - newVis) / 2)));
    viewRef.current = { startIdx: newStart, visible: newVis };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => { render(); renderOverlay(null); });
  };

  const onMouseLeave = () => { mouseRef.current = { x: -1, y: -1 }; renderOverlay(null); };

  const undo = () => { drawingsRef.current.pop(); render(); forceUpdate(n => n + 1); };
  const reset = () => {
    const vis = Math.min(60, candles.length);
    viewRef.current = { startIdx: Math.max(0, candles.length - vis), visible: vis };
    render();
  };
  const toggleInd = k => setInd(prev => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="bg-[#0a0f1c]/60 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md overflow-hidden"
      style={{ animation: 'chartFadeIn 0.5s ease-out forwards' }}>
      <style>{`@keyframes chartFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-[#00cfff]/20 bg-[#030308]/40">
        <span className="text-[11px] font-extrabold text-[#00cfff] uppercase tracking-widest">Equity Curve</span>
        <div className="flex gap-1 ml-auto">
          {['candle','line'].map(t => (
            <button key={t} onClick={() => setChartType(t)}
              className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all ${chartType === t ? 'bg-[#00cfff] text-[#030308]' : 'bg-[#030308] border border-[#00cfff]/20 text-[#00cfff]/60 hover:text-[#00cfff]'}`}>
              {t === 'candle' ? '🕯 Candle' : '📈 Line'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[['sma10','SMA10',C.sma10],['sma20','SMA20',C.sma20],['bb','BB',C.bb]].map(([k,label,col]) => (
            <button key={k} onClick={() => toggleInd(k)}
              className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all border ${ind[k] ? 'bg-[#030308] border-[#00cfff]/50 text-[#00cfff]' : 'bg-[#030308] border-[#00cfff]/15 text-[#00cfff]/40 hover:text-[#00cfff]'}`}
              style={ind[k] ? { borderColor: col, color: col } : {}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex" style={{ height: 420 }}>
        {/* Left toolbar */}
        <div className="flex flex-col gap-1 p-2 border-r border-[#00cfff]/10 bg-[#030308]/30">
          {TOOLS.map(t => (
            <button key={t.id} title={t.tip} onClick={() => setTool(t.id)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${tool === t.id ? 'bg-[#00cfff] text-[#030308] shadow-[0_0_10px_rgba(0,207,255,0.4)]' : 'bg-[#030308] border border-[#00cfff]/15 text-[#00cfff]/60 hover:border-[#00cfff]/40 hover:text-[#00cfff]'}`}>
              {t.label}
            </button>
          ))}
          <div className="mt-auto flex flex-col gap-1">
            <button title="Undo" onClick={undo} className="w-9 h-9 rounded-lg bg-[#030308] border border-[#00cfff]/15 text-[#00cfff]/60 hover:border-[#00cfff]/40 hover:text-[#00cfff] text-sm font-bold flex items-center justify-center transition-all">↩</button>
            <button title="Reset View" onClick={reset} className="w-9 h-9 rounded-lg bg-[#030308] border border-[#00cfff]/15 text-[#00cfff]/60 hover:border-[#00cfff]/40 hover:text-[#00cfff] text-sm font-bold flex items-center justify-center transition-all">⟳</button>
          </div>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative" style={{ cursor: tool === 'pointer' ? 'grab' : 'crosshair' }}>
          <canvas ref={mainRef} className="absolute inset-0" />
          <canvas ref={overlayRef} className="absolute inset-0"
            onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave} onWheel={onWheel} style={{ cursor: 'inherit' }} />
        </div>
      </div>

      <div className="px-5 py-2 border-t border-[#00cfff]/10 flex gap-4 text-[9px] font-mono text-[#00cfff]/40">
        <span>Scroll to zoom</span><span>Drag to pan</span><span>{drawingsRef.current.length} drawings</span>
        {ind.sma10 && <span style={{color: C.sma10}}>● SMA10</span>}
        {ind.sma20 && <span style={{color: C.sma20}}>● SMA20</span>}
        {ind.bb && <span style={{color:'rgba(0,207,255,0.7)'}}>● BB(20)</span>}
      </div>
    </div>
  );
}
