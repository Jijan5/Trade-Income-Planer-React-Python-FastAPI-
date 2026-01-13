import React, { useState } from "react";

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
        "Unlock All Assets (Meme Coins & Alts)",
        "Export Trade History (CSV) ✅",
        "Prop Firm Challenge Simulator ✅",
        "Ad-Free Experience"
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
        "🤖 AI Trading Coach Analysis",
        "👮 Discipline Mode (Trading Rules)",
        "Strategy Simulator & Goal Planner ✅",
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
        "✨ VIP Community Styles (Animated)",
        "🎨 Custom Gradient Backgrounds",
        "✅ Verified User Badge",
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
          50% { transform: scale(1.1); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.5s infinite ease-in-out;
        }
      `}</style>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">
          Upgrade Your Trading Journey
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Unlock advanced tools, AI analysis, and exclusive community features to accelerate your path to profitability.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mt-8 gap-4">
          <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
          <button 
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-7 bg-gray-700 rounded-full p-1 relative transition-colors duration-300 focus:outline-none"
          >
            <div className={`w-5 h-5 bg-blue-500 rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-7' : ''}`}></div>
          </button>
          <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
          Yearly <span className="ml-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-heartbeat inline-block">
              Save ~17%
            </span>
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
            Best for traders who commit to consistency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const effectiveMonthly = billingCycle === 'yearly' ? (plan.yearlyPrice / 12).toFixed(2) : null;

          return (
          <div 
            key={plan.id}
            className={`relative bg-gray-800 rounded-2xl border transition-all duration-300 flex flex-col
              ${plan.recommended ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-105 z-10' : 'border-gray-700 hover:border-gray-600 hover:-translate-y-1'}
            `}
          >
            {plan.recommended && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-wider">
                Most Popular
              </div>
            )}

            <div className="p-8 flex-1">
              <h3 className={`text-xl font-bold mb-2 ${
                plan.color === 'yellow' ? 'text-yellow-400' : 
                plan.color === 'purple' ? 'text-purple-400' : 'text-blue-400'
              }`}>
                {plan.name}
              </h3>
              <div className="flex flex-col mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    ${price}
                  </span>
                  <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {effectiveMonthly && (
                  <span className="text-sm text-green-400 font-medium">
                    Effective: ${effectiveMonthly}/mo
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-6 border-b border-gray-700 pb-6">
                {plan.description}
              </p>

              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                    <svg className={`w-5 h-5 flex-shrink-0 ${plan.recommended ? 'text-blue-500' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
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
                className={`w-full py-3 rounded-lg font-bold transition-all duration-200
                  ${plan.recommended 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white hover:text-white'
                  }
                `}
              >
                Choose {plan.name}
              </button>
            </div>
          </div>
        )})}
      </div>
      
      <div className="mt-16 text-center border-t border-gray-800 pt-8">
        <p className="text-gray-500 text-sm">
          Cancel anytime. Secure payment via Midtrans.
          <br />
          Need a custom plan for a large team? <a href="#" className="text-blue-400 hover:underline">Contact us</a>.
        </p>
      </div>
    </div>
  );
};

export default Subscription;
