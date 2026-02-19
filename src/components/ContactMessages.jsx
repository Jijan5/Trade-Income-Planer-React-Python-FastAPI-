import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContactMessages = () => {
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/admin/contact-messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching contact messages:', error);
        }
    };

    const handleReplyClick = (message) => {
        setSelectedMessage(message);
        setShowModal(true);
    };

    const handleReplySubmit = async () => {
        if (!replyContent.trim()) {
            alert('Reply content cannot be empty.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/admin/contact-messages/${selectedMessage.id}/reply`, 
                { reply_message: replyContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowModal(false);
            setReplyContent('');
            fetchMessages(); // Refresh messages after replying
        } catch (error) {
            console.error('Error sending reply:', error);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedMessage(null);
        setReplyContent('');
    };

    return (
        <div className="p-6 bg-gray-800 text-white">
            <h2 className="text-2xl font-bold mb-4">Contact Us Messages</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-900">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b border-gray-700">Name</th>
                            <th className="py-2 px-4 border-b border-gray-700">Email</th>
                            <th className="py-2 px-4 border-b border-gray-700">Subject</th>
                            <th className="py-2 px-4 border-b border-gray-700">Message</th>
                            <th className="py-2 px-4 border-b border-gray-700">Status</th>
                            <th className="py-2 px-4 border-b border-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.map(message => (
                            <tr key={message.id}>
                                <td className="py-2 px-4 border-b border-gray-700">{message.name}</td>
                                <td className="py-2 px-4 border-b border-gray-700">{message.email}</td>
                                <td className="py-2 px-4 border-b border-gray-700">{message.subject}</td>
                                <td className="py-2 px-4 border-b border-gray-700">{message.message}</td>
                                <td className="py-2 px-4 border-b border-gray-700">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${message.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {message.status}
                                    </span>
                                </td>
                                <td className="py-2 px-4 border-b border-gray-700">
                                    {message.status === 'new' && (
                                        <button onClick={() => handleReplyClick(message)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">
                                            Reply
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && selectedMessage && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-white">Reply to {selectedMessage.name}</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-400"><strong>Subject:</strong> {selectedMessage.subject}</p>
                                    <p className="text-sm text-gray-300 mt-2">{selectedMessage.message}</p>
                                </div>
                                <div className="mt-4">
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
                                        rows="4"
                                        placeholder="Your reply..."></textarea>
                                </div>
                            </div>
                            <div className="bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button onClick={handleReplySubmit} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                                    Send Reply
                                </button>
                                <button onClick={closeModal} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactMessages;