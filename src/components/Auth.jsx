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
        // Server merespon dengan kode error (misal: 400, 401, 500)
        msg = err.response.data.detail || "Failed to process request.";
      } else if (err.request) {
        // Tidak ada respon dari server (Backend mati atau terblokir CORS)
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
      <style>{`
        body { display: block !important; margin: 0; }
        #root { max-width: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
      `}</style>
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-8 shadow-2xl relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-xl"
            >
              &times;
            </button>
          )}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-400 mt-2">
              {isLogin
                ? "Login to access your trading plan"
                : "Start your journey to trading mastery"}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-2 rounded mb-6 text-sm animate-fade-in">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              {!isLogin && (
                <>
                  <button 
                    type="button" 
                    onClick={checkUsernameAvailability}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 px-4 py-2 rounded transition-colors mt-2"
                  >
                    Check Username
                  </button>
                  {usernameError && <p className="text-red-400 text-xs mt-2">{usernameError}</p>}
                  {isUsernameAvailable === true && (
                    <p className="text-green-400 text-xs mt-2">✓ Username can be used!.</p>
                  )}
                  {isUsernameAvailable === false && (
                    <p className="text-red-400 text-xs mt-2">✗ Username already exist.</p>
                  )}
                  {isUsernameAvailable === null && usernameError === "" && username !== "" && (
                    <p className="text-gray-400 text-xs mt-2">Click check username to verify.</p>
                  )}
                </>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {!isLogin && (
              <div className="grid grid-cols-2 gap-2">
                <div ref={countryDropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Country Code
                  </label>
                  <div 
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer flex justify-between items-center"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  >
                    <span>{countryCode}</span>
                    <span className="text-xs text-gray-500">▼</span>
                  </div>
                  
                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 w-full bg-gray-800 border border-gray-600 rounded mt-1 z-50 max-h-60 overflow-y-auto shadow-xl">
                      <div className="p-2 sticky top-0 bg-gray-800 border-b border-gray-700">
                        <input 
                          type="text" 
                          placeholder="Search country..." 
                          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredCountries.map((country, idx) => (
                        <div 
                          key={`${country.name}-${idx}`}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-300 flex justify-between items-center"
                          onClick={() => {
                            setCountryCode(country.code);
                            setIsCountryDropdownOpen(false);
                            setCountrySearch("");
                          }}
                        >
                          <span className="truncate mr-2">{country.name}</span>
                          <span className="text-gray-500 whitespace-nowrap">{country.code}</span>
                        </div>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">No results</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
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
                    className="text-xs text-blue-400 hover:underline"
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
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
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
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : isLogin
                ? "Sign In"
                : "Sign Up"}
            </button>
            
            <div className="space-y-3 mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-gray-800 text-gray-500">or continue with</span>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href="http://localhost:8000/auth/google"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-800 hover:border-blue-500 transition-all text-white text-sm font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23.99-3.71.99-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </a>

                <a
                  href="http://localhost:8000/auth/facebook"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-800 hover:border-blue-500 transition-all text-white text-sm font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877f2">
                    <path d="M20.007 4.006a10.007 10.007 0 0 0-10.007 10.007A9.999 9.999 0 0 1 9.892 19H7.993a1 1 0 0 1-1-1V17h2.899a3.993 3.993 0 0 1 3.993-3.993h.001a3.992 3.992 0 0 1 2.799 1.186A10 10 0 0 0 20.007 4.006ZM11 15.997V13h2v2.997h-2Zm0-3.001h2V10h-2v2.999Z"/>
                  </svg>
                  Facebook
                </a>
              </div>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-blue-400 hover:text-blue-300 font-medium"
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
