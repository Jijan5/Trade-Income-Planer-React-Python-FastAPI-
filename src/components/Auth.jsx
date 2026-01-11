import React, { useState } from "react";
import api from "../lib/axios";

const Auth = ({ onLogin, initialIsLogin = true, onClose }) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        // Login Request (Form Data format required by OAuth2PasswordRequestForm)
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        response = await api.post(
          "/token",
          formData
        );
      } else {
        // Register Request (JSON format)
        response = await api.post("/register", {
          username,
          email,
          password,
        });
      }

      // Save token and notify parent
      const token = response.data.access_token;
      localStorage.setItem("token", token);
      onLogin(token);
    } catch (err) {
      console.error(err);
      let msg = "Terjadi kesalahan.";
      if (err.response) {
        // Server merespon dengan kode error (misal: 400, 401, 500)
        msg = err.response.data.detail || "Failed to process request.";
      } else if (err.request) {
        // Tidak ada respon dari server (Backend mati atau terblokir CORS)
        msg = "Unable to connect to the server. Ensure that the Python backend is running.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        body { display: block !important; margin: 0; }
        #root { max-width: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
      `}</style>
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-8 shadow-2xl relative">
          {onClose && (
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-xl">
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
                : "Start your journey to financial freedom"}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded mb-6 text-sm">
              {error}
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
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
