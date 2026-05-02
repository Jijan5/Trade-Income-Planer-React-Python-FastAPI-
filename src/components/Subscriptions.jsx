import React, { useState } from "react";
import { Check, Bot, ShieldCheck, TriangleAlert, TrendingUp } from "lucide-react";

const Subscription = ({ onSubscribe }) => {
  const [billingCycle, setBillingCycle] = useState("monthly"); // 'monthly' or 'yearly'

  const plans = [
    {
      id: "basic",
      name: "Basic Plan",
      monthlyPrice: 12,
      yearlyPrice: 119,
      description: "For traders who want more data and control.",
      features: [
        "Export Trade History (CSV)",
        "Prop Firm Challenge Simulator",
      ],
      color: "blue",
      recommended: false,
    },
    {
      id: "premium",
      name: "Premium Plan",
      monthlyPrice: 19,
      yearlyPrice: 189,
      description: "The complete toolkit for serious growth.",
      features: [
        "Everything in Basic",
        "AI Trading Coach Analysis",
        "Discipline Mode (Trading Rules)",
        "Risk Management Calculator",
        "Unlock Custom Platform",
        "Strategy Simulator & Goal Planner",
        "Create up to 3 Communities"
      ],
      color: "purple",
      recommended: true,
    },
    {
      id: "platinum",
      name: "Platinum Plan",
      monthlyPrice: 28,
      yearlyPrice: 279,
      description: "Ultimate status and customization.",
      features: [
        "Everything in Premium",
        "Verified User Badge",
        "Unlimited Community Creation",
        "Priority Support"
      ],
      color: "yellow",
      recommended: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.5s infinite ease-in-out;
        }
      `}</style>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          Upgrade Your Trading Simulation
        </h2>
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-engine-neon/70 max-w-2xl mx-auto leading-relaxed">
          Unlock advanced tools, AI analysis, and exclusive community features to accelerate your learning curve.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mt-10 gap-5">
          <span className={`text-[11px] font-extrabold uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-gray-500'}`}>Monthly</span>
          <button 
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-16 h-8 bg-engine-bg border border-engine-neon/30 rounded-full p-1 relative transition-colors duration-300 focus:outline-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
          >
            <div className={`w-6 h-6 bg-engine-button rounded-full shadow-[0_0_10px_#00cfff] transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-8' : ''}`}></div>
          </button>
          <span className={`text-[11px] font-extrabold uppercase tracking-widest transition-colors flex items-center ${billingCycle === 'yearly' ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-gray-500'}`}>
            Yearly 
            <span className="ml-3 px-2.5 py-1 rounded-md bg-engine-button/20 border border-engine-neon/50 text-engine-neon text-[9px] font-extrabold shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.3)] animate-heartbeat">
              SAVE ~17%
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
      {plans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const effectiveMonthly = billingCycle === 'yearly' ? (plan.yearlyPrice / 12).toFixed(2) : null;

          return (
          <div 
            key={plan.id}
            className={`relative bg-engine-panel/60 backdrop-blur-md rounded-2xl transition-all duration-300 flex flex-col
              ${plan.recommended 
                ? 'border border-engine-neon shadow-[0_0_30px_rgba(var(--engine-neon-rgb),0.15)] md:-translate-y-4 md:scale-105 z-20' 
                : 'border border-engine-neon/10 hover:border-engine-neon/30 hover:shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.05)] hover:-translate-y-2'}
            `}
          >
            {plan.recommended && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-engine-button text-engine-bg text-[9px] font-extrabold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.5)] uppercase tracking-widest">
                MOST POPULAR
              </div>
            )}

            <div className="p-8 flex-1">
              <h3 className={`text-[11px] font-extrabold uppercase tracking-widest mb-4 ${
                plan.color === 'yellow' ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 
                plan.color === 'purple' ? 'text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]' : 'text-engine-neon drop-shadow-[0_0_5px_var(--engine-neon)]'
              }`}>
                {plan.name}
              </h3>
              <div className="flex flex-col mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                    ${price}
                  </span>
                  <span className="text-engine-neon/50 text-xs font-bold uppercase tracking-widest">/{billingCycle === 'monthly' ? 'MO' : 'YR'}</span>
                </div>
                {effectiveMonthly && (
                  <span className="text-[10px] text-green-400 font-extrabold uppercase tracking-widest mt-2 drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]">
                    EFFECTIVE: ${effectiveMonthly}/MO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mb-8 border-b border-engine-neon/10 pb-6 font-medium leading-relaxed">
                {plan.description}
              </p>

              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs text-gray-300 font-medium">
                    <Check className={`flex-shrink-0 w-4 h-4 mt-0.5 ${plan.recommended ? 'text-engine-neon drop-shadow-[0_0_5px_var(--engine-neon)]' : 'text-engine-neon/50'}`} />
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 pt-0 mt-auto">
              <button
                onClick={() => onSubscribe && onSubscribe({ 
                    ...plan, 
                    billingCycle, 
                    finalPrice: price 
                })}
                className={`w-full py-3.5 rounded-xl font-extrabold text-[11px] uppercase tracking-widest transition-all duration-300
                  ${plan.recommended 
                    ? 'bg-engine-button text-engine-bg shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.4)] hover:shadow-[0_0_25px_rgba(var(--engine-neon-rgb),0.6)] hover:-translate-y-0.5 hover:bg-[#00e5ff]' 
                    : 'bg-engine-bg border border-engine-neon/30 text-engine-neon hover:bg-engine-button/10 hover:border-engine-neon/50 hover:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)]'
                  }
                `}
              >
                CHOOSE {plan.name}
              </button>
            </div>
          </div>
        )})}
      </div>
      
      <div className="mt-20 text-center border-t border-engine-neon/10 pt-8 relative z-10">
        <p className="text-engine-neon/50 text-[10px] font-extrabold uppercase tracking-widest leading-loose">
          CANCEL ANYTIME. SECURE PAYMENT VIA MIDTRANS.<br />
          NEED A CUSTOM PLAN FOR A LARGE TEAM? <a href="/contact-us" className="text-engine-neon hover:text-[#00e5ff] hover:drop-shadow-[0_0_5px_var(--engine-neon)] transition-colors ml-1">CONTACT US</a>.
        </p>
      </div>
    </div>
  );
};

export default Subscription;
