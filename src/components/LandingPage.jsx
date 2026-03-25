import React from "react";

const LandingPage = ({ onLogin, onRegister }) => {
  // Feature data for the detailed features section
  const features = [
    {
      id: "simulation",
      icon: "📈",
      title: "Strategy Simulation",
      description: "Test your trading strategies with historical data and real-time market conditions. Run compound simulations to see how your account would grow over time with different risk parameters.",
      features: ["Historical Backtesting", "Compound Growth Calculator", "Multiple Timeframes", "Risk Parameter Testing"],
      imagePlaceholder: "/api/placeholder/600x400",
      color: "blue",
      alignment: "left"
    },
    {
      id: "goal",
      icon: "🎯",
      title: "Goal Planner",
      description: "Set realistic trading goals and track your progress. Calculate required returns to reach your financial targets with our advanced planning tools.",
      features: [
        "Smart Goal Setting", 
        "Customizable Timelines"
      ],
      imagePlaceholder: "/api/placeholder/600x400",
      color: "purple",
      alignment: "right"
    },
    {
      id: "manual",
      icon: "🎮",
      title: "Manual Trade Simulator",
      description: "Practice trading with live market data without risking real money. Our comprehensive tools help beginners learn the ropes while experienced traders refine their strategies.",
      features: [
        "Live Market Execution",
        "Position Size Calculator",
        "Risk/Reward Ratio Display",
        "Trade Setup Templates",
        "Beginner Tips & Guidance",
        "Pre-Trade Checklist",
        "Trading Glossary",
        "AI Trading Coach",
        "Risk Management Calculator"
      ],
      imagePlaceholder: "/api/placeholder/600x400",
      color: "green",
      alignment: "left"
    },
    {
      id: "history",
      icon: "📊",
      title: "Trade History & Analytics",
      description: "Track your performance with comprehensive analytics. Visualize your progress with dynamic charts and detailed statistics to identify patterns and improve.",
      features: [
        "Dynamic Statistics Dashboard",
        "PnL Over Time Charts",
        "Win Rate Visualization",
        "Trade Streak Tracking",
        "Profit Factor Analysis",
        "Average Win/Loss Metrics",
        "Daily Performance View",
        "CSV Export"
      ],
      imagePlaceholder: "/api/placeholder/600x400",
      color: "cyan",
      alignment: "right"
    }
  ];

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
          </div>
        </div>
      </section>

      {/* Quick Features Section */}
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

      {/* Detailed Features Section */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Trading Tools</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to become a consistently profitable trader
            </p>
          </div>

          <div className="space-y-24">
            {features.map((feature, index) => (
              <div 
                key={feature.id} 
                className={`flex flex-col ${feature.alignment === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}
              >
                {/* Content Side */}
                <div className="flex-1 space-y-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-${feature.color}-600/20 border border-${feature.color}-500/30`}>
                    <span className="text-3xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold">{feature.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="grid grid-cols-2 gap-3">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <span className={`w-2 h-2 rounded-full bg-${feature.color}-500 mr-3`}></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={onRegister}
                    className={`inline-flex items-center px-6 py-3 bg-${feature.color}-600 hover:bg-${feature.color}-500 text-white rounded-xl font-semibold transition-all`}
                  >
                    Get Started
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Image Side */}
                <div className="flex-1 w-full">
                  <div className="relative rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 shadow-2xl">
                    {/* Placeholder for image - User can replace with actual images */}
                    <div className={`aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-8`}>
                      <div className="text-6xl mb-4 opacity-50">{feature.icon}</div>
                      <div className="text-gray-500 text-center">
                        <p className="text-lg font-semibold mb-2">{feature.title}</p>
                        <p className="text-sm">Image placeholder - Add your screenshot here</p>
                      </div>
                      {/* Decorative elements */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className={`absolute top-4 right-4 w-20 h-20 bg-${feature.color}-500/10 rounded-full blur-xl`}></div>
                        <div className={`absolute bottom-4 left-4 w-32 h-32 bg-${feature.color}-500/10 rounded-full blur-xl`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manual Trade Features Highlight */}
      <section className="py-24 px-6 bg-gradient-to-r from-green-900/20 to-cyan-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-900/30 border border-green-500/30 text-green-300 text-sm font-semibold mb-4">
              🎮 Beginner Friendly
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Manual Trade Simulator Features</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything novice traders need to learn trading step by step
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-700 hover:border-green-500/50 transition-all">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center text-2xl mb-4">📊</div>
              <h3 className="font-bold text-lg mb-2">Position Size Calculator</h3>
              <p className="text-gray-400 text-sm">Calculate the right position size based on your risk tolerance and account balance.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-2xl mb-4">⚖️</div>
              <h3 className="font-bold text-lg mb-2">Risk/Reward Display</h3>
              <p className="text-gray-400 text-sm">See your potential risk vs reward before entering any trade.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center text-2xl mb-4">📋</div>
              <h3 className="font-bold text-lg mb-2">Trade Setup Templates</h3>
              <p className="text-gray-400 text-sm">Choose from proven strategies like Breakout, Reversal, Range, and more.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-700 hover:border-yellow-500/50 transition-all">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center text-2xl mb-4">💡</div>
              <h3 className="font-bold text-lg mb-2">Beginner Tips</h3>
              <p className="text-gray-400 text-sm">Get contextual tips based on your trading performance and experience level.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-700 hover:border-red-500/50 transition-all">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center text-2xl mb-4">✅</div>
              <h3 className="font-bold text-lg mb-2">Pre-Trade Checklist</h3>
              <p className="text-gray-400 text-sm">Follow a structured checklist before every trade to maintain discipline.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center text-2xl mb-4">📖</div>
              <h3 className="font-bold text-lg mb-2">Trading Glossary</h3>
              <p className="text-gray-400 text-sm">Learn trading terminology with our comprehensive built-in glossary.</p>
            </div>

            {/* Feature 7 */}
            <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center text-2xl mb-4">🎓</div>
              <h3 className="font-bold text-lg mb-2">Tutorial Overlay</h3>
              <p className="text-gray-400 text-sm">Step-by-step guided walkthrough for first-time users.</p>
            </div>

            {/* Feature 8 */}
            <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-700 hover:border-pink-500/50 transition-all">
              <div className="w-12 h-12 bg-pink-600/20 rounded-lg flex items-center justify-center text-2xl mb-4">🤖</div>
              <h3 className="font-bold text-lg mb-2">AI Trading Coach</h3>
              <p className="text-gray-400 text-sm">Get AI-powered analysis of your trading patterns and personalized recommendations.</p>
            </div>

            {/* Feature 9 - Risk Management Calculator */}
            <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-700 hover:border-red-500/50 transition-all">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center text-2xl mb-4">⚠️</div>
              <h3 className="font-bold text-lg mb-2">Risk Management Calculator</h3>
              <p className="text-gray-400 text-sm">Calculate position size, risk per trade, stop loss & take profit levels with educational tips for beginners.</p>
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