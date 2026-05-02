import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useLocation } from "react-router-dom";
import api from "../lib/axios";
import { useAuth } from "./AuthContext";

const ThemeEngineContext = createContext();

export const useThemeEngine = () => useContext(ThemeEngineContext);

const DEFAULT_THEME = {
  bg_color: "#030308",
  panel_color: "#0a0f1c",
  neon_color: "#00cfff",
  button_color: "#00cfff",
  glass_opacity: 0.6,
  glass_blur: "12px",
  font_family: "Inter",
  text_color: "#ffffff",
  neon_radius: "20px",
  neon_font_style: "none",
};

// Pages that must strictly use the default theme
const EXCLUDED_PATHS = ["/", "/login", "/register", "/forgot-password", "/admin"];

// Helper for Tailwind opacity
const hexToRgb = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
};

export const ThemeEngineProvider = ({ children }) => {
  const { token, userData } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  // Determine if current path is excluded
  const isExcluded = EXCLUDED_PATHS.some((p) => 
    location.pathname === p || location.pathname.startsWith("/admin")
  );

  const fetchTheme = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/users/me/theme");
      if (res.data) {
        setTheme({
          bg_color: res.data.bg_color || DEFAULT_THEME.bg_color,
          panel_color: res.data.panel_color || DEFAULT_THEME.panel_color,
          neon_color: res.data.neon_color || DEFAULT_THEME.neon_color,
          button_color: res.data.button_color || DEFAULT_THEME.button_color,
          glass_opacity: res.data.glass_opacity ?? DEFAULT_THEME.glass_opacity,
          glass_blur: res.data.glass_blur || DEFAULT_THEME.glass_blur,
          font_family: res.data.font_family || DEFAULT_THEME.font_family,
          text_color: res.data.text_color || DEFAULT_THEME.text_color,
          neon_radius: res.data.neon_radius || DEFAULT_THEME.neon_radius,
          neon_font_style: res.data.neon_font_style || DEFAULT_THEME.neon_font_style,
        });
      }
    } catch (error) {
      console.error("Failed to fetch theme", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const updateTheme = async (updates) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme); // Optimistic UI update
    
    if (!token) return;
    try {
      await api.put("/users/me/theme", updates);
    } catch (error) {
      console.error("Failed to update theme", error);
    }
  };

  const resetToDefault = async () => {
    await updateTheme(DEFAULT_THEME);
  };

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    const activeTheme = isExcluded ? DEFAULT_THEME : theme;

    root.style.setProperty("--engine-bg", activeTheme.bg_color);
    root.style.setProperty("--engine-bg-rgb", hexToRgb(activeTheme.bg_color));
    
    root.style.setProperty("--engine-panel", activeTheme.panel_color);
    root.style.setProperty("--engine-panel-rgb", hexToRgb(activeTheme.panel_color));
    
    root.style.setProperty("--engine-neon", activeTheme.neon_color);
    root.style.setProperty("--engine-neon-rgb", hexToRgb(activeTheme.neon_color));
    
    root.style.setProperty("--engine-button", activeTheme.button_color);
    root.style.setProperty("--engine-button-rgb", hexToRgb(activeTheme.button_color));
    root.style.setProperty("--engine-glass-opacity", activeTheme.glass_opacity);
    root.style.setProperty("--engine-glass-blur", activeTheme.glass_blur);
    root.style.setProperty("--engine-font", activeTheme.font_family);
    root.style.setProperty("--engine-text", activeTheme.text_color);
    root.style.setProperty("--engine-neon-radius", activeTheme.neon_radius);
    root.style.setProperty("--engine-neon-font-style", activeTheme.neon_font_style);
  }, [theme, isExcluded]);

  return (
    <ThemeEngineContext.Provider value={{ theme, updateTheme, resetToDefault, loading }}>
      {children}
    </ThemeEngineContext.Provider>
  );
};
