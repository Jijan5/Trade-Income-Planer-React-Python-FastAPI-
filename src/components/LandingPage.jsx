import React from "react";

const LandingPage = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="inline-block animate-bounce">
            <span className="bg-blue-900/50 text-blue-300 border border-blue-500/30 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide">
              🚀 The #1 Platform for Train Crypto Trade
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Master Your Trading <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Income & Strategy
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Simulate trades, track your performance, join exclusive communities, and get AI-powered insights to become a profitable trader.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={onRegister}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 transition-all transform hover:scale-105"
            >
              Start for Free
            </button>
            <button 
              onClick={onLogin}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 rounded-xl font-bold text-lg transition-all hover:border-gray-500"
            >
              Login to Account
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-800/50 py-20 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Win</h2>
            <p className="text-gray-400">Professional tools simplified for every trader.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-colors group">
              <div className="w-14 h-14 bg-blue-900/30 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                📈
              </div>
              <h3 className="text-xl font-bold mb-3">Trade Simulator</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Practice with real-time market data without risking real capital. Test strategies before you deploy them.
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-colors group">
              <div className="w-14 h-14 bg-purple-900/30 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                🤖
              </div>
              <h3 className="text-xl font-bold mb-3">AI Trading Coach</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get personalized analysis of your trading habits, risk management, and psychological patterns.
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-green-500/50 transition-colors group">
              <div className="w-14 h-14 bg-green-900/30 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                👥
              </div>
              <h3 className="text-xl font-bold mb-3">Pro Communities</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Join verified trader groups, share signals, and learn from the best in a collaborative environment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 text-center">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Trade Income Planner. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
