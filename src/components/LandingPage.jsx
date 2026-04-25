import React from "react";
import { motion } from "framer-motion";

const LandingPage = ({ onLogin, onRegister }) => {
  // Feature data for the detailed features section
  const features = [
    {
      id: "simulation",
      icon: "📈",
      title: "Strategy Simulation",
      description: "Test your trading strategies with historical data and real-time market conditions. Run compound simulations to see how your account would grow over time.",
      features: ["Historical Backtesting", "Compound Growth", "Multiple Timeframes", "Risk Parameter Testing"],
      color: "cyan"
    },
    {
      id: "goal",
      icon: "🎯",
      title: "Goal Planner",
      description: "Set realistic trading goals and track your progress. Calculate required returns to reach your financial targets with our advanced planning tools.",
      features: ["Smart Goal Setting", "Customizable Timelines"],
      color: "blue"
    },
    {
      id: "manual",
      icon: "🎮",
      title: "Manual Trade Simulator",
      description: "Practice trading with live market data without risking real money. Our comprehensive tools help beginners learn the ropes.",
      features: ["Live Market Execution", "Position Size Calculator", "Risk/Reward Ratio", "Trading Glossary"],
      color: "cyan"
    },
    {
      id: "history",
      icon: "📊",
      title: "Trade History & Analytics",
      description: "Track your performance with comprehensive analytics. Visualize your progress with dynamic charts and detailed statistics.",
      features: ["Dynamic Dashboard", "PnL Charts", "Win Rate Visualization", "CSV Export"],
      color: "blue"
    }
  ];

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030308] text-white overflow-hidden font-sans">
      
      {/* Inline styles for background animations & custom scrollbar */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        /* Custom thin scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #030308;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 207, 255, 0.15);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 207, 255, 0.4);
        }

        /* Animated Neon Lines Background */
        .neon-lines-container {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .neon-line {
          position: absolute;
          background: linear-gradient(90deg, transparent, rgba(0, 207, 255, 0.6), transparent);
          height: 1px;
          width: 250px;
          opacity: 0;
          animation: moveLine 15s linear infinite;
        }

        .neon-line-v {
          position: absolute;
          background: linear-gradient(180deg, transparent, rgba(0, 207, 255, 0.5), transparent);
          width: 1px;
          height: 350px;
          opacity: 0;
          animation: moveLineV 20s linear infinite;
        }

        .neon-line:nth-child(1) { top: 15%; left: -250px; animation-duration: 22s; }
        .neon-line:nth-child(2) { top: 45%; right: -250px; animation-duration: 28s; animation-direction: reverse; }
        .neon-line:nth-child(3) { top: 75%; left: -250px; animation-duration: 25s; }
        
        .neon-line-v:nth-child(4) { left: 20%; top: -350px; animation-duration: 26s; }
        .neon-line-v:nth-child(5) { left: 80%; bottom: -350px; animation-duration: 30s; animation-direction: reverse; }

        @keyframes moveLine {
          0% { transform: translateX(0vw); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateX(120vw); opacity: 0; }
        }

        @keyframes moveLineV {
          0% { transform: translateY(0vh); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(120vh); opacity: 0; }
        }
      `}</style>

      {/* Background Animated Neon Lines */}
      <div className="neon-lines-container">
        <div className="neon-line"></div>
        <div className="neon-line"></div>
        <div className="neon-line"></div>
        <div className="neon-line-v"></div>
        <div className="neon-line-v"></div>
        {/* Soft Ambient Glows */}
        <div className="absolute top-[-15%] left-[-10%] w-[50rem] h-[50rem] bg-[#00cfff]/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50rem] h-[50rem] bg-purple-600/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center px-6 py-32 lg:py-48 min-h-[90vh]">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto space-y-10"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#00cfff]/10 backdrop-blur-md shadow-[0_0_15px_rgba(0,207,255,0.1)] text-[#00cfff] text-sm font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 bg-[#00cfff] rounded-full mr-3 shadow-[0_0_8px_#00cfff] animate-pulse"></span>
              The #1 Platform for Training Crypto Traders
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.1]">
              Master Your Trading<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00cfff] via-[#00f2fe] to-[#4facfe] drop-shadow-[0_0_20px_rgba(0,207,255,0.3)]">
                Skills & Strategy
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              Simulate trades with real-time market data, track performance, join exclusive communities, and leverage AI-powered insights to become a consistently skilled trader.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(0, 207, 255, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={onRegister}
                className="px-10 py-5 bg-[#00cfff] hover:bg-[#00b3e6] text-[#030308] rounded-2xl font-extrabold text-lg transition-colors shadow-[0_0_20px_rgba(0,207,255,0.25)]"
              >
                Start Trading Free
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                onClick={onLogin}
                className="px-10 py-5 bg-transparent text-white rounded-2xl font-bold text-lg backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_0_0_1px_rgba(0,207,255,0.5)] transition-all"
              >
                Access Dashboard
              </motion.button>
            </motion.div>
          </motion.div>
        </section>

        {/* Quick Features Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Everything You Need to Succeed</h2>
              <p className="text-gray-400 text-xl max-w-2xl mx-auto font-light">
                Professional-grade tools designed to accelerate your trading journey
              </p>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                { icon: "📊", title: "Advanced Trade Simulator", desc: "Practice with live market data and historical scenarios. Test strategies across multiple timeframes without financial risk." },
                { icon: "🤖", title: "AI-Powered Analytics", desc: "Receive personalized insights on your trading patterns, risk management, and psychological biases to optimize performance." },
                { icon: "👥", title: "Elite Trading Communities", desc: "Connect with verified traders, share strategies, and access exclusive signals in a collaborative professional network." }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  variants={fadeUp}
                  whileHover={{ y: -8, boxShadow: "0 20px 40px -10px rgba(0, 207, 255, 0.15)" }}
                  className="group relative bg-[#0a0f1c]/60 p-10 rounded-[2rem] backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00cfff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-[#00cfff]/10 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,207,255,0.2)] transition-all duration-500">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Detailed Features Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="text-center mb-32"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Powerful Trading Tools</h2>
              <p className="text-gray-400 text-xl max-w-2xl mx-auto font-light">
                Everything you need to become a consistently profitable trader
              </p>
            </motion.div>

            <div className="space-y-40">
              {features.map((feature, index) => (
                <motion.div 
                  key={feature.id}
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                  variants={staggerContainer}
                  className={`flex flex-col ${index % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 lg:gap-24`}
                >
                  {/* Content Side */}
                  <motion.div variants={fadeUp} className="flex-1 space-y-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#00cfff]/10 shadow-[0_0_30px_rgba(0,207,255,0.1)]">
                      <span className="text-4xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold">{feature.title}</h3>
                    <p className="text-gray-400 text-xl leading-relaxed font-light">
                      {feature.description}
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-center text-gray-300 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00cfff] mr-4 shadow-[0_0_5px_#00cfff]"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onRegister}
                      className="inline-flex items-center px-8 py-4 bg-[#00cfff]/10 hover:bg-[#00cfff]/20 text-[#00cfff] rounded-xl font-bold transition-all shadow-[inset_0_0_0_1px_rgba(0,207,255,0.3)] mt-4"
                    >
                      Get Started
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </motion.button>
                  </motion.div>

                  {/* Image Side */}
                  <motion.div variants={fadeUp} className="flex-1 w-full">
                    <div className="relative rounded-[2rem] overflow-hidden bg-[#0a0f1c]/40 backdrop-blur-lg shadow-[0_20px_50px_rgba(0,0,0,0.3)] group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#00cfff]/10 to-transparent opacity-50"></div>
                      <div className="aspect-video flex flex-col items-center justify-center p-12 relative z-10">
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0.5 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 1 }}
                          className="text-7xl mb-6 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                          {feature.icon}
                        </motion.div>
                        <div className="text-center text-gray-400">
                          <p className="text-2xl font-bold mb-3 text-white">{feature.title}</p>
                          <p className="text-sm font-light">Image placeholder - Add your screenshot here</p>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute top-8 right-8 w-32 h-32 bg-[#00cfff]/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-8 left-8 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
                      </div>
                      {/* Subtle hover border glow */}
                      <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,207,255,0.05)] group-hover:shadow-[inset_0_0_0_1px_rgba(0,207,255,0.2)] transition-shadow duration-500 rounded-[2rem]"></div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Manual Trade Features Highlight */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#00cfff]/10 text-[#00cfff] text-sm font-bold uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(0,207,255,0.1)]">
                🎮 Beginner Friendly
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Manual Trade Simulator Features</h2>
              <p className="text-gray-400 text-xl max-w-2xl mx-auto font-light">
                Everything novice traders need to learn trading step by step
              </p>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {[
                { icon: "📊", title: "Position Size Calculator", desc: "Calculate the right position size based on your risk tolerance and account balance." },
                { icon: "⚖️", title: "Risk/Reward Display", desc: "See your potential risk vs reward before entering any trade." },
                { icon: "📋", title: "Trade Setup Templates", desc: "Choose from proven strategies like Breakout, Reversal, Range, and more." },
                { icon: "💡", title: "Beginner Tips", desc: "Get contextual tips based on your trading performance and experience level." },
                { icon: "✅", title: "Pre-Trade Checklist", desc: "Follow a structured checklist before every trade to maintain discipline." },
                { icon: "📖", title: "Trading Glossary", desc: "Learn trading terminology with our comprehensive built-in glossary." },
                { icon: "🎓", title: "Tutorial Overlay", desc: "Step-by-step guided walkthrough for first-time users." },
                { icon: "🤖", title: "AI Trading Coach", desc: "Get AI-powered analysis of your trading patterns and personalized recommendations." },
                { icon: "⚠️", title: "Risk Management Calculator", desc: "Calculate position size, risk per trade, stop loss & take profit levels with educational tips for beginners." }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  variants={fadeUp}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(10, 15, 28, 0.8)", boxShadow: "0 10px 30px rgba(0, 207, 255, 0.08)" }}
                  className="bg-[#0a0f1c]/50 p-8 rounded-3xl backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col h-full relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00cfff]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-14 h-14 bg-[#00cfff]/10 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-[0_0_15px_rgba(0,207,255,0.05)]">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                  <p className="text-gray-400 font-light leading-relaxed flex-grow">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="max-w-5xl mx-auto text-center bg-[#0a0f1c]/80 backdrop-blur-xl p-16 md:p-24 rounded-[3rem] shadow-[0_0_50px_rgba(0,207,255,0.05)] relative overflow-hidden group"
          >
            {/* Animated glow background inside CTA */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#00cfff]/5 to-transparent opacity-50"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-1 bg-gradient-to-r from-transparent via-[#00cfff]/50 to-transparent"></div>
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-[#00cfff]/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-[#00cfff]/20 transition-colors duration-1000"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight">Ready to Transform Your Trading?</h2>
              <p className="text-gray-300 text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light">
                Join thousands of traders who have already improved their performance with our platform.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 207, 255, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onRegister}
                className="px-12 py-6 bg-[#00cfff] text-[#030308] rounded-2xl font-extrabold text-xl shadow-[0_0_20px_rgba(0,207,255,0.2)] transition-all"
              >
                Register Now!
              </motion.button>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;