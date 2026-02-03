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
                  {isUsernameAvailable === false && (
                    <p className="text-red-400 text-xs mt-2">✗ Username already exist.</p>
                  )}
                  {isUsernameAvailable === true && (
                    <p className="text-green-400 text-xs mt-2">✓ Username can be used!.</p>
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
// Country codes data for the country code dropdown
// Source: https://www.iban.com/country-codes

export default Auth;
