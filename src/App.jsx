import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import SimulationForm from "./components/SimulationForm";
import ResultsDashboard from "./components/ResultsDashboard";
import BinanceChartWidget from "./components/BinanceChartWidget";
import GoalPlanner from "./components/GoalPlanner";
import ManualTradeSimulator from "./components/ManualTradeSimulator";
import ChatAssistant from "./components/ChatAssistant";
import Auth from "./components/Auth";
import Explore from "./components/Explore";
import Community from "./components/Community";
import Home from "./components/Home";
import Profile from "./components/Profile";
import NotificationsModal from "./components/NotificationsModal";
import Subscription from "./components/Subscriptions";
import AdminDashboard from "./components/AdminDashboard";
import TradeHistory from "./components/TradeHistory";
import { ManualTradeProvider } from "./contexts/ManualTradeContext";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showAuth, setShowAuth] = useState(false);
  const [authInitialLogin, setAuthInitialLogin] = useState(true);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  const [activeCategory, setActiveCategory] = useState("Crypto");
  const [activeView, setActiveView] = useState(
    () => localStorage.getItem("activeView") || "home"
  );
  
  // Global state for active community (shared between Home and Community pages)
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [communities, setCommunities] = useState([]);

  // Notification State
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [highlightedPost, setHighlightedPost] = useState(null);

  // User Profile State (for Navbar)
  const [userData, setUserData] = useState(null);

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(res.data);
      // Auto-redirect to admin if role is admin and on home (optional, but good for UX)
      if (res.data.role === 'admin' && activeView === 'home') {
        // setActiveView('admin'); // Uncomment if you want auto-redirect
     }
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
        const res = await axios.get("http://127.0.0.1:8000/api/notifications/unread_count", {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(res.data.count);
    } catch (error) {
        console.error("Failed to fetch unread count", error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/communities");
      setCommunities(res.data);
    } catch (error) {
      console.error("Failed to fetch communities", error);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchUnreadCount();

      // Set up polling for unread count every 15 seconds
      const intervalId = setInterval(() => {
        fetchUnreadCount();
      }, 15000);

      // Cleanup interval on component unmount or token change
      return () => clearInterval(intervalId);
    } else {
      setUserData(null);
      setUnreadCount(0);
    }
  }, [token]);

  const renderVerifiedBadge = (user) => {
    if (!user) return null;
    let badge = null;

    if (user.role === 'admin') {
      badge = { color: 'text-red-500', title: 'Admin' };
    } else if (user.plan === 'Platinum') {
      badge = { color: 'text-yellow-400', title: 'Platinum User' };
    }

    if (!badge) return null;

    return (
      <span title={badge.title} className={`${badge.color} ml-1`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
      </span>
    );
  };

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

  const showFlash = (message, type = 'success') => {
    setFlashMessage({ message, type });
    setIsFadingOut(false);
    setTimeout(() => setIsFadingOut(true), 2500);
    setTimeout(() => setFlashMessage(null), 3000);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackEmail || !feedbackMessage) return;
    // Simpan ke LocalStorage agar langsung muncul di Admin (Fallback/Demo)
    const newFeedback = {
      id: Date.now(), // Gunakan timestamp sebagai ID unik
      email: feedbackEmail,
      message: feedbackMessage,
      date: new Date().toISOString().split('T')[0]
    };
    const existing = JSON.parse(localStorage.getItem("local_feedbacks") || "[]");
    localStorage.setItem("local_feedbacks", JSON.stringify([newFeedback, ...existing]));

    try {
      await axios.post("http://127.0.0.1:8000/api/feedback", {
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
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeView");
    setToken(null);
    setUnreadCount(0);
    // delete data session manual trade from localstorage while logout
    if (userData?.id) {
      localStorage.removeItem(`manual_trade_session_${userData.id}`);
    }
    setUserData(null);
    setActiveCommunity(null);
    // Reset to home view on logout
    setActiveView("home");
  }, [userData]);

  // Global Axios interceptor for handling 401 errors
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // Check if it's a 401 Unauthorized error and not a login attempt
        if (error.response && error.response.status === 401 && !error.config.url.endsWith('/api/token')) {
          console.error("Sesi tidak valid atau telah berakhir. Logout otomatis.");
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on component unmount
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [handleLogout]);

  const handleBellClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) { // If we are opening it
        try {
            const res = await axios.get("http://127.0.0.1:8000/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);

            if (unreadCount > 0) {
                await axios.post("http://127.0.0.1:8000/api/notifications/mark_as_read", {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Failed to fetch/mark notifications", error);
        }
    }
  };

  const handleNotificationClick = (notification) => {
      setShowNotifications(false);
      setHighlightedPost({ postId: notification.post_id });

      if (notification.community_id) {
          const targetCommunity = communities.find(c => c.id === notification.community_id);
          if (targetCommunity) {
              setActiveCommunity(targetCommunity);
              setActiveView("community");
          }
      } else {
          setActiveView("home");
      }
  };

  useEffect(() => {
    localStorage.setItem("activeView", activeView);
  }, [activeView]);

  if (showAuth) {
    return (
      <Auth
        onLogin={(newToken) => {
          setToken(newToken);
          setShowAuth(false);
        }}
        initialIsLogin={authInitialLogin}
        onClose={() => setShowAuth(false)}
      />
    );
  }

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
  };

  const handleSimulate = async (params) => {
    setLoading(true);
    setError(null);
    try {
      // Pastikan backend berjalan di port 8000
      const response = await axios.post(
        "http://127.0.0.1:8000/api/simulate",
        params
      );
      setSimulationData(response.data);
    } catch (err) {
      console.error("Simulation Error:", err);
      setError("Gagal menghubungi server. Pastikan backend Python berjalan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan) => {
    const price = plan.finalPrice || plan.price;
    alert(`Redirecting to payment for ${plan.name} ($${price})... (Midtrans Integration Coming Soon)`);
  };

  const handleExportSimulationCSV = (data) => {
    if (!data || !data.daily_breakdown) return;
    
    const headers = ["Day", "Start Balance", "Profit/Loss", "End Balance", "ROI"];
    const csvRows = [headers.join(",")];

    data.daily_breakdown.forEach(day => {
      const row = [
        day.day,
        day.start_balance,
        day.profit_loss,
        day.end_balance,
        day.roi
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation_results_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const navItems = [
    {
      view: "home",
      title: "Home",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      view: "explore",
      title: "Explore",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18V6.375c0-.621.504-1.125 1.125-1.125H9.75" />
        </svg>
      ),
    },
    {
      view: "community",
      title: "Community",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.51.056 1.02.083 1.531.083s1.02-.027 1.531-.083m-3.062 0c.203.18.45.33.712.453m-7.5 0a9.094 9.094 0 013.741-.479 3 3 0 014.682-2.72M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7.5 3.75h15a9.094 9.094 0 00-15 0z" />
        </svg>
      ),
    },
    {
      view: "simulator",
      title: "Simulation",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans w-full flex flex-col">
      {/* Override default Vite styles that constrain width */}
      <style>{`
        body { display: block !important; }
        #root { max-width: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #111827; /* gray-900 */
        }
        ::-webkit-scrollbar-thumb {
          background: #374151; /* gray-700 */
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #4b5563; /* gray-600 */
        }
      `}</style>
      {/* Flash Message Notification */}
      {flashMessage && (
        <div className={`fixed top-24 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-500 transform ${isFadingOut ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0'} ${flashMessage.type === 'success' ? 'bg-gradient-to-r from-green-600 to-emerald-600 border border-green-400/50' : 'bg-gradient-to-r from-red-600 to-rose-600 border border-red-400/50'} text-white backdrop-blur-md`}>
            <div className={`p-1 rounded-full ${flashMessage.type === 'success' ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                {flashMessage.type === 'success' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                )}
            </div>
            <div>
                <h4 className="font-bold text-sm">{flashMessage.type === 'success' ? 'Success' : 'Error'}</h4>
                <p className="text-xs opacity-90">{flashMessage.message}</p>
            </div>
        </div>
      )}
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between w-full">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setActiveView("home")}
          >
            <img src="/tip-brand.png" alt="Trade Income Planner" className="h-10" />
              <span className="ml-2 text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-mono align-top">v1.0 PRO</span>
          </div>

          {/* Main Navigation (Center) */}
          <div className="hidden md:flex items-center space-x-1 bg-gray-900/50 p-1 rounded-full border border-gray-700/50">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                title={item.title}
                className={`p-2.5 rounded-full transition-colors custom-icon ${
                  activeView === item.view
                    ? "text-white"
                    : "text-gray-400 hover:bg-blue-600 hover:text-white"
                }`}
              >
                {item.icon}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Admin Button - Only visible for admins */}
            {userData?.role === 'admin' && (
              <button
                onClick={() => setActiveView("admin")}
                className="hidden md:block text-xs bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 border border-red-400"
              >
                🛡️ Admin Panel
              </button>
            )}
          <button
              onClick={() => setActiveView("subscription")}
              className="hidden md:block text-xs bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white px-4 py-2 rounded-full font-bold shadow-lg transition-all transform hover:scale-105"
            >
              👑 Upgrade Pro
            </button>
            {token ? (
              <>
              <button onClick={handleBellClick} className="relative text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-gray-800">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-gray-600"
                  onClick={() => setActiveView("profile")}
                >
                   {userData?.avatar_url ? (
                       <img src={`http://127.0.0.1:8000${userData.avatar_url}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-500" />
                   ) : (
                       <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs border border-gray-500">
                           {userData?.username?.substring(0, 2).toUpperCase() || "U"}
                       </div>
                   )}
                   <div className="text-sm font-bold text-white hidden sm:flex items-center">
                       {userData?.username || "User"}
                       {renderVerifiedBadge(userData)}
                    </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/50 px-3 py-1 rounded transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthInitialLogin(true);
                    setShowAuth(true);
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthInitialLogin(false);
                    setShowAuth(true);
                  }}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 px-4 py-2 rounded transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="w-full p-6 space-y-8 pt-24">
      <ManualTradeProvider userData={userData} activeSymbol={activeSymbol}>
        {activeView === "home" ? (
          <Home setActiveView={setActiveView} setActiveCommunity={setActiveCommunity} communities={communities} highlightedPost={highlightedPost} setHighlightedPost={setHighlightedPost} userData={userData} />
          ) : activeView === "profile" ? (
          <Profile onUpdateProfile={fetchUserProfile} />
        ) : activeView === "subscription" ? (
          <Subscription onSubscribe={handleSubscribe} />
        ) : activeView === "admin" ? (
          <AdminDashboard />
        ) : activeView === "explore" ? (

          <Explore />
        ) : activeView === "community" ? (
          <Community activeCommunity={activeCommunity} setActiveCommunity={setActiveCommunity} highlightedPost={highlightedPost} setHighlightedPost={setHighlightedPost} userData={userData} />
        ) : (
          <>
            {/* SECTION 1: MARKET OVERVIEW (CHART & ASSETS) */}
            <div className="space-y-6">
              {/* Asset Selection Dropdowns */}
              <div className="flex flex-col sm:flex-row gap-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="w-full sm:w-1/4">
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                    Market Category
                  </label>
                  <select
                    value={activeCategory}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      setActiveCategory(newCategory);
                      // Otomatis pilih aset pertama saat kategori berubah
                      setActiveSymbol(assetCategories[newCategory][0].symbol);
                    }}
                    className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    {Object.keys(assetCategories).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-1/4">
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                    Select Asset
                  </label>
                  <select
                    value={activeSymbol}
                    onChange={(e) => setActiveSymbol(e.target.value)}
                    className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    {assetCategories[activeCategory].map((asset) => (
                      <option key={asset.symbol} value={asset.symbol}>
                        {asset.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chart Container (Wide & Tall) */}
              <div className="h-[600px] bg-gray-800 rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                <BinanceChartWidget symbol={activeSymbol} />
              </div>
            </div>

            {/* SECTION 2: SIMULATION TOOLS */}
            <div className="space-y-8">
              {/* View Switcher */}
              <div className="flex justify-center border-b border-gray-700">
                <button
                  onClick={() => setActiveView("simulator")}
                  className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                    activeView === "simulator"
                      ? "text-gray-500 border-b-2 border-blue-500"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Strategy Simulator
                </button>
                <button
                  onClick={() => setActiveView("planner")}
                  className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                    activeView === "planner"
                      ? "text-gray-500 border-b-2 border-blue-500"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Goal Planner
                </button>
                <button
                  onClick={() => setActiveView("manual")}
                  className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                    activeView === "manual"
                      ? "text-gray-500 border-b-2 border-blue-500"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Manual Trade
                </button>
                <button
                  onClick={() => setActiveView("trade_history")}
                  className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                    activeView === "trade_history"
                      ? "text-gray-500 border-b-2 border-blue-500"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  History
                </button>
              </div>
                {activeView === "simulator" && (
                  <div className="space-y-6">
                    <SimulationForm
                      onSimulate={handleSimulate}
                      isLoading={loading}
                    />
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
                            onClick={() => handleExportSimulationCSV(simulationData)}
                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            Export Results (CSV)
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="bg-gray-800 p-10 rounded-lg border border-gray-700 text-center h-[300px] flex flex-col justify-center items-center text-gray-500">
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
                          Masukkan parameter di atas dan klik "Jalankan Simulasi"
                          untuk melihat hasil.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {activeView === "planner" && <GoalPlanner />}
                {activeView === "manual" && (
                  <ManualTradeSimulator activeSymbol={activeSymbol} />
                )}
                {activeView === "trade_history" && <TradeHistory />}
            </div>
          </>
        )}
      </ManualTradeProvider>
      </div>
      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-auto py-8 z-10 relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="text-center md:text-left">
          <div className="flex justify-center md:justify-start mb-2">
              <img src="/tip-brand.png" alt="Trade Income Planner" className="h-15" />
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Professional Equity Simulator & Trading Assistant
            </p>
            <div className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Trade Income Planner.<br/>All rights reserved.
            </div>
          </div>

          {/* Feedback Form */}
          <div className="md:col-span-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
            <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase">Send Feedback</h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={userData?.username || "Guest"}
                  disabled
                  className="sm:col-span-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-500 font-bold cursor-not-allowed focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  disabled={!!userData}
                  className={`sm:col-span-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none ${userData ? 'text-gray-500 cursor-not-allowed' : ''}`}
                  required
                />
                <input
                  type="text"
                  placeholder="Your Feedback / Suggestion..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="sm:col-span-2 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div className="text-right">
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors">
                  Send
                </button>
              </div>
            </form>
          </div>
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
  );
}

export default App;
