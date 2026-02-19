import React from 'react';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-20">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Contact Us</h1>
        <p className="mb-6 text-gray-400 text-center">
          We'd love to hear from you! Please use the form below to send us a message or reach out via the contact information provided.
        </p>

        <div className="rounded-lg bg-gray-800 shadow-lg p-8">
          <form>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-300 text-sm font-bold mb-2">Name</label>
              <input type="text" id="name" className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white" placeholder="Your Name" />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">Email</label>
              <input type="email" id="email" className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white" placeholder="Your Email" />
            </div>
            <div className="mb-4">
              <label htmlFor="subject" className="block text-gray-300 text-sm font-bold mb-2">Subject</label>
              <input type="text" id="subject" className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white" placeholder="Subject" />
            </div>
            <div className="mb-6">
              <label htmlFor="message" className="block text-gray-300 text-sm font-bold mb-2">Message</label>
              <textarea id="message" rows="5" className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white" placeholder="Your Message"></textarea>
            </div>
            <div className="flex items-center justify-between">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                Send Message
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-gray-700 pt-8">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <p className="text-gray-400">Email: support@tradeincomeplanner.com</p>
            <p className="text-gray-400">Phone: +1 (555) 123-4567</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;