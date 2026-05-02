import React, { useState } from "react";
import api from "../lib/axios";

const ContactUs = ({ showFlash }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      showFlash("Please fill out all fields.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/contact", formData);
      showFlash(
        "Message sent successfully! We will get back to you shortly.",
        "success"
      );
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        "Failed to send message. Please try again later.";
      showFlash(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-engine-bg text-white py-20 animate-fade-in relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-engine-button/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <h1 className="text-4xl font-extrabold mb-6 text-center uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">CONTACT US</h1>
        <p className="mb-12 text-engine-neon/70 text-center font-medium max-w-2xl mx-auto">
          We'd love to hear from you! Please use the form below to send us a
          message or reach out via the contact information provided.
        </p>

        <div className="bg-engine-panel/80 backdrop-blur-md rounded-2xl border border-engine-neon/20 shadow-[0_0_30px_rgba(var(--engine-neon-rgb),0.05)] p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-[11px] text-engine-neon/70 font-extrabold uppercase tracking-widest mb-3"
              >
                NAME
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-engine-bg border border-engine-neon/30 rounded-xl p-4 text-white focus:border-engine-neon focus:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)] outline-none font-mono text-sm transition-all placeholder:text-engine-neon/20"
                placeholder="YOUR NAME"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] text-engine-neon/70 font-extrabold uppercase tracking-widest mb-3"
              >
                EMAIL
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-engine-bg border border-engine-neon/30 rounded-xl p-4 text-white focus:border-engine-neon focus:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)] outline-none font-mono text-sm transition-all placeholder:text-engine-neon/20"
                placeholder="YOUR EMAIL"
              />
            </div>
            <div>
              <label
                htmlFor="subject"
                className="block text-[11px] text-engine-neon/70 font-extrabold uppercase tracking-widest mb-3"
              >
                SUBJECT
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-engine-bg border border-engine-neon/30 rounded-xl p-4 text-white focus:border-engine-neon focus:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)] outline-none font-mono text-sm transition-all placeholder:text-engine-neon/20"
                placeholder="SUBJECT"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-[11px] text-engine-neon/70 font-extrabold uppercase tracking-widest mb-3"
              >
                MESSAGE
              </label>
              <textarea
                id="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-engine-bg border border-engine-neon/30 rounded-xl p-4 text-white focus:border-engine-neon focus:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)] outline-none font-mono text-sm transition-all placeholder:text-engine-neon/20 resize-none custom-scrollbar"
                placeholder="YOUR MESSAGE..."
              ></textarea>
            </div>
            <div className="pt-4">
              <button
                className="w-full bg-engine-button hover:bg-[#00e5ff] text-engine-bg px-8 py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.4)] hover:shadow-[0_0_25px_rgba(var(--engine-neon-rgb),0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "SENDING..." : "SEND MESSAGE"}
              </button>
            </div>
          </form>

          <div className="mt-12 border-t border-engine-neon/20 pt-8 text-center">
            <h2 className="text-[11px] font-extrabold text-engine-neon/50 uppercase tracking-widest mb-4">CONTACT INFORMATION</h2>
            <p className="text-engine-neon font-mono font-bold drop-shadow-[0_0_3px_#00cfff]">
              support@tradeincomeplanner.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
