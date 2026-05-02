import React, { useState, useEffect } from "react";
import api from "../lib/axios";

const ContactMessages = ({ showFlash }) => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  // Effect to disable body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  const fetchMessages = async () => {
    try {
      const response = await api.get("/admin/contact-messages");
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      if (showFlash) showFlash("Failed to fetch contact messages.", "error");
    }
  };

  const handleReplyClick = (message) => {
    setSelectedMessage(message);
    setReplySubject(`Re: ${message.subject}`);
    setShowModal(true);
  };

  const handleReplySubmit = async () => {
    if (!replyBody.trim()) {
      if (showFlash) showFlash("Reply message cannot be empty.", "error");
      return;
    }
    try {
      await api.post(`/admin/contact-messages/${selectedMessage.id}/reply`, {
        subject: replySubject,
        message: replyBody,
        recipient_email: selectedMessage.email,
      });

      setShowModal(false);
      setReplySubject("");
      setReplyBody("");

      // Remove the message from the list
      setMessages(messages.filter((msg) => msg.id !== selectedMessage.id));

      if (showFlash) showFlash("Reply sent successfully!", "success");
    } catch (error) {
      console.error("Error sending reply:", error);
      if (showFlash)
        showFlash("Failed to send reply. Please try again.", "error");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMessage(null);
    setReplySubject("");
    setReplyBody("");
  };

  return (
    <div className="p-8 bg-engine-bg min-h-screen text-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-engine-button/5 rounded-full blur-[120px] pointer-events-none"></div>

      <h2 className="text-2xl font-extrabold mb-8 uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">CONTACT US MESSAGES</h2>
      <div className="space-y-6 max-w-5xl mx-auto">
        {messages.length === 0 && (
          <p className="text-engine-neon/50 text-center py-10 text-[11px] font-extrabold uppercase tracking-widest bg-engine-panel/80 backdrop-blur-md rounded-2xl border border-engine-neon/20">NO NEW MESSAGES.</p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className="bg-engine-panel/80 backdrop-blur-md p-6 rounded-2xl border border-engine-neon/20 shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.05)] hover:border-engine-neon/40 transition-all group"
          >
            <div className="flex justify-between items-start mb-4 border-b border-engine-neon/10 pb-4">
              <div>
                <p className="font-extrabold text-engine-neon uppercase tracking-widest drop-shadow-[0_0_2px_#00cfff]">{message.name}</p>
                <p className="text-[10px] text-engine-neon/50 font-mono mt-1">{message.email}</p>
              </div>
              <span className="text-[9px] text-engine-neon/40 font-mono uppercase tracking-widest">
                {new Date(message.created_at).toLocaleString()}
              </span>
            </div>
            <div>
              <p className="text-sm font-extrabold text-white mb-2">{message.subject}</p>
              <p className="text-engine-neon/70 text-sm leading-relaxed">{message.message}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleReplyClick(message)}
                className="bg-engine-button/10 text-engine-neon border border-engine-neon/30 hover:bg-engine-button hover:text-engine-bg px-6 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.4)] hover:-translate-y-0.5"
              >
                REPLY
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-engine-bg/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-engine-panel/95 border border-engine-neon/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(var(--engine-neon-rgb),0.1)] max-w-lg w-full text-left relative overflow-hidden">
             {/* Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-engine-button/10 rounded-full blur-[50px] pointer-events-none"></div>

            <h3 className="text-lg font-extrabold text-engine-neon uppercase tracking-widest drop-shadow-[0_0_5px_var(--engine-neon)] mb-6">
              REPLY TO {selectedMessage.name}
            </h3>

            {/* Original Message Preview */}
            <div className="mb-6 bg-engine-bg/60 p-4 rounded-xl border border-engine-neon/20">
              <p className="text-[10px] text-engine-neon/50 font-mono">
                <strong className="text-engine-neon/80 uppercase tracking-widest">ORIGINAL SUBJECT:</strong> {selectedMessage.subject}
              </p>
              <p className="text-sm text-engine-neon/70 mt-3 line-clamp-3 leading-relaxed">
                "{selectedMessage.message}"
              </p>
            </div>

            {/* Reply Form */}
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="reply-subject"
                  className="block text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest mb-2"
                >
                  SUBJECT
                </label>
                <input
                  id="reply-subject"
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full bg-engine-bg text-white border border-engine-neon/30 rounded-xl px-4 py-3 focus:outline-none focus:border-engine-neon focus:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)] font-mono text-sm placeholder:text-engine-neon/20 transition-all"
                  placeholder="REPLY SUBJECT..."
                />
              </div>
              <div>
                <label
                  htmlFor="reply-body"
                  className="block text-[10px] font-extrabold text-engine-neon/70 uppercase tracking-widest mb-2"
                >
                  MESSAGE
                </label>
                <textarea
                  id="reply-body"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="w-full bg-engine-bg text-white border border-engine-neon/30 rounded-xl px-4 py-3 focus:outline-none focus:border-engine-neon focus:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)] font-mono text-sm placeholder:text-engine-neon/20 transition-all custom-scrollbar resize-none"
                  rows="5"
                  placeholder="YOUR REPLY..."
                ></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end mt-8 relative z-10">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 rounded-xl bg-engine-bg border border-engine-neon/30 hover:bg-engine-button/10 text-engine-neon text-[11px] font-extrabold uppercase tracking-widest transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleReplySubmit}
                className="bg-engine-button hover:bg-[#00e5ff] text-engine-bg text-[11px] font-extrabold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.4)] hover:shadow-[0_0_25px_rgba(var(--engine-neon-rgb),0.6)] hover:-translate-y-0.5"
              >
                SEND REPLY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
