import React, { useState, useRef, useEffect } from 'react';
import api from "../lib/axios";

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMarketPanel, setShowMarketPanel] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am Tip, your AI Trading Mentor. Ask me about market trends, trading strategies, or crypto analysis! 📈' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Fetch market data when panel opens
  useEffect(() => {
    if (showMarketPanel && marketData.length === 0) {
      fetchMarketData();
    }
  }, [showMarketPanel]);

  const fetchMarketData = async () => {
    setLoadingMarket(true);
    try {
      const response = await api.get('/market-data?symbols=BTC,ETH,BNB,SOL,XRP');
      setMarketData(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch market data", err);
    } finally {
      setLoadingMarket(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chat', { message: userMessage.content });
      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble responding. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick market analysis questions
  const quickQuestions = [
    "What's the BTC trend?",
    "Is ETH bullish?",
    "Market analysis",
    "Best crypto to trade?"
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Market Data Panel */}
      {isOpen && showMarketPanel && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-80 sm:w-96 h-[400px] flex flex-col mb-4 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-900 to-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">📈</div>
              <div>
                <h3 className="font-bold text-white text-sm">Market Trends</h3>
                <p className="text-[10px] text-green-400">Live from Binance</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchMarketData} disabled={loadingMarket} className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loadingMarket ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={() => setShowMarketPanel(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Market Data */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-900/50">
            {loadingMarket ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading market data...</div>
              </div>
            ) : marketData.length > 0 ? (
              <div className="space-y-3">
                {marketData.map((coin, idx) => (
                  <div key={idx} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white">{coin.symbol}/USDT</span>
                      <span className={`font-bold ${coin.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {coin.change_24h >= 0 ? '📈' : '📉'} {coin.change_24h >= 0 ? '+' : ''}{coin.change_24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-white font-mono">${coin.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">24h High:</span>
                      <span className="text-green-400 font-mono">${coin.high_24h.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">24h Low:</span>
                      <span className="text-red-400 font-mono">${coin.low_24h.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <span className={`text-xs px-2 py-1 rounded ${coin.trend.includes('Bullish') ? 'bg-green-900 text-green-400' : coin.trend.includes('Bearish') ? 'bg-red-900 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                        {coin.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No market data available
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div className="p-3 bg-gray-800 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Quick Questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col mb-4 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-gray-900"></div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">TIP</div>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Tip (Trading Mentor)</h3>
                <p className="text-[10px] text-green-400">AI Powered • Online</p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Market Trends Button */}
              <button 
                onClick={() => setShowMarketPanel(!showMarketPanel)} 
                className={`p-2 rounded-lg transition-colors ${showMarketPanel ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                title="View Market Trends"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-700 text-gray-200 rounded-bl-none border border-gray-600'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center h-10">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about market trends..."
              className="flex-1 bg-gray-900 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-gray-600 placeholder-gray-500"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center w-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-gray-700 rotate-90' : 'bg-blue-600 hover:bg-blue-500'} text-white p-4 rounded-full shadow-lg shadow-blue-900/20 transition-all duration-300 flex items-center justify-center group`}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatAssistant;
