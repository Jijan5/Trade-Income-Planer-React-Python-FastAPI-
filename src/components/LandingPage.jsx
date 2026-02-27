import React from "react";

const LandingPage = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 lg:py-32">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm font-semibold">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
              The #1 Platform for Training Crypto Traders
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-snug">
              Master Your Trading
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 pb-4">
                Skills & Strategy
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Simulate trades with real-time market data, track performance, join exclusive communities, and leverage AI-powered insights to become a consistently skilled trader.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <button
                onClick={onRegister}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/30 transition-all transform hover:scale-105 hover:shadow-2xl"
              >
                Start Trading Free
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-4 bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-600 rounded-xl font-bold text-lg backdrop-blur-sm transition-all hover:border-gray-500"
              >
                Access Dashboard
              </button>
            </div>
            <div className="pt-8">
              <p className="text-sm text-gray-400 mb-4">Trusted by traders worldwide</p>
              {/* <div className="flex justify-center space-x-8 opacity-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">10K+</div>
                  <div className="text-xs text-gray-400">Active Traders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">500K+</div>
                  <div className="text-xs text-gray-400">Simulations Run</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">95%</div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professional-grade tools designed to accelerate your trading journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-gray-900/50 p-8 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="text-xl font-bold mb-4">Advanced Trade Simulator</h3>
              <p className="text-gray-400 leading-relaxed">
                Practice with live market data and historical scenarios. Test strategies across multiple timeframes without financial risk.
              </p>
            </div>
            <div className="group bg-gray-900/50 p-8 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                🤖
              </div>
              <h3 className="text-xl font-bold mb-4">AI-Powered Analytics</h3>
              <p className="text-gray-400 leading-relaxed">
                Receive personalized insights on your trading patterns, risk management, and psychological biases to optimize performance.
              </p>
            </div>
            <div className="group bg-gray-900/50 p-8 rounded-2xl border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                👥
              </div>
              <h3 className="text-xl font-bold mb-4">Elite Trading Communities</h3>
              <p className="text-gray-400 leading-relaxed">
                Connect with verified traders, share strategies, and access exclusive signals in a collaborative professional network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="py-16 px-6 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-400">10,000+</div>
              <div className="text-gray-400">Active Traders</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-purple-400">$2.5M+</div>
              <div className="text-gray-400">Virtual Profits Simulated</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-green-400">500+</div>
              <div className="text-gray-400">Trading Strategies</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-cyan-400">24/7</div>
              <div className="text-gray-400">Market Monitoring</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Traders Say</h2>
            <p className="text-gray-400 text-lg">Hear from our community members</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  JD
                </div>
                <div>
                  <div className="font-semibold">John Doe</div>
                  <div className="text-sm text-gray-400">Pro Trader</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "This platform transformed my trading approach. The AI insights helped me identify patterns I never noticed before."
              </p>
              <div className="flex text-yellow-400 mt-4">
                ★★★★★
              </div>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  SM
                </div>
                <div>
                  <div className="font-semibold">Sarah Miller</div>
                  <div className="text-sm text-gray-400">Crypto Enthusiast</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "The community here is incredible. I've learned more in 3 months than I did in 2 years trading alone."
              </p>
              <div className="flex text-yellow-400 mt-4">
                ★★★★★
              </div>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  MR
                </div>
                <div>
                  <div className="font-semibold">Mike Rodriguez</div>
                  <div className="text-sm text-gray-400">Day Trader</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "Risk-free simulation saved me thousands. Now I approach the market with a solid plan."
              </p>
              <div className="flex text-yellow-400 mt-4">
                ★★★★★
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-6 bg-gray-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Why Choose Trade Income Planner?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Risk-Free Learning</h3>
              <p className="text-gray-400 leading-relaxed">
                Practice trading with virtual money while learning from real market conditions. Build confidence and refine strategies before risking real capital.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Data-Driven Insights</h3>
              <p className="text-gray-400 leading-relaxed">
                Our AI analyzes your trading patterns to provide personalized recommendations, helping you avoid common mistakes and optimize performance.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-400">Community Support</h3>
              <p className="text-gray-400 leading-relaxed">
                Join a network of successful traders sharing strategies, signals, and experiences. Learn from the best in a supportive environment.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-cyan-400">Professional Tools</h3>
              <p className="text-gray-400 leading-relaxed">
                Access advanced charting, technical analysis, and performance tracking tools used by professional traders worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Trading?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of traders who have already improved their performance with our platform.
          </p>
          <button
            onClick={onRegister}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/30 transition-all transform hover:scale-105"
          >
            Register Now!
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
