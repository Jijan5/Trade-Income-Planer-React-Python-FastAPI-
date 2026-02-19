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
    <div className="p-6 bg-gray-800 text-white">
      <h2 className="text-2xl font-bold mb-4">Contact Us Messages</h2>
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="bg-gray-900 p-4 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-blue-400">{message.name}</p>
                <p className="text-sm text-gray-400">{message.email}</p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(message.created_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-3">
              <p className="font-semibold">{message.subject}</p>
              <p className="text-gray-300 mt-1">{message.message}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleReplyClick(message)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Reply
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-2xl max-w-lg w-full text-left">
            <h3 className="text-lg font-bold text-white mb-4">
              Reply to {selectedMessage.name}
            </h3>

            {/* Original Message Preview */}
            <div className="mb-4 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                <strong>Original Subject:</strong> {selectedMessage.subject}
              </p>
              <p className="text-sm text-gray-300 mt-2 line-clamp-3">
                {selectedMessage.message}
              </p>
            </div>

            {/* Reply Form */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="reply-subject"
                  className="block text-sm font-bold text-gray-400 mb-1"
                >
                  Subject
                </label>
                <input
                  id="reply-subject"
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Reply subject..."
                />
              </div>
              <div>
                <label
                  htmlFor="reply-body"
                  className="block text-sm font-bold text-gray-400 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="reply-body"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows="5"
                  placeholder="Your reply..."
                ></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReplySubmit}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
