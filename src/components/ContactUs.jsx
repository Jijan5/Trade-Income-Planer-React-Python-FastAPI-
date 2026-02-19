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
    <div className="min-h-screen bg-gray-900 text-white py-20">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Contact Us</h1>
        <p className="mb-6 text-gray-400 text-center">
          We'd love to hear from you! Please use the form below to send us a
          message or reach out via the contact information provided.
        </p>

        <div className="rounded-lg bg-gray-800 shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-gray-300 text-sm font-bold mb-2"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
                placeholder="Your Name"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-300 text-sm font-bold mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
                placeholder="Your Email"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="subject"
                className="block text-gray-300 text-sm font-bold mb-2"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
                placeholder="Subject"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="message"
                className="block text-gray-300 text-sm font-bold mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
                placeholder="Your Message"
              ></textarea>
            </div>
            <div className="flex items-center justify-between">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-400"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-gray-700 pt-8">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <p className="text-gray-400">
              Email: support@tradeincomeplanner.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
