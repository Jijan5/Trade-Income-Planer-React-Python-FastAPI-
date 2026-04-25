import React, { useState } from "react";
import api from "../lib/axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = ({ showFlash }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: PIN, 3: New Password
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const showMessage = (text, type = "error") => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/forgot-password", { email, tenant_id: 1 });
      showMessage("PIN sent to email", "success");
      setStep(2);
    } catch (error) {
      const errorDetail = error.response?.data?.detail;
      if (Array.isArray(errorDetail) && errorDetail.length > 0) {
        // Pydantic v2 validation error format
        showMessage(errorDetail[0].msg || "Invalid input");
      } else if (typeof errorDetail === "string") {
        // Other string-based errors
        showMessage(errorDetail);
      } else {
        showMessage("Failed to send PIN. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/verify-reset-pin", { email, pin, tenant_id: 1 });
      setStep(3);
    } catch (error) {
      const errorDetail = error.response?.data?.detail;
      if (Array.isArray(errorDetail) && errorDetail.length > 0) {
        showMessage(errorDetail[0].msg || "Invalid input");
      } else if (typeof errorDetail === "string") {
        showMessage(errorDetail);
      } else {
        showMessage("Invalid or expired PIN.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return showMessage("Passwords do not match");
    }
    setLoading(true);
    try {
      await api.post("/reset-password", {
        email,
        pin,
        new_password: passwords.new,
        confirm_password: passwords.confirm,
        tenant_id: 1,
      });
      showFlash("Password reset successful! Please login.", "success");
      navigate("/");
    } catch (error) {
      const errorDetail = error.response?.data?.detail;
      if (Array.isArray(errorDetail) && errorDetail.length > 0) {
        showMessage(errorDetail[0].msg || "Invalid input");
      } else if (typeof errorDetail === "string") {
        showMessage(errorDetail);
      } else {
        showMessage("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030308] px-4 animate-fade-in relative overflow-hidden">
      {/* Cyberpunk Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00cfff]/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#0a0f1c]/90 backdrop-blur-xl p-10 rounded-3xl border border-[#00cfff]/30 shadow-[0_0_50px_rgba(0,207,255,0.1)] relative z-10">
        <h2 className="text-2xl font-extrabold text-white mb-8 text-center uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {step === 1 && "FORGOT PASSWORD"}
          {step === 2 && "ENTER PIN"}
          {step === 3 && "RESET PASSWORD"}
        </h2>

        {message.text && (
          <div
            className={`p-4 rounded-xl mb-6 text-[10px] font-extrabold uppercase tracking-widest text-center border shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
              message.type === "success"
                ? "bg-green-900/20 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]"
                : "bg-red-900/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
            }`}
          >
            {message.text}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] text-[#00cfff]/70 font-extrabold uppercase tracking-widest mb-3">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-4 text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono text-sm transition-all placeholder:text-[#00cfff]/20"
                placeholder="YOUR EMAIL"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00cfff] hover:bg-[#00e5ff] text-[#030308] px-8 py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "SENDING..." : "SEND PIN"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <p className="text-[10px] text-[#00cfff]/70 font-extrabold uppercase tracking-widest text-center mb-6">
              CHECK YOUR VS CODE TERMINAL FOR THE 6-DIGIT PIN.
            </p>
            <div>
              <label className="block text-[11px] text-[#00cfff]/70 font-extrabold uppercase tracking-widest mb-3 text-center">
                6-DIGIT PIN
              </label>
              <input
                type="text"
                required
                maxLength="6"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-4 text-[#00cfff] text-center tracking-[1em] font-extrabold text-2xl focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono transition-all drop-shadow-[0_0_5px_#00cfff]"
                placeholder="------"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00cfff] hover:bg-[#00e5ff] text-[#030308] px-8 py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "VERIFYING..." : "VERIFY PIN"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] text-[#00cfff]/70 font-extrabold uppercase tracking-widest mb-3">
                NEW PASSWORD
              </label>
              <input
                type="password"
                required
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
                className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-4 text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono text-sm transition-all"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#00cfff]/70 font-extrabold uppercase tracking-widest mb-3">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                required
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
                className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-4 text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono text-sm transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00cfff] hover:bg-[#00e5ff] text-[#030308] px-8 py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "RESETTING..." : "RESET PASSWORD"}
            </button>
          </form>
        )}

        <button
          onClick={() => navigate("/")}
          className="w-full mt-8 text-[#00cfff]/50 hover:text-[#00cfff] text-[10px] font-extrabold uppercase tracking-widest transition-all drop-shadow-[0_0_3px_rgba(0,207,255,0)] hover:drop-shadow-[0_0_5px_currentColor]"
        >
          BACK TO LOGIN
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
