import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";

// Suppress noisy third-party SDK logs in development
// (Midtrans Snap.js fires "checkSupportDomain" repeatedly on localhost)
if (import.meta.env.DEV) {
  const _originalLog = console.log;
  console.log = (...args) => {
    const msg = args[0];
    if (typeof msg === "string" && msg.includes("checkSupportDomain")) return;
    _originalLog.apply(console, args);
  };
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
