import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { countryCodes } from "../utils/countryCodes";
import api from "../lib/axios";

const Auth = ({ onLogin, initialIsLogin = true, onClose }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+1"); // Default to US
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Country Dropdown State
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef(null);

  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateUsername = (username) => {
    if (username.includes(' ')) {
      return 'Usernames cannot contain spaces.';
    }
    if (!/^[a-zA-Z0-9_-]*$/.test(username)) {
      return 'Usernames can only contain letters, numbers, _, and -.';
    }
    if (username.length < 3 || username.length > 20) {
      return 'Usernames must be between 3 and 20 characters long.';
    }
    return '';
  };

  const checkUsernameAvailability = async () => {
    const error = validateUsername(username);
    setUsernameError(error);

    if (error) {
      setIsUsernameAvailable(null);
      return;
    }

    try {
      setLoading(true);
      setIsUsernameAvailable(null);
      setUsernameError("")
      const response = await api.post('/check_username', { username: username });
      setIsUsernameAvailable(response.data.available);
    } catch (error) {
      console.error('Error checking username:', error);
      setIsUsernameAvailable(false); 
    } finally {
      setLoading(false);
    }
  };

  const isEmoji = (str) => {
    const emojiRegex = new RegExp('(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])');
    return emojiRegex.test(str);
  }

  useEffect(() => {
    if (isEmoji(username)) {
        setUsernameError('Usernames cannot contain emojis.');
        setIsUsernameAvailable(null);
    }
  }, [username]);

  useEffect(() => {
      setUsernameError(validateUsername(username));
  }, [username])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (isUsernameAvailable !== true && !isLogin) {
      setUsernameError("Username has not been checked for availability, or is not available.")
      setLoading(false);
      return;
    }
    try {
      if (isLogin) {
        // Login Request (Form Data format required by OAuth2PasswordRequestForm)
        const params = new URLSearchParams();
        params.append("username", username);
        params.append("password", password);

        const response = await api.post("/token", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        // Save token and notify parent
        const token = response.data.access_token;
        localStorage.setItem("token", token);
        onLogin(token);
      } else {
        // Register Request (JSON format)
        await api.post("/register", {
          username,
          email,
          password,
          full_name: fullName,
          country_code: countryCode,
          phone_number: phoneNumber,
        });
        setSuccess("Registration successful! Please login.");
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
      }

    } catch (err) {
      console.error(err);
      let msg = "An error occured.";
      if (err.response) {
        msg = err.response.data.detail || "Failed to process request.";
      } else if (err.request) {
        msg =
          "Unable to connect to the server. Ensure that the Python backend is running.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = useMemo(() => countryCodes.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  ), [countrySearch]);

  return (
    <>
      {/* Global Styles + Animated Background */}
      <style>{`
        body { display: block !important; margin: 0; }
        #root { max-width: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* ── Wrapper ── */
        .auth-bg-container {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
        }

        /* ── Horizontal streaks ── */
        .auth-neon-line {
          position: absolute;
          background: linear-gradient(90deg, transparent, rgba(0,207,255,0.7), transparent);
          height: 1px; width: 300px; opacity: 0;
          animation: authMoveLine linear infinite;
        }
        .auth-neon-line:nth-child(1)  { top:  8%; animation-duration: 18s; animation-delay:  0s; }
        .auth-neon-line:nth-child(2)  { top: 22%; animation-duration: 24s; animation-delay:  3s; animation-direction: reverse; }
        .auth-neon-line:nth-child(3)  { top: 40%; animation-duration: 20s; animation-delay:  6s; }
        .auth-neon-line:nth-child(4)  { top: 58%; animation-duration: 27s; animation-delay:  1s; animation-direction: reverse; }
        .auth-neon-line:nth-child(5)  { top: 72%; animation-duration: 22s; animation-delay:  9s; }
        .auth-neon-line:nth-child(6)  { top: 88%; animation-duration: 30s; animation-delay:  4s; animation-direction: reverse; }
        @keyframes authMoveLine {
          0%   { transform: translateX(-320px); opacity: 0; }
          8%   { opacity: 0.5; }
          92%  { opacity: 0.5; }
          100% { transform: translateX(110vw);  opacity: 0; }
        }

        /* ── Vertical streaks ── */
        .auth-neon-line-v {
          position: absolute;
          background: linear-gradient(180deg, transparent, rgba(0,207,255,0.5), transparent);
          width: 1px; height: 400px; opacity: 0;
          animation: authMoveLineV linear infinite;
        }
        .auth-neon-line-v:nth-child(7)  { left: 12%; animation-duration: 22s; animation-delay:  0s; }
        .auth-neon-line-v:nth-child(8)  { left: 35%; animation-duration: 28s; animation-delay:  5s; animation-direction: reverse; }
        .auth-neon-line-v:nth-child(9)  { left: 55%; animation-duration: 19s; animation-delay:  2s; }
        .auth-neon-line-v:nth-child(10) { left: 78%; animation-duration: 25s; animation-delay:  8s; animation-direction: reverse; }
        .auth-neon-line-v:nth-child(11) { left: 93%; animation-duration: 32s; animation-delay: 11s; }
        @keyframes authMoveLineV {
          0%   { transform: translateY(-420px); opacity: 0; }
          8%   { opacity: 0.3; }
          92%  { opacity: 0.3; }
          100% { transform: translateY(110vh);  opacity: 0; }
        }

        /* ── Full-screen scan line ── */
        .auth-scan-line {
          position: absolute; left: 0; width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(0,207,255,0.15) 30%, rgba(0,207,255,0.4) 50%, rgba(0,207,255,0.15) 70%, transparent 100%);
          animation: authScanDown 10s ease-in-out infinite;
          opacity: 0;
        }
        @keyframes authScanDown {
          0%   { top: -2px;   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 0.6; }
          100% { top: 100vh;  opacity: 0; }
        }

        /* ── Floating glowing orbs ── */
        .auth-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); animation: authFloatOrb ease-in-out infinite alternate;
        }
        .auth-orb-1 { width: 600px; height: 600px; top: -10%; left: -12%;
                 background: rgba(0,207,255,0.09); animation-duration: 14s; }
        .auth-orb-2 { width: 500px; height: 500px; bottom: -8%; right: -10%;
                 background: rgba(120,40,200,0.07); animation-duration: 18s; animation-delay: 3s; }
        .auth-orb-3 { width: 350px; height: 350px; top: 35%; left: 40%;
                 background: rgba(0,207,255,0.05); animation-duration: 22s; animation-delay: 6s; }
        @keyframes authFloatOrb {
          0%   { transform: translate(0px,  0px)  scale(1);   }
          33%  { transform: translate(30px,-40px) scale(1.05); }
          66%  { transform: translate(-20px,20px) scale(0.97); }
          100% { transform: translate(10px,-20px) scale(1.03); }
        }

        /* ── Perspective grid floor ── */
        .auth-grid-floor {
          position: absolute; bottom: 0; left: 0; width: 100%; height: 50%;
          background-image:
            linear-gradient(rgba(0,207,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,207,255,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
          transform: perspective(700px) rotateX(55deg);
          transform-origin: bottom center;
          mask-image: linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 70%);
          -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 70%);
          animation: authGridPulse 6s ease-in-out infinite alternate;
        }
        @keyframes authGridPulse { 0% { opacity: 0.6; } 100% { opacity: 1.0; } }

        /* ── Dot particle field ── */
        .auth-dot-field {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(0,207,255,0.18) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: authDriftField 40s linear infinite;
          opacity: 0.3;
        }
        @keyframes authDriftField {
          0%   { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }

        /* ── Corner bracket accents ── */
        .auth-corner { position: absolute; width: 50px; height: 50px; opacity: 0.2; }
        .auth-corner-tl { top: 14px; left: 14px; border-top: 1.5px solid #00cfff; border-left: 1.5px solid #00cfff; }
        .auth-corner-tr { top: 14px; right: 14px; border-top: 1.5px solid #00cfff; border-right: 1.5px solid #00cfff; }
        .auth-corner-bl { bottom: 14px; left: 14px; border-bottom: 1.5px solid #00cfff; border-left: 1.5px solid #00cfff; }
        .auth-corner-br { bottom: 14px; right: 14px; border-bottom: 1.5px solid #00cfff; border-right: 1.5px solid #00cfff; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center bg-[#030308] px-4 relative overflow-hidden font-sans">

        {/* ── Rich Animated Background ── */}
        <div className="auth-bg-container">
          {/* Horizontal streaks */}
          <div className="auth-neon-line"></div>
          <div className="auth-neon-line"></div>
          <div className="auth-neon-line"></div>
          <div className="auth-neon-line"></div>
          <div className="auth-neon-line"></div>
          <div className="auth-neon-line"></div>
          {/* Vertical streaks */}
          <div className="auth-neon-line-v"></div>
          <div className="auth-neon-line-v"></div>
          <div className="auth-neon-line-v"></div>
          <div className="auth-neon-line-v"></div>
          <div className="auth-neon-line-v"></div>
          {/* Scan line sweep */}
          <div className="auth-scan-line"></div>
          {/* Floating ambient orbs */}
          <div className="auth-orb auth-orb-1"></div>
          <div className="auth-orb auth-orb-2"></div>
          <div className="auth-orb auth-orb-3"></div>
          {/* Perspective grid floor */}
          <div className="auth-grid-floor"></div>
          {/* Drifting dot particle field */}
          <div className="auth-dot-field"></div>
          {/* Corner bracket accents */}
          <div className="auth-corner auth-corner-tl"></div>
          <div className="auth-corner auth-corner-tr"></div>
          <div className="auth-corner auth-corner-bl"></div>
          <div className="auth-corner auth-corner-br"></div>
        </div>

        <div className="max-w-md w-full bg-[#0a0f1c]/80 backdrop-blur-xl rounded-2xl border border-[#00cfff]/20 p-8 shadow-[0_0_40px_rgba(0,207,255,0.05)] relative z-10 transition-all">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-[#00cfff] transition-colors font-bold text-2xl leading-none"
            >
              &times;
            </button>
          )}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-400 mt-2 font-light">
              {isLogin
                ? "Login to access your trading plan"
                : "Start your journey to trading mastery"}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-500/50 text-green-200 px-4 py-3 rounded-xl mb-6 text-sm shadow-[0_0_15px_rgba(34,197,94,0.1)] animate-fade-in">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all"
              />
              {!isLogin && (
                <>
                  <button 
                    type="button" 
                    onClick={checkUsernameAvailability}
                    className="text-xs bg-[#00cfff]/10 hover:bg-[#00cfff]/20 text-[#00cfff] border border-[#00cfff]/30 px-4 py-2 rounded-lg transition-all mt-2 shadow-[0_0_10px_rgba(0,207,255,0.05)]"
                  >
                    Check Username
                  </button>
                  {usernameError && <p className="text-red-400 text-xs mt-2">{usernameError}</p>}
                  {isUsernameAvailable === true && (
                    <p className="text-[#00cfff] text-xs mt-2 font-medium">✓ Username can be used!</p>
                  )}
                  {isUsernameAvailable === false && (
                    <p className="text-red-400 text-xs mt-2 font-medium">✗ Username already exists.</p>
                  )}
                  {isUsernameAvailable === null && usernameError === "" && username !== "" && (
                    <p className="text-gray-400 text-xs mt-2 font-light">Click check username to verify.</p>
                  )}
                </>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all"
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all"
                />
              </div>
            )}

            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div ref={countryDropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Country Code
                  </label>
                  <div 
                    className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00cfff] cursor-pointer flex justify-between items-center transition-all"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  >
                    <span>{countryCode}</span>
                    <span className="text-xs text-[#00cfff]">▼</span>
                  </div>
                  
                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 w-full bg-[#0a0f1c]/95 backdrop-blur-md border border-[#00cfff]/30 rounded-xl mt-2 z-50 max-h-60 overflow-y-auto shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                      <div className="p-2 sticky top-0 bg-[#0a0f1c] border-b border-[#00cfff]/20 z-10">
                        <input 
                          type="text" 
                          placeholder="Search..." 
                          className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00cfff] transition-all"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredCountries.map((country, idx) => (
                        <div 
                          key={`${country.name}-${idx}`}
                          className="px-4 py-2.5 hover:bg-[#00cfff]/10 cursor-pointer text-sm text-gray-300 flex justify-between items-center transition-colors"
                          onClick={() => {
                            setCountryCode(country.code);
                            setIsCountryDropdownOpen(false);
                            setCountrySearch("");
                          }}
                        >
                          <span className="truncate mr-2">{country.name}</span>
                          <span className="text-[#00cfff] whitespace-nowrap">{country.code}</span>
                        </div>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div className="px-3 py-3 text-sm text-gray-500 text-center">No results</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-400">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/forgot-password");
                      setTimeout(() => {
                        if (onClose) onClose();
                      }, 50);
                    }}
                    className="text-xs text-[#00cfff] hover:text-[#00b3e6] transition-colors hover:drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-[#00cfff] transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] pr-10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-[#00cfff] transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00cfff] hover:bg-[#00b3e6] text-[#030308] font-extrabold py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,207,255,0.2)] hover:shadow-[0_0_20px_rgba(0,207,255,0.4)] mt-4"
            >
              {loading
                ? "Processing..."
                : isLogin
                ? "Sign In"
                : "Sign Up"}
            </button>
            
            <div className="space-y-4 mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#00cfff]/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-3 bg-[#0a0f1c] text-gray-500 font-bold">or continue with</span>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href="http://localhost:8000/auth/google"
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#030308] border border-[#00cfff]/20 rounded-xl hover:bg-[#00cfff]/5 hover:border-[#00cfff]/50 hover:shadow-[0_0_15px_rgba(0,207,255,0.1)] transition-all text-white text-sm font-bold"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23.99-3.71.99-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </a>
              </div>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm font-light">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-[#00cfff] hover:text-[#00b3e6] font-bold transition-colors hover:drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-[#00cfff] hover:text-[#00b3e6] font-bold transition-colors hover:drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]"
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const OAuthCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    localStorage.setItem('token', token);
    window.parent.postMessage({ type: 'LOGIN_SUCCESS', token }, '*');
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  return null;
};

export { Auth, OAuthCallback };

// Country codes data for the country code dropdown
// Source: https://www.iban.com/country-codes

export default Auth;
