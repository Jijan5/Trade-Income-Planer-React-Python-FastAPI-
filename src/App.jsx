import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
  Outlet,
  Link,
} from "react-router-dom";
import api from "./lib/axios";
import SimulationForm from "./components/SimulationForm";
import ResultsDashboard from "./components/ResultsDashboard";
import TradingViewChartWidget from "./components/TradingViewChartWidget";
import GoalPlanner from "./components/GoalPlanner";
import ManualTradeSimulator from "./components/ManualTradeSimulator";
import ChatAssistant from "./components/ChatAssistant";
import Auth from "./components/Auth";
import Explore from "./components/Explore";
import Community from "./components/Community";
import Home from "./components/Home";
import LandingPage from "./components/LandingPage";
import Profile from "./components/Profile";
import NotificationsModal from "./components/NotificationsModal";
import Subscription from "./components/Subscriptions";
import AdminDashboard from "./components/AdminDashboard";
import PostDetail from "./components/PostDetail";
import TradeHistory from "./components/TradeHistory";
import SuspendedPage from "./components/SuspendedPage";
import ForgotPassword from "./components/ForgotPassword";
import ContactUs from "./components/ContactUs";
import { ManualTradeProvider } from "./contexts/ManualTradeContext";
import { useAuth } from "./contexts/AuthContext";
import { PostInteractionProvider } from "./contexts/PostInteractionContext";
import {
  NotificationProvider,
  useNotifications,
} from "./contexts/NotificationContext";
import VerifiedBadge from "./components/VerifiedBadge";
import { getPlanLevel } from "./utils/permissions";

// 🛡️ SECURITY: Protected Route for Admin
const AdminRoute = ({ children }) => {
  const { userData, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen bg-[#030308] flex flex-col items-center justify-center text-[#00cfff]">
        Loading Security Check...
      </div>
    );

  if (!userData || userData.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 🛡️ SECURITY: Protected Route for Authenticated Users
const ProtectedRoute = ({ children }) => {
  const { token, userData, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen bg-[#030308] flex flex-col items-center justify-center text-[#00cfff]">
        Loading...
      </div>
    );
  if (!token) return <Navigate to="/" replace />;
  if (
    userData &&
    userData.role !== "admin" &&
    userData.status === "suspended"
  ) {
    const suspendedUntil = userData.suspended_until
      ? new Date(userData.suspended_until)
      : null;
    // If suspension is indefinite (null) or hasn't expired yet
    if (!suspendedUntil || suspendedUntil > new Date()) {
      return <Navigate to="/suspended" replace />;
    }
  }
  return children;
};

const assetCategories = {
  Crypto: [
    { label: "Bitcoin (BTC)", symbol: "BTCUSDT" },
    { label: "Ethereum (ETH)", symbol: "ETHUSDT" },
    { label: "Binance Coin (BNB)", symbol: "BNBUSDT" },
    { label: "Solana (SOL)", symbol: "SOLUSDT" },
    { label: "Ripple (XRP)", symbol: "XRPUSDT" },
    { label: "Cardano (ADA)", symbol: "ADAUSDT" },
    { label: "Dogecoin (DOGE)", symbol: "DOGEUSDT" },
    { label: "Shiba Inu (SHIB)", symbol: "SHIBUSDT" },
    { label: "Polkadot (DOT)", symbol: "DOTUSDT" },
    { label: "Litecoin (LTC)", symbol: "LTCUSDT" },
    { label: "Chainlink (LINK)", symbol: "LINKUSDT" },
    { label: "Tron (TRX)", symbol: "TRXUSDT" },
    { label: "Avalanche (AVAX)", symbol: "AVAXUSDT" },
    { label: "Uniswap (UNI)", symbol: "UNIUSDT" },
    { label: "Cosmos (ATOM)", symbol: "ATOMUSDT" },
    { label: "Near Protocol (NEAR)", symbol: "NEARUSDT" },
    { label: "Pepe (PEPE)", symbol: "PEPEUSDT" },
  ],
  "Meme Coins": [
    { label: "DOGE", symbol: "DOGEUSDT" },
    { label: "SHIB", symbol: "SHIBUSDT" },
    { label: "PEPE", symbol: "PEPEUSDT" },
    { label: "FLOKI", symbol: "FLOKIUSDT" },
    { label: "BONK", symbol: "BONKUSDT" },
  ],
  Forex: [
    { label: "EUR/USD", symbol: "EURUSD" },
    { label: "GBP/USD", symbol: "GBPUSD" },
    { label: "USD/JPY", symbol: "USDJPY" },
    { label: "AUD/USD", symbol: "AUDUSD" },
    { label: "USD/CAD", symbol: "USDCAD" },
    { label: "USD/CHF", symbol: "USDCHF" },
    { label: "NZD/USD", symbol: "NZDUSD" },
  ],
  Oil: [
    { label: "WTI Crude Oil", symbol: "USOIL" },
    { label: "Brent Crude", symbol: "UKOIL" },
  ],
  Commodities: [
    { label: "Gold (XAU)", symbol: "XAUUSD" },
    { label: "Silver (XAG)", symbol: "XAGUSD" },
  ],
};

// Layout for Simulation Section (Chart + Sub-nav) - Moved OUTSIDE App component
const SimulationLayout = ({
  activeCategory,
  setActiveCategory,
  activeSymbol,
  setActiveSymbol,
  showFlash,
}) => {
  const location = useLocation();
  const { userData, logout } = useAuth();
  const planLevel = getPlanLevel(userData?.plan);
  const isAdmin = userData?.role === "admin";
  return (
    <ManualTradeProvider activeSymbol={activeSymbol} key={userData?.username}>
      <>
        {/* SECTION 1: MARKET OVERVIEW (CHART & ASSETS) */}
        <div className="space-y-6 mb-8">
          {/* Asset Selection Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-6 bg-[#0a0f1c]/60 backdrop-blur-md p-5 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)]">
            <div className="w-full sm:w-1/4">
              <label className="block text-xs font-bold text-[#00cfff] mb-2 uppercase tracking-wider">
                Market Category
              </label>
              <select
                value={activeCategory}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setActiveCategory(newCategory);
                  setActiveSymbol(assetCategories[newCategory][0].symbol);
                }}
                className="w-full bg-[#030308] text-white border border-[#00cfff]/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] transition-all cursor-pointer"
              >
                {Object.keys(assetCategories).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-1/4">
              <label className="block text-xs font-bold text-[#00cfff] mb-2 uppercase tracking-wider">
                Select Asset
              </label>
              <select
                value={activeSymbol}
                onChange={(e) => setActiveSymbol(e.target.value)}
                className="w-full bg-[#030308] text-white border border-[#00cfff]/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] transition-all cursor-pointer"
              >
                {assetCategories[activeCategory].map((asset) => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-[600px] bg-[#0a0f1c]/80 backdrop-blur-xl rounded-2xl border border-[#00cfff]/20 shadow-[0_0_30px_rgba(0,207,255,0.05)] overflow-hidden">
            <TradingViewChartWidget symbol={activeSymbol} />
          </div>
        </div>

        {/* SECTION 2: SIMULATION TOOLS */}
        <div className="space-y-8">
          {/* View Switcher */}
          <div className="flex justify-center border-b border-[#00cfff]/20">
            <Link
              to="/simulation/strategy"
              className={`px-6 py-4 text-sm font-extrabold uppercase tracking-widest transition-all ${
                location.pathname.includes("/simulation/strategy")
                  ? "text-[#00cfff] border-b-2 border-[#00cfff] drop-shadow-[0_0_8px_rgba(0,207,255,0.5)]"
                  : "text-gray-500 hover:text-[#00cfff]/80"
              }`}
            >
              Strategy Simulator {planLevel < 2 && !isAdmin && "🔒"}
            </Link>
            <Link
              to="/simulation/planner"
              className={`px-6 py-4 text-sm font-extrabold uppercase tracking-widest transition-all ${
                location.pathname.includes("/simulation/planner")
                  ? "text-[#00cfff] border-b-2 border-[#00cfff] drop-shadow-[0_0_8px_rgba(0,207,255,0.5)]"
                  : "text-gray-500 hover:text-[#00cfff]/80"
              }`}
            >
              Goal Planner {planLevel < 2 && !isAdmin && "🔒"}
            </Link>
            <Link
              to="/simulation/manual"
              className={`px-6 py-4 text-sm font-extrabold uppercase tracking-widest transition-all ${
                location.pathname.includes("/simulation/manual")
                  ? "text-[#00cfff] border-b-2 border-[#00cfff] drop-shadow-[0_0_8px_rgba(0,207,255,0.5)]"
                  : "text-gray-500 hover:text-[#00cfff]/80"
              }`}
            >
              Manual Trade
            </Link>
            <Link
              to="/simulation/history"
              className={`px-6 py-4 text-sm font-extrabold uppercase tracking-widest transition-all ${
                location.pathname.includes("/simulation/history")
                  ? "text-[#00cfff] border-b-2 border-[#00cfff] drop-shadow-[0_0_8px_rgba(0,207,255,0.5)]"
                  : "text-gray-500 hover:text-[#00cfff]/80"
              }`}
            >
              History
            </Link>
          </div>
          <Outlet context={{ showFlash }} />
        </div>
      </>
    </ManualTradeProvider>
  );
};

// Extracted Strategy View Component to clean up App.jsx
const StrategyView = ({
  onSimulate,
  isLoading,
  error,
  simulationData,
  onExport,
}) => (
  <div className="space-y-6">
    <SimulationForm onSimulate={onSimulate} isLoading={isLoading} />
    {error && (
      <div className="p-4 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm">
        <p>{error}</p>
      </div>
    )}
    {simulationData ? (
      <>
        <ResultsDashboard data={simulationData} />
        <div className="flex justify-end">
          <button
            onClick={() => onExport(simulationData)}
            className="bg-transparent hover:bg-[#00cfff]/10 border border-[#00cfff]/50 hover:border-[#00cfff] text-[#00cfff] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,207,255,0.1)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export Results (CSV)
          </button>
        </div>
      </>
    ) : (
      <div className="bg-[#0a0f1c]/60 backdrop-blur-md p-10 rounded-2xl border border-[#00cfff]/20 text-center h-[300px] flex flex-col justify-center items-center text-gray-500 shadow-[0_0_20px_rgba(0,207,255,0.05)]">
        <svg
          className="w-16 h-16 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-lg">
          Enter your own value and hit "Run Simulation" to show the result.
        </p>
      </div>
    )}
  </div>
);

// Global Suspension Handler Component
const SuspensionHandler = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (
      userData &&
      userData.role !== "admin" &&
      userData.status === "suspended"
    ) {
      const suspendedUntil = userData.suspended_until
        ? new Date(userData.suspended_until)
        : null;
      const now = new Date();
      // If suspension is indefinite (null) or hasn't expired yet
      if (
        (!suspendedUntil || suspendedUntil > now) &&
        location.pathname !== "/suspended"
      ) {
        navigate("/suspended", { replace: true });
      }
      // Log the comparison to help debug
      console.log(
        "Suspended until:",
        suspendedUntil,
        "Now:",
        now,
        "Expired:",
        suspendedUntil <= now
      );
    }
    // If user is on suspended page but is now active (approved appeal), log them out to re-login
    if (
      userData &&
      userData.status === "active" &&
      location.pathname === "/suspended"
    ) {
      logout();
    }
  }, [userData, location, navigate, logout]);

  return null;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token,
    userData,
    avatarUrl,
    unreadCount,
    setUnreadCount,
    login,
    logout,
    fetchUserProfile,
  } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authInitialLogin, setAuthInitialLogin] = useState(true);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  const [activeCategory, setActiveCategory] = useState("Crypto");
  const [communities, setCommunities] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [highlightedPost, setHighlightedPost] = useState(null);
  const planLevel = getPlanLevel(userData?.plan);

  // 🛡️ SECURITY: Midtrans Integration - Use environment variables
  // In production, set VITE_MIDTRANS_URL and VITE_MIDTRANS_CLIENT_KEY in .env
  useEffect(() => {
    // Get configuration from environment variables
    const midtransUrl =
      import.meta.env.VITE_MIDTRANS_URL ||
      "https://app.sandbox.midtrans.com/snap/snap.js";
    const midtransClientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "";

    // Only load if client key is configured
    if (!midtransClientKey) {
      console.warn(
        "Midtrans client key not configured. Payment feature disabled."
      );
      return;
    }

    const script = document.createElement("script");
    script.src = midtransUrl;
    script.setAttribute("data-client-key", midtransClientKey);
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchCommunities = useCallback(async () => {
    // Only fetch if there's a token
    if (!token) return;

    try {
      const res = await api.get("/communities");
      setCommunities(res.data);
    } catch (error) {
      console.error("Failed to fetch communities", error);
    }
  }, [token]); // Dependency on token

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  // Feedback State
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Auto-fill email if logged in
  useEffect(() => {
    if (userData?.email) {
      setFeedbackEmail(userData.email);
    }
  }, [userData]);

  // Flash Message State
  const [flashMessage, setFlashMessage] = useState(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const showFlash = useCallback((message, type = "success") => {
    setFlashMessage({ message, type });
    setIsFadingOut(false);
    setTimeout(() => setIsFadingOut(true), 2500);
    setTimeout(() => setFlashMessage(null), 3000);
  }, []);

  const handleFeedbackSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!feedbackEmail || !feedbackMessage) return;
      // Simpan ke LocalStorage agar langsung muncul di Admin (Fallback/Demo)
      const newFeedback = {
        id: Date.now(), // Gunakan timestamp sebagai ID unik
        email: feedbackEmail,
        message: feedbackMessage,
        date: new Date().toISOString().split("T")[0],
      };
      const existing = JSON.parse(
        localStorage.getItem("local_feedbacks") || "[]"
      );
      localStorage.setItem(
        "local_feedbacks",
        JSON.stringify([newFeedback, ...existing])
      );

      try {
        await api.post("/feedback", {
          email: feedbackEmail,
          message: feedbackMessage,
        });
        showFlash("Feedback sent! Thank you.", "success");
      } catch (error) {
        console.error("Feedback error", error);
        showFlash("Feedback sent! (Saved locally)", "success");
      }
      if (!userData) setFeedbackEmail("");
      setFeedbackMessage("");
    },
    [feedbackEmail, feedbackMessage, userData, showFlash]
  );

  const handleBellClick = useCallback(async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // If we are opening it
      try {
        // Token header handled automatically by api interceptor
        const res = await api.get("/notifications");
        setNotifications(res.data);

        if (unreadCount > 0) {
          await api.post("/notifications/mark_as_read", {});
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch/mark notifications", error);
      }
    }
  }, [showNotifications, unreadCount, setUnreadCount]);

  const handleNotificationClick = (notification) => {
    setShowNotifications(false);
    setHighlightedPost({ postId: notification.post_id });

    if (
      [
        "react_post",
        "mention_post",
        "reply_post",
        "reply_comment",
        "mention_comment",
      ].includes(notification.type)
    ) {
      navigate(`/post/${notification.post_id}`);
    } else if (notification.community_id) {
      navigate(`/community/${notification.community_id}`);
    } else {
      navigate("/home");
    }
  };

  const handleSimulate = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      // Pastikan backend berjalan di port 8000
      const response = await api.post("/simulate", params);
      setSimulationData(response.data);
    } catch (err) {
      console.error("Simulation Error:", err);
      setError("Gagal menghubungi server. Pastikan backend Python berjalan.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubscribe = useCallback(
    async (plan) => {
      if (!token) {
        setAuthInitialLogin(true);
        setShowAuth(true);
        return;
      }

      try {
        // Request Snap Token from Backend
        const response = await api.post("/payment/create_transaction", {
          plan_id: plan.id,
          amount: plan.finalPrice,
          billing_cycle: plan.billingCycle,
        });

        if (window.snap && response.data.token) {
          window.snap.pay(response.data.token, {
            onSuccess: async (result) => {
              try {
                // call endpoint verification to backend
                const orderId = result.order_id || response.data.order_id;
                await api.post("/payment/verify", { order_id: orderId });

                // Create persistent notification
                await api.post("/notifications/self", {
                  message: `Payment successful! Your plan has been upgraded to ${plan.name}.`,
                  type: "system_broadcast",
                });

                if (fetchUserProfile) await fetchUserProfile();
                showFlash(
                  `Payment success! Your plan has been upgraded to ${plan.name}.`,
                  "success"
                );
              } catch (error) {
                console.error("Verification failed", error);
                showFlash(
                  "Payment successful but verification failed. Please contact support.",
                  "error"
                );
              }
            },
            onPending: (result) => showFlash("Waiting for payment...", "info"),
            onError: (result) => showFlash("Payment failed!", "error"),
            onClose: () =>
              console.log(
                "Customer closed the popup without finishing the payment"
              ),
          });
        }
      } catch (error) {
        console.error("Payment Error:", error);
        showFlash("Failed to initiate payment. Please try again.", "error");
      }
    },
    [token, fetchUserProfile, showFlash]
  );

  const handleExportSimulationCSV = (data) => {
    if (!data || !data.daily_breakdown) return;

    const headers = [
      "Day",
      "Start Balance",
      "Profit/Loss",
      "End Balance",
      "ROI",
    ];
    const csvRows = [headers.join(",")];

    data.daily_breakdown.forEach((day) => {
      const row = [
        day.day,
        day.start_balance,
        day.profit_loss,
        day.end_balance,
        day.roi,
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation_results_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const navItems = useMemo(
    () => [
      {
        path: "/home",
        title: "Home",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
        ),
      },
      {
        path: "/explore",
        title: "Explore",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18V6.375c0-.621.504-1.125 1.125-1.125H9.75"
            />
          </svg>
        ),
      },
      {
        path: "/community",
        title: "Community",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.51.056 1.02.083 1.531.083s1.02-.027 1.531-.083m-3.062 0c.203.18.45.33.712.453m-7.5 0a9.094 9.094 0 013.741-.479 3 3 0 014.682-2.72M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7.5 3.75h15a9.094 9.094 0 00-15 0z"
            />
          </svg>
        ),
      },
      {
        path: "/simulation",
        title: "Simulation",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        ),
      },
    ],
    []
  );

  if (showAuth) {
    return (
      <Auth
        onLogin={(newToken) => {
          login(newToken);
          setShowAuth(false);
        }}
        initialIsLogin={authInitialLogin}
        onClose={() => setShowAuth(false)}
      />
    );
  }

  return (
    <NotificationProvider>
      <PostInteractionProvider showFlash={showFlash}>
        {/* Override default Vite styles that constrain width */}
        <div className="min-h-screen bg-[#030308] text-gray-100 font-sans w-full flex flex-col">

          {/* Flash Message Notification */}
          {flashMessage && (
            <div
              className={`fixed top-24 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-500 transform ${
                isFadingOut
                  ? "opacity-0 translate-y-[-20px]"
                  : "opacity-100 translate-y-0"
              } ${
                flashMessage.type === "success"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 border border-green-400/50"
                  : flashMessage.type === "info"
                  ? "bg-gradient-to-r from-blue-600 to-sky-600 border border-blue-400/50"
                  : "bg-gradient-to-r from-red-600 to-rose-600 border border-red-400/50"
              } text-white backdrop-blur-md`}
            >
              <div
                className={`p-1 rounded-full ${
                  flashMessage.type === "success"
                    ? "bg-green-500/30"
                    : flashMessage.type === "info"
                    ? "bg-blue-500/30"
                    : "bg-red-500/30"
                }`}
              >
                {flashMessage.type === "success" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : flashMessage.type === "info" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {flashMessage.type === "success"
                    ? "Success"
                    : flashMessage.type === "info"
                    ? "Info"
                    : "Error"}
                </h4>
                <p className="text-xs opacity-90">{flashMessage.message}</p>
              </div>
            </div>
          )}
          {/* Navbar */}
          <nav className="bg-[#0a0f1c]/80 backdrop-blur-md border-b border-[#00cfff]/20 shadow-[0_4px_30px_rgba(0,207,255,0.05)] px-6 py-4 fixed top-0 left-0 right-0 z-50">
            <div className="flex items-center justify-between w-full">
              <div
                className="flex items-center cursor-pointer"
                onClick={() => navigate(token ? "/home" : "/")}
              >
                <img
                  src="/tip-brand.png"
                  alt="Trade Income Planner"
                  className="h-10"
                />
              </div>

              {/* Main Navigation (Center) */}
              <div className="hidden md:flex items-center space-x-1 bg-[#030308]/60 p-1.5 rounded-full border border-[#00cfff]/20 shadow-[inset_0_0_10px_rgba(0,207,255,0.05)]">
                {token &&
                  navItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      title={item.title}
                      className={`p-2.5 rounded-full transition-all custom-icon ${
                        location.pathname.startsWith(item.path)
                          ? "text-[#00cfff] bg-[#00cfff]/10 drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]"
                          : "text-gray-500 hover:text-[#00cfff]/80 hover:bg-[#00cfff]/5"
                      }`}
                    >
                      {item.icon}
                    </button>
                  ))}
              </div>

              <div className="flex items-center gap-4">
                {/* Admin Button - Only visible for admins */}
                {userData?.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="hidden md:block text-xs bg-transparent border border-red-500/50 hover:border-red-500 text-red-500 hover:bg-red-500/10 px-5 py-2.5 rounded-xl font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)] transition-all transform hover:scale-105"
                  >
                    🛡️ Admin Panel
                  </button>
                )}
                {/* Upgrade button - only show if logged in */}
                {token && (
                  <button
                    onClick={() => navigate("/subscription")}
                    className="hidden md:block text-xs gap-2 bg-gradient-to-r from-amber-500 to-yellow-300 hover:from-yellow-400 hover:to-yellow-200 text-[#030308] px-5 py-2.5 rounded-xl font-extrabold shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all duration-200 transform hover:scale-105"
                  >
                    👑 Upgrade Pro
                  </button>
                )}

                {token ? (
                  <>
                    <button
                      onClick={handleBellClick}
                      className="relative text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700/50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-gray-800">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Desktop Profile & Logout */}
                    <div
                      className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-[#00cfff]/10 p-1.5 pr-3 rounded-full transition-all border border-transparent hover:border-[#00cfff]/30 hover:shadow-[0_0_10px_rgba(0,207,255,0.1)]"
                      onClick={() => navigate("/profile")}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover border border-[#00cfff]/50 shadow-[0_0_5px_rgba(0,207,255,0.3)]"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-[#030308] rounded-full flex items-center justify-center text-[#00cfff] font-bold text-xs border border-[#00cfff]/50 shadow-[0_0_5px_rgba(0,207,255,0.3)]">
                          {userData?.username?.substring(0, 2).toUpperCase() ||
                            "U"}
                        </div>
                      )}
                      <div className="text-sm font-bold text-white hidden sm:flex items-center">
                        {userData?.username || "User"}
                        <VerifiedBadge user={userData} />
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="hidden md:block text-xs bg-transparent border border-red-500/30 hover:border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl transition-all font-bold"
                    >
                      Logout
                    </button>

                    {/* Mobile Hamburger Button */}
                    <button
                      onClick={() => setIsMobileMenuOpen(true)}
                      className="md:hidden text-gray-400 hover:text-white p-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-8 h-8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                        />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setAuthInitialLogin(true);
                        setShowAuth(true);
                      }}
                      className="text-xs bg-transparent text-white border border-white/10 hover:border-[#00cfff]/50 px-5 py-2.5 rounded-lg font-bold transition-all hover:shadow-[0_0_15px_rgba(0,207,255,0.2)] hover:bg-[#00cfff]/10"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        setAuthInitialLogin(false);
                        setShowAuth(true);
                      }}
                      className="text-xs bg-[#00cfff] hover:bg-[#00b3e6] text-[#030308] px-5 py-2.5 rounded-lg font-bold transition-all shadow-[0_0_10px_rgba(0,207,255,0.2)] hover:shadow-[0_0_20px_rgba(0,207,255,0.4)]"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* Mobile Menu Modal */}
          {isMobileMenuOpen && token && (
            <div
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div
                className="absolute right-0 top-0 h-full w-72 bg-[#0a0f1c]/95 border-l border-[#00cfff]/20 p-6 shadow-[-10px_0_30px_rgba(0,207,255,0.05)] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-extrabold text-white">Menu</h3>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-400 hover:text-[#00cfff] transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Profile Summary */}
                <div
                  className="flex items-center gap-4 mb-8 p-4 bg-[#030308] border border-[#00cfff]/20 rounded-2xl cursor-pointer hover:bg-[#00cfff]/5 transition-all shadow-[0_0_15px_rgba(0,207,255,0.05)]"
                  onClick={() => {
                    navigate("/profile");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover border border-[#00cfff]/50 shadow-[0_0_10px_rgba(0,207,255,0.2)]"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#0a0f1c] rounded-full flex items-center justify-center text-[#00cfff] font-bold text-lg border border-[#00cfff]/50 shadow-[0_0_10px_rgba(0,207,255,0.2)]">
                      {userData?.username?.substring(0, 2).toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold text-lg flex items-center gap-1">
                      {userData?.username}
                      <VerifiedBadge user={userData} />
                    </p>
                    <p className="text-gray-400 text-xs">{userData?.email}</p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-4 flex-1">
                  {userData?.role === "admin" && (
                    <button
                      onClick={() => {
                        navigate("/admin");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-transparent border border-red-500/50 hover:border-red-500 text-red-500 hover:bg-red-500/10 py-3 rounded-xl font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)] transition-all flex items-center justify-center gap-2"
                    >
                      🛡️ Admin Panel
                    </button>
                  )}
                  {token && (
                    <button
                      onClick={() => {
                        navigate("/subscription");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-300 hover:from-yellow-400 hover:to-yellow-200 text-[#030308] py-3 rounded-xl font-extrabold shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                      👑 Upgrade Pro
                    </button>
                  )}
                </div>

                {/* Logout */}
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-transparent hover:bg-red-500 border border-red-500/30 text-red-500 hover:text-white py-3 rounded-xl font-bold transition-all mt-auto"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          <div className="w-full p-4 md:p-6 space-y-8 pt-28 md:pt-32 pb-32 md:pb-8">
            <SuspensionHandler />
            <Routes>
              <Route
                path="/"
                element={
                  token ? (
                    <Navigate to="/home" replace />
                  ) : (
                    <LandingPage
                      onLogin={() => {
                        setAuthInitialLogin(true);
                        setShowAuth(true);
                      }}
                      onRegister={() => {
                        setAuthInitialLogin(false);
                        setShowAuth(true);
                      }}
                    />
                  )
                }
              />
              <Route
                path="/forgot-password"
                element={<ForgotPassword showFlash={showFlash} />}
              />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home
                      communities={communities}
                      highlightedPost={highlightedPost}
                      setHighlightedPost={setHighlightedPost}
                      showFlash={showFlash}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/explore"
                element={
                  <ProtectedRoute>
                    <Explore />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/post/:id"
                element={
                  <ProtectedRoute>
                    <PostDetail showFlash={showFlash} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <Community
                      communities={communities}
                      highlightedPost={highlightedPost}
                      setHighlightedPost={setHighlightedPost}
                      showFlash={showFlash}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/:id"
                element={
                  <ProtectedRoute>
                    <Community
                      communities={communities}
                      highlightedPost={highlightedPost}
                      setHighlightedPost={setHighlightedPost}
                      showFlash={showFlash}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/simulation"
                element={
                  <ProtectedRoute>
                    <SimulationLayout
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                      activeSymbol={activeSymbol}
                      setActiveSymbol={setActiveSymbol}
                      showFlash={showFlash}
                    />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="manual" replace />} />
                <Route
                  path="strategy"
                  element={
                    planLevel >= 2 || userData?.role === "admin" ? (
                      <StrategyView
                        onSimulate={handleSimulate}
                        isLoading={loading}
                        error={error}
                        simulationData={simulationData}
                        onExport={handleExportSimulationCSV}
                      />
                    ) : (
                      <div className="text-center py-24 bg-[#0a0f1c]/60 backdrop-blur-md rounded-2xl border border-[#00cfff]/20 shadow-[0_0_30px_rgba(0,207,255,0.05)]">
                        <h3 className="text-3xl font-extrabold text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                          Feature Locked 🔒
                        </h3>
                        <p className="text-gray-400 mb-8 font-light">
                          Upgrade to Premium to access the AI Strategy Simulator.
                        </p>
                        <button
                          onClick={() => navigate("/subscription")}
                          className="bg-[#00cfff] hover:bg-[#00b3e6] text-[#030308] px-8 py-3 rounded-xl font-extrabold shadow-[0_0_15px_rgba(0,207,255,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,207,255,0.4)]"
                        >
                          Upgrade Now
                        </button>
                      </div>
                    )
                  }
                />
                <Route
                  path="planner"
                  element={
                    planLevel >= 2 || userData?.role === "admin" ? (
                      <GoalPlanner />
                    ) : (
                      <div className="text-center py-24 bg-[#0a0f1c]/60 backdrop-blur-md rounded-2xl border border-[#00cfff]/20 shadow-[0_0_30px_rgba(0,207,255,0.05)]">
                        <h3 className="text-3xl font-extrabold text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                          Feature Locked 🔒
                        </h3>
                        <p className="text-gray-400 mb-8 font-light">
                          Upgrade to Premium to access Goal Planner.
                        </p>
                        <button
                          onClick={() => navigate("/subscription")}
                          className="bg-[#00cfff] hover:bg-[#00b3e6] text-[#030308] px-8 py-3 rounded-xl font-extrabold shadow-[0_0_15px_rgba(0,207,255,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,207,255,0.4)]"
                        >
                          Upgrade Now
                        </button>
                      </div>
                    )
                  }
                />
                <Route
                  path="manual"
                  element={<ManualTradeSimulator activeSymbol={activeSymbol} />}
                />
                <Route path="history" element={<TradeHistory />} />
              </Route>
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile showFlash={showFlash} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute>
                    <Subscription onSubscribe={handleSubscribe} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/suspended"
                element={
                  token ? <SuspendedPage /> : <Navigate to="/" replace />
                }
              />
              <Route
                path="/contact-us"
                element={<ContactUs showFlash={showFlash} />}
              />
            </Routes>
          </div>
          {/* 📱 MOBILE BOTTOM NAVIGATION */}
          {token && (
            <div className="fixed bottom-0 left-0 right-0 bg-[#0a0f1c]/90 backdrop-blur-md border-t border-[#00cfff]/20 md:hidden z-50 px-2 py-2 flex justify-around items-center safe-area-pb shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              {token &&
                navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all w-full ${
                      location.pathname.startsWith(item.path)
                        ? "text-[#00cfff] bg-[#00cfff]/10 drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]"
                        : "text-gray-500 hover:text-[#00cfff]/80"
                    }`}
                  >
                    {item.icon}
                    <span className="text-[10px] font-bold">{item.title}</span>
                  </button>
                ))}
            </div>
          )}
          {/* Footer */}
          <footer className="bg-[#030308] border-t border-[#00cfff]/20 mt-auto py-12 z-10 relative hidden md:block overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#00cfff]/30 to-transparent"></div>
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 items-center relative z-10">
              <div className="text-center md:text-left">
                <div className="flex justify-center md:justify-start mb-4">
                  <img
                    src="/tip-brand.png"
                    alt="Trade Income Planner"
                    className="h-12 drop-shadow-[0_0_10px_rgba(0,207,255,0.3)]"
                  />
                </div>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed font-light">
                  Professional Equity Simulator & Trading Assistant with
                  AI-driven insights and risk-free simulation.
                </p>
              </div>

              {/* Feedback Form */}
              <div className="md:col-span-2 bg-[#0a0f1c]/60 p-6 rounded-2xl border border-[#00cfff]/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md">
                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase">
                  Send Feedback
                </h3>
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={userData?.username || "Guest"}
                      disabled
                      className="sm:col-span-1 bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-sm text-gray-500 font-bold cursor-not-allowed focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      disabled={!!userData}
                      className={`sm:col-span-1 bg-[#030308] border border-[#00cfff]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all outline-none ${
                        userData ? "text-gray-500 cursor-not-allowed border-[#00cfff]/10" : ""
                      }`}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Your Feedback / Suggestion..."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      className="sm:col-span-2 bg-[#030308] border border-[#00cfff]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="text-right mt-2">
                    <button
                      type="submit"
                      className="bg-[#00cfff] hover:bg-[#00b3e6] text-[#030308] px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all shadow-[0_0_10px_rgba(0,207,255,0.2)] hover:shadow-[0_0_15px_rgba(0,207,255,0.4)]"
                    >
                      Send Feedback
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="max-w-7xl mx-auto mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <h4 className="font-semibold mb-4">Platform</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>
                      <a
                        href="/simulation/manual"
                        className="hover:text-white transition-colors"
                      >
                        Trade Simulator
                      </a>
                    </li>
                    <li>
                      <a
                        href="/community"
                        className="hover:text-white transition-colors"
                      >
                        Communities
                      </a>
                    </li>
                    <li>
                      <a
                        href="/simulation/history"
                        className="hover:text-white transition-colors"
                      >
                        Performance Tracking
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Support</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        API Documentation
                      </a>
                    </li>
                    <li>
                      <a
                        href="/contact-us"
                        className="hover:text-white transition-colors"
                      >
                        Contact Us
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Status
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Cookie Policy
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center">
              <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Trade Income Planner. All
                rights reserved.
              </p>
            </div>
          </footer>
          {/* AI Chat Assistant Widget */}
          <ChatAssistant />

          {showNotifications && (
            <NotificationsModal
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onNotificationClick={handleNotificationClick}
            />
          )}
        </div>
      </PostInteractionProvider>
    </NotificationProvider>
  );
}

export default App;
