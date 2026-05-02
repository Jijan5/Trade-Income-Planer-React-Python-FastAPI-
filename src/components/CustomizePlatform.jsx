import React, { useState, useEffect } from "react";
import { useThemeEngine } from "../contexts/ThemeEngineContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const FONTS = [
  { label: "Inter", value: "Inter" },
  { label: "JetBrains Mono", value: "'JetBrains Mono'" },
  { label: "Roboto Mono", value: "'Roboto Mono'" },
  { label: "Space Mono", value: "'Space Mono'" },
  { label: "Orbitron", value: "'Orbitron'" },
  { label: "Plus Jakarta Sans", value: "'Plus Jakarta Sans'" },
  { label: "Rajdhani", value: "'Rajdhani'" },
  { label: "Fira Code", value: "'Fira Code'" },
];

const TEMPLATES = [
  {
    name: "Ocean Blue",
    theme: {
      bg_color: "#030a14",
      panel_color: "#071326",
      neon_color: "#00e5ff",
      button_color: "#00a3cc",
      glass_opacity: 0.7,
      glass_blur: "16px",
      font_family: "Inter",
      text_color: "#e6f7ff",
      neon_radius: "20px",
      neon_font_style: "glow",
    }
  },
  {
    name: "Green Emerald",
    theme: {
      bg_color: "#020a05",
      panel_color: "#05170a",
      neon_color: "#00ff66",
      button_color: "#00cc52",
      glass_opacity: 0.65,
      glass_blur: "12px",
      font_family: "'JetBrains Mono'",
      text_color: "#e6ffe6",
      neon_radius: "15px",
      neon_font_style: "none",
    }
  },
  {
    name: "Crimson Fire",
    theme: {
      bg_color: "#120202",
      panel_color: "#1f0505",
      neon_color: "#ff3333",
      button_color: "#cc0000",
      glass_opacity: 0.8,
      glass_blur: "8px",
      font_family: "'Orbitron'",
      text_color: "#ffe6e6",
      neon_radius: "25px",
      neon_font_style: "heavy-glow",
    }
  },
  {
    name: "Nature",
    theme: {
      bg_color: "#0f1710",
      panel_color: "#172418",
      neon_color: "#88cc00",
      button_color: "#669900",
      glass_opacity: 0.5,
      glass_blur: "20px",
      font_family: "'Plus Jakarta Sans'",
      text_color: "#f5f5f5",
      neon_radius: "10px",
      neon_font_style: "none",
    }
  },
  {
    name: "Cyber Violet",
    theme: {
      bg_color: "#0a0214",
      panel_color: "#130526",
      neon_color: "#b026ff",
      button_color: "#8c1aff",
      glass_opacity: 0.75,
      glass_blur: "14px",
      font_family: "'Space Mono'",
      text_color: "#f2e6ff",
      neon_radius: "22px",
      neon_font_style: "glow",
    }
  }
];

export default function CustomizePlatform() {
  const { theme, updateTheme, resetToDefault, loading } = useThemeEngine();
  const navigate = useNavigate();

  const [localTheme, setLocalTheme] = useState(theme);

  useEffect(() => {
    if (!loading) {
      setLocalTheme(theme);
    }
  }, [theme, loading]);

  const handleChange = (key, value) => {
    const newTheme = { ...localTheme, [key]: value };
    setLocalTheme(newTheme);
    updateTheme({ [key]: value });
  };

  const applyTemplate = (templateTheme) => {
    setLocalTheme(templateTheme);
    updateTheme(templateTheme);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-engine-bg text-engine-text">Loading Engine...</div>;

  return (
    <div className="flex h-screen w-full bg-engine-bg text-engine-text font-engine overflow-hidden">
      {/* LEFT PANEL: CONFIGURATION */}
      <div className="w-1/3 h-full border-r border-engine-neon/20 bg-engine-panel/80 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col relative z-10">
        <div className="p-6 border-b border-engine-neon/20 flex items-center justify-between sticky top-0 bg-engine-panel/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-engine-bg rounded-full text-gray-400 hover:text-engine-neon border border-engine-neon/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <h1 className="text-xl font-extrabold text-white tracking-widest uppercase" style={{ textShadow: localTheme.neon_font_style === "none" ? "none" : `0 0 10px ${localTheme.neon_color}`}}>Engine Custom</h1>
          </div>
          <button 
            onClick={resetToDefault}
            className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-bold border border-red-500/30 transition-all"
          >
            Reset
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Templates */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Quick Templates</h3>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map(t => (
                <button
                  key={t.name}
                  onClick={() => applyTemplate(t.theme)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    backgroundColor: `${t.theme.panel_color}99`,
                    borderColor: `${t.theme.neon_color}50`,
                    color: t.theme.text_color,
                  }}
                >
                  <span className="w-4 h-4 rounded-full mb-2 shadow-lg" style={{ backgroundColor: t.theme.neon_color, boxShadow: `0 0 10px ${t.theme.neon_color}`}}></span>
                  <span className="text-xs font-bold whitespace-nowrap">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Color Palette</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Background Color</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono">{localTheme.bg_color}</span>
                  <input type="color" value={localTheme.bg_color} onChange={(e) => handleChange("bg_color", e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Panel Color</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono">{localTheme.panel_color}</span>
                  <input type="color" value={localTheme.panel_color} onChange={(e) => handleChange("panel_color", e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Neon Accent Color</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono">{localTheme.neon_color}</span>
                  <input type="color" value={localTheme.neon_color} onChange={(e) => handleChange("neon_color", e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Button Color</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono">{localTheme.button_color}</span>
                  <input type="color" value={localTheme.button_color} onChange={(e) => handleChange("button_color", e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Typography</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Font Family</label>
                <select 
                  value={localTheme.font_family} 
                  onChange={(e) => handleChange("font_family", e.target.value)}
                  className="w-full bg-engine-bg border border-engine-neon/30 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-engine-neon"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Text Color</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono">{localTheme.text_color}</span>
                  <input type="color" value={localTheme.text_color} onChange={(e) => handleChange("text_color", e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Neon Font Style (Text Shadow)</label>
                <select 
                  value={localTheme.neon_font_style} 
                  onChange={(e) => handleChange("neon_font_style", e.target.value)}
                  className="w-full bg-engine-bg border border-engine-neon/30 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-engine-neon"
                >
                  <option value="none">None</option>
                  <option value="glow">Glow</option>
                  <option value="heavy-glow">Heavy Glow</option>
                </select>
              </div>
            </div>
          </div>

          {/* Effects */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Effects</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Glass Opacity</label>
                  <span className="text-xs font-mono text-engine-neon">{localTheme.glass_opacity}</span>
                </div>
                <input 
                  type="range" min="0.1" max="1" step="0.1" 
                  value={localTheme.glass_opacity} 
                  onChange={(e) => handleChange("glass_opacity", parseFloat(e.target.value))}
                  className="w-full accent-engine-neon" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Glass Blur (px)</label>
                <input 
                  type="text" 
                  value={localTheme.glass_blur.replace('px','')} 
                  onChange={(e) => handleChange("glass_blur", `${e.target.value}px`)}
                  className="w-full bg-engine-bg border border-engine-neon/30 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-engine-neon"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Neon Radius (px)</label>
                <input 
                  type="text" 
                  value={localTheme.neon_radius.replace('px','')} 
                  onChange={(e) => handleChange("neon_radius", `${e.target.value}px`)}
                  className="w-full bg-engine-bg border border-engine-neon/30 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-engine-neon"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: LIVE PREVIEW */}
      <div className="w-2/3 h-full relative overflow-hidden bg-engine-bg">
        {/* Background Effects matching global styles implicitly via variables */}
        <div className="absolute inset-0 z-0 opacity-50" style={{ background: `radial-gradient(circle at 50% 50%, ${localTheme.neon_color}22 0%, transparent 60%)`}}></div>
        
        <div className="h-full overflow-y-auto p-10 relative z-10 custom-scrollbar space-y-10">
          
          {/* Mock Header */}
          <div className="flex items-center justify-between border-b border-engine-neon/20 pb-4">
            <h2 className="text-2xl font-extrabold uppercase tracking-widest" style={{ textShadow: localTheme.neon_font_style === "none" ? "none" : `0 0 10px ${localTheme.neon_color}`}}>Live Preview</h2>
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-engine-panel/80 rounded-full border border-engine-neon/20 text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: localTheme.neon_color, boxShadow: `0 0 ${localTheme.neon_radius} ${localTheme.neon_color}` }}></span>
                System Online
              </div>
            </div>
          </div>

          {/* Mock Dashboard Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 bg-engine-panel border border-engine-neon/30 rounded-2xl p-6 shadow-lg" style={{ backgroundColor: `${localTheme.panel_color}${Math.floor(localTheme.glass_opacity * 255).toString(16).padStart(2, '0')}`, backdropFilter: `blur(${localTheme.glass_blur})`, boxShadow: `0 0 ${localTheme.neon_radius} ${localTheme.neon_color}22`}}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold">Portfolio Overview</h3>
                <span className="text-engine-neon text-sm">+2.4%</span>
              </div>
              <div className="h-40 flex items-end gap-2 pt-4 border-b border-engine-neon/20">
                {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t rounded-t-sm" style={{ height: `${h}%`, backgroundImage: `linear-gradient(to top, ${localTheme.neon_color}22, ${localTheme.neon_color})`, opacity: 0.8 }}></div>
                ))}
              </div>
            </div>
            
            <div className="col-span-1 space-y-6">
              <div className="bg-engine-panel border border-engine-neon/30 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center h-full" style={{ backgroundColor: `${localTheme.panel_color}${Math.floor(localTheme.glass_opacity * 255).toString(16).padStart(2, '0')}`, backdropFilter: `blur(${localTheme.glass_blur})` }}>
                <div className="w-16 h-16 rounded-full border-2 mb-4 flex items-center justify-center text-2xl font-bold" style={{ borderColor: localTheme.neon_color, boxShadow: `0 0 ${localTheme.neon_radius} ${localTheme.neon_color}` }}>
                  W
                </div>
                <h3 className="font-bold mb-1">Win Rate</h3>
                <p className="text-3xl text-engine-neon font-mono">68.5%</p>
              </div>
            </div>
          </div>

          {/* Mock Social Feed (Community/Home) */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 mb-2">Recent Activity</h3>
            
            <div className="bg-engine-panel border border-engine-neon/30 rounded-2xl p-6 shadow-lg" style={{ backgroundColor: `${localTheme.panel_color}${Math.floor(localTheme.glass_opacity * 255).toString(16).padStart(2, '0')}`, backdropFilter: `blur(${localTheme.glass_blur})` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full border flex items-center justify-center font-bold" style={{ borderColor: localTheme.neon_color, backgroundColor: `${localTheme.bg_color}`}}>TR</div>
                <div>
                  <p className="font-bold text-sm flex items-center gap-1">TraderOne <span className="text-[10px] bg-engine-neon/20 text-engine-neon px-2 py-0.5 rounded-full border border-engine-neon/30">PRO</span></p>
                  <p className="text-[10px] text-gray-500">2 hours ago</p>
                </div>
              </div>
              <p className="text-sm mb-4 leading-relaxed">Just hit my weekly target using the new momentum strategy! The key is waiting for the EMA crossover confirmation on the 15m chart. 🚀📉</p>
              <div className="flex gap-4 border-t border-engine-neon/10 pt-3">
                <button className="text-xs font-bold flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: localTheme.neon_color }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                  24 Likes
                </button>
                <button className="text-xs text-gray-400 font-bold flex items-center gap-1 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  5 Comments
                </button>
              </div>
            </div>

          </div>

          {/* Mock Buttons & Inputs */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 mb-2">UI Elements</h3>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 rounded-xl font-bold shadow-lg transition-transform hover:scale-105" style={{ backgroundColor: localTheme.button_color, color: localTheme.bg_color, boxShadow: `0 0 ${localTheme.neon_radius} ${localTheme.button_color}66`}}>
                Primary Action
              </button>
              <button className="px-6 py-2.5 rounded-xl font-bold border transition-all hover:bg-opacity-10" style={{ borderColor: localTheme.button_color, color: localTheme.button_color, backgroundColor: `${localTheme.button_color}11`}}>
                Secondary Action
              </button>
            </div>
            <div>
              <input type="text" placeholder="Input Field..." className="w-full max-w-md bg-engine-bg border rounded-xl px-4 py-3 text-sm outline-none transition-shadow" style={{ borderColor: `${localTheme.neon_color}55`, color: localTheme.text_color, boxShadow: `0 0 10px ${localTheme.neon_color}22` }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
