import React, { useState } from "react";

const TRADING_TERMS = {
  long: {
    term: "Long (Buy)",
    definition:
      "Buying an asset expecting its price to rise. You profit when the price goes up.",
    example:
      "If you go Long on BTC at $50,000 and it rises to $55,000, you make a profit.",
  },
  short: {
    term: "Short (Sell)",
    definition:
      "Selling an asset expecting its price to fall. You profit when the price goes down.",
    example:
      "If you Short BTC at $50,000 and it drops to $45,000, you make a profit.",
  },
  sl: {
    term: "Stop Loss (SL)",
    definition:
      "An order that automatically closes your trade at a predetermined price to limit losses.",
    example:
      "If you set SL at 2%, a $1000 trade will automatically close if you lose $20.",
  },
  tp: {
    term: "Take Profit (TP)",
    definition:
      "An order that automatically closes your trade when it reaches your profit target.",
    example:
      "If you set TP at 5%, a $1000 trade will automatically close when you profit $50.",
  },
  pnl: {
    term: "Profit and Loss (PnL)",
    definition: "The total profit or loss from your trading activity.",
    example:
      "If you made $100 on one trade and lost $30 on another, your PnL is +$70.",
  },
  bullish: {
    term: "Bullish",
    definition:
      "When traders expect prices to rise. Named after bulls who attack by pushing upward.",
    example:
      "If the market is bullish, more traders are buying expecting profits from rising prices.",
  },
  bearish: {
    term: "Bearish",
    definition:
      "When traders expect prices to fall. Named after bears who attack by swiping downward.",
    example:
      "If the market is bearish, more traders are selling expecting profits from falling prices.",
  },
  breakout: {
    term: "Breakout",
    definition:
      "When price moves beyond a key support or resistance level with momentum.",
    example:
      "If BTC breaks above $50,000 resistance, it may continue rising to the next level.",
  },
  resistance: {
    term: "Resistance",
    definition:
      "A price level where selling pressure typically prevents further upward movement.",
    example:
      "If $50,000 has been a ceiling 3 times, it becomes a resistance level.",
  },
  support: {
    term: "Support",
    definition:
      "A price level where buying pressure typically prevents further downward movement.",
    example: "If $45,000 has been a floor 3 times, it becomes a support level.",
  },
  leverage: {
    term: "Leverage",
    definition:
      "Borrowed capital to increase your trading position size. Amplifies both profits and losses.",
    example:
      "With 10x leverage, $100 controls a $1000 position. A 10% move becomes 100% gain or loss.",
  },
  margin: {
    term: "Margin",
    definition: "The collateral required to open a leveraged position.",
    example:
      "With 10x leverage, opening a $1000 position requires $100 margin.",
  },
  position: {
    term: "Position",
    definition:
      "An active trade that is currently open and can result in profit or loss.",
    example:
      "If you bought BTC, you have an open long position until you sell.",
  },
  entry: {
    term: "Entry Price",
    definition: "The price at which you open a trade.",
    example: "If you buy BTC at $50,000, that is your entry price.",
  },
  exit: {
    term: "Exit Price",
    definition:
      "The price at which you close a trade, locking in profit or loss.",
    example: "If you sell BTC at $55,000, that is your exit price.",
  },
  rr: {
    term: "Risk/Reward Ratio",
    definition: "The ratio of potential profit to potential loss in a trade.",
    example: "A 1 to 3 R/R means risking $100 to potentially gain $300.",
  },
};

export const TradingGlossary = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(null);

  const filteredTerms = Object.entries(TRADING_TERMS).filter(
    ([key, value]) =>
      value.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0a0f1c]/95 rounded-2xl border border-[#00cfff]/30 shadow-[0_0_30px_rgba(0,207,255,0.15)] w-full max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl my-4 max-h-[90vh] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00cfff] to-transparent opacity-50"></div>
        <div className="p-4 sm:p-5 border-b border-[#00cfff]/20 flex justify-between items-center bg-[#030308]/80 shrink-0">
          <h2 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="text-[#00cfff] drop-shadow-[0_0_5px_#00cfff] text-xl">📖</span> Trading Glossary
          </h2>
          <button
            onClick={onClose}
            className="text-[#00cfff]/50 hover:text-[#00cfff] text-xl font-bold px-2 transition-colors drop-shadow-[0_0_5px_rgba(0,207,255,0)] hover:drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-5 flex-1 overflow-hidden flex flex-col min-h-0 bg-[#0a0f1c]/40">
          <input
            type="text"
            placeholder="SEARCH TERMS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 sm:p-4 mb-4 focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none text-sm font-mono uppercase tracking-widest transition-all placeholder-[#00cfff]/30"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto flex-1 min-h-0 pr-2 custom-scrollbar">
            {filteredTerms.map(([key, value]) => (
              <button
                key={key}
                onClick={() => setSelectedTerm(value)}
                className="text-left p-3 bg-[#030308]/60 hover:bg-[#00cfff]/10 rounded-xl border border-[#00cfff]/20 hover:border-[#00cfff]/50 transition-all hover:shadow-[0_0_10px_rgba(0,207,255,0.1)] hover:-translate-y-0.5"
              >
                <span className="text-xs sm:text-sm font-extrabold text-[#00cfff] uppercase tracking-wider drop-shadow-[0_0_3px_rgba(0,207,255,0.3)]">
                  {value.term}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedTerm && (
          <div className="p-4 sm:p-5 border-t border-[#00cfff]/20 bg-[#030308]/90 shrink-0 animate-fade-in relative">
            <h3 className="text-lg sm:text-xl font-extrabold text-[#00cfff] mb-3 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]">
              {selectedTerm.term}
            </h3>
            <p className="text-gray-300 text-sm mb-4 leading-relaxed font-medium">
              {selectedTerm.definition}
            </p>
            <div className="bg-[#00cfff]/5 p-4 rounded-xl border border-[#00cfff]/20 shadow-[inset_0_0_10px_rgba(0,207,255,0.05)]">
              <span className="text-[10px] text-[#00cfff] uppercase font-extrabold tracking-widest block mb-2 border-b border-[#00cfff]/20 pb-1">
                Example
              </span>
              <p className="text-gray-300 text-sm italic leading-relaxed">
                "{selectedTerm.example}"
              </p>
            </div>
            <button
              onClick={() => setSelectedTerm(null)}
              className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>←</span> Back to list
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const DEFAULT_CHECKLIST = [
  {
    id: 1,
    text: "I have analyzed the current market trend (up/down/sideways)",
    required: true,
  },
  {
    id: 2,
    text: "I have identified key support and resistance levels",
    required: true,
  },
  {
    id: 3,
    text: "My position size is calculated using proper risk management (1-2%)",
    required: true,
  },
  {
    id: 4,
    text: "My Stop Loss is set at a logical level (not arbitrary)",
    required: true,
  },
  {
    id: 5,
    text: "My Take Profit target gives at least 1.5 to 1 risk/reward",
    required: true,
  },
  {
    id: 6,
    text: "I am not trading based on emotions (FOMO, revenge, fear)",
    required: true,
  },
  { id: 7, text: "I have reviewed my trading plan for today", required: false },
  {
    id: 8,
    text: "I am not trading during high-impact news events",
    required: false,
  },
];

export const PreTradeChecklist = ({ isOpen, onClose, onConfirm }) => {
  const [checkedItems, setCheckedItems] = useState({});
  const [showConfirmed, setShowConfirmed] = useState(false);

  const requiredItems = DEFAULT_CHECKLIST.filter((item) => item.required);
  const allRequiredChecked = requiredItems.every(
    (item) => checkedItems[item.id]
  );

  const toggleItem = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    setShowConfirmed(false);
  };

  const handleConfirm = () => {
    if (allRequiredChecked) {
      setShowConfirmed(true);
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0a0f1c]/95 rounded-2xl border border-[#00cfff]/30 shadow-[0_0_30px_rgba(0,207,255,0.15)] w-full max-w-[95vw] sm:max-w-md my-4 max-h-[90vh] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00cfff] to-transparent opacity-50"></div>
        <div className="p-4 sm:p-5 border-b border-[#00cfff]/20 flex justify-between items-center bg-[#030308]/80 shrink-0">
          <h2 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="text-[#00cfff] drop-shadow-[0_0_5px_#00cfff] text-xl">✅</span> Pre-Trade Checklist
          </h2>
          <button
            onClick={onClose}
            className="text-[#00cfff]/50 hover:text-[#00cfff] text-xl font-bold px-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1 custom-scrollbar bg-[#0a0f1c]/40">
          <p className="text-xs font-bold text-[#00cfff]/70 uppercase tracking-widest mb-3 border-b border-[#00cfff]/10 pb-2">
            Complete required items before trading:
          </p>

          {DEFAULT_CHECKLIST.map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                checkedItems[item.id]
                  ? "bg-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.1)]"
                  : "bg-[#030308]/50 border-[#00cfff]/20 hover:border-[#00cfff]/40"
              }`}
            >
              <div className="relative flex items-start">
                <input
                  type="checkbox"
                  checked={checkedItems[item.id] || false}
                  onChange={() => toggleItem(item.id)}
                  className="mt-0.5 sm:mt-1 w-5 h-5 rounded border-[#00cfff]/50 bg-[#030308] accent-green-500 focus:ring-green-500 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-green-500 checked:border-green-500 transition-colors"
                />
                {checkedItems[item.id] && (
                  <svg className="absolute top-[3px] left-[3px] w-3.5 h-3.5 sm:top-[5px] sm:left-[3px] text-[#030308] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs sm:text-sm font-medium leading-relaxed ${
                  checkedItems[item.id] ? "text-green-400 drop-shadow-[0_0_2px_rgba(74,222,128,0.3)]" : "text-gray-300"
                }`}
              >
                {item.text}
                {item.required && <span className="text-red-400 ml-1 font-bold">*</span>}
              </span>
            </label>
          ))}
        </div>

        <div className="p-4 sm:p-5 border-t border-[#00cfff]/20 bg-[#030308]/90 shrink-0">
          {showConfirmed ? (
            <div className="text-center py-3 animate-fade-in">
              <span className="text-3xl block mb-2 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">🚀</span>
              <p className="text-green-400 font-extrabold uppercase tracking-widest text-lg drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">Ready to Trade!</p>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!allRequiredChecked}
              className={`w-full py-3 sm:py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all text-sm sm:text-base ${
                allRequiredChecked
                  ? "bg-green-500 hover:bg-green-400 text-[#030308] shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] hover:-translate-y-0.5"
                  : "bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed"
              }`}
            >
              {allRequiredChecked
                ? "Confirm & Ready To Trade"
                : "Complete Required Items"}
            </button>
          )}
          <p className="text-[10px] font-bold text-gray-500 text-center mt-3 uppercase tracking-widest">
            <span className="text-red-400">*</span> Required items must be checked
          </p>
        </div>
      </div>
    </div>
  );
};

const TUTORIAL_STEPS = [
  {
    title: "Welcome to Trading!",
    content:
      "This simulator lets you practice trading with fake money. Learn without risking real cash!",
    icon: "Welcome",
  },
  {
    title: "Choose Your Trade Type",
    content:
      "BUY (Long) = Profit when price goes UP\nSELL (Short) = Profit when price goes DOWN",
    icon: "Trade Type",
  },
  {
    title: "Set Your Stop Loss",
    content:
      "Stop Loss limits your loss if trade goes wrong. Never risk more than 2% per trade!",
    icon: "Stop Loss",
  },
  {
    title: "Set Your Take Profit",
    content:
      "Take Profit locks in your profit when price reaches your target. Always aim for at least 1.5x your risk!",
    icon: "Take Profit",
  },
  {
    title: "Calculate Position Size",
    content:
      "Use the Position Size Calculator to determine how much to trade based on your risk comfort.",
    icon: "Position Size",
  },
  {
    title: "Use Trade Templates",
    content:
      "Templates help you trade using proven strategies. Start with Range or Trend Following!",
    icon: "Templates",
  },
  {
    title: "You are Ready!",
    content:
      "Start with small amounts. Practice makes perfect. Good luck, trader!",
    icon: "Ready",
  },
];

export const TutorialOverlay = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem("hideTutorial", "true");
      }
      onClose();
    }
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem("hideTutorial", "true");
    }
    onClose();
  };

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#0a0f1c]/95 rounded-2xl border border-[#00cfff]/40 w-full max-w-[95vw] sm:max-w-lg my-4 shadow-[0_0_40px_rgba(0,207,255,0.2)] overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00cfff] to-transparent opacity-50"></div>
        <div className="bg-[#030308] h-1.5 sm:h-2">
          <div
            className="bg-[#00cfff] h-full transition-all duration-500 shadow-[0_0_10px_#00cfff] relative"
            style={{ width: `${progress}%` }}
          >
             <div className="absolute inset-0 bg-white/40 w-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>

        <div className="p-6 sm:p-10 text-center relative z-10">
          <div className="text-5xl sm:text-7xl mb-6 sm:mb-8 drop-shadow-[0_0_15px_rgba(0,207,255,0.5)] animate-fade-in" key={currentStep}>
            {step.icon}
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-4 sm:mb-5 uppercase tracking-widest drop-shadow-[0_0_5px_#00cfff] animate-fade-in" key={`h-${currentStep}`}>
            {step.title}
          </h2>
          <p className="text-gray-300 font-medium whitespace-pre-line mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed animate-fade-in" key={`p-${currentStep}`}>
            {step.content}
          </p>

          <div className="flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            {TUTORIAL_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "bg-[#00cfff] shadow-[0_0_8px_#00cfff] scale-125" : idx < currentStep ? "bg-[#00cfff]/50" : "bg-gray-700"
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center gap-3">
            <button
              onClick={handleSkip}
              className="text-[#00cfff]/50 hover:text-[#00cfff] text-xs sm:text-sm font-extrabold uppercase tracking-widest px-4 py-3 transition-colors"
            >
              SKIP
            </button>
            <button
              onClick={handleNext}
              className="bg-[#00cfff] hover:bg-[#00e5ff] text-[#030308] px-6 sm:px-8 py-3 rounded-xl font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5 text-sm sm:text-base"
            >
              {currentStep < TUTORIAL_STEPS.length - 1
                ? "NEXT STEP"
                : "START TRADING"}
            </button>
          </div>

          <label className="flex items-center justify-center gap-2 mt-6 sm:mt-8 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-[#00cfff]/50 bg-[#030308] appearance-none cursor-pointer checked:bg-[#00cfff] checked:border-[#00cfff] transition-colors"
              />
              {dontShowAgain && (
                <svg className="absolute w-3 h-3 text-[#030308] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-400 transition-colors">
              Do not show this again
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export const BeginnerHelpButtons = ({
  onOpenGlossary,
  onOpenChecklist,
  onOpenTutorial,
}) => {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
      <button
        onClick={onOpenTutorial}
        className="flex-1 min-w-[100px] bg-[#0a0f1c]/80 border border-[#00cfff]/30 hover:bg-[#00cfff]/10 hover:border-[#00cfff] text-[#00cfff] text-[10px] font-extrabold py-3 px-2 sm:px-3 rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all uppercase tracking-widest shadow-[0_0_10px_rgba(0,207,255,0.05)] hover:shadow-[0_0_15px_rgba(0,207,255,0.2)] hover:-translate-y-0.5"
      >
        <span className="text-sm">🎓</span> Tutorial
      </button>
      <button
        onClick={onOpenChecklist}
        className="flex-1 min-w-[100px] bg-[#0a0f1c]/80 border border-[#00cfff]/30 hover:bg-[#00cfff]/10 hover:border-[#00cfff] text-[#00cfff] text-[10px] font-extrabold py-3 px-2 sm:px-3 rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all uppercase tracking-widest shadow-[0_0_10px_rgba(0,207,255,0.05)] hover:shadow-[0_0_15px_rgba(0,207,255,0.2)] hover:-translate-y-0.5"
      >
        <span className="text-sm">✅</span> Checklist
      </button>
      <button
        onClick={onOpenGlossary}
        className="flex-1 min-w-[100px] bg-[#0a0f1c]/80 border border-[#00cfff]/30 hover:bg-[#00cfff]/10 hover:border-[#00cfff] text-[#00cfff] text-[10px] font-extrabold py-3 px-2 sm:px-3 rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all uppercase tracking-widest shadow-[0_0_10px_rgba(0,207,255,0.05)] hover:shadow-[0_0_15px_rgba(0,207,255,0.2)] hover:-translate-y-0.5"
      >
        <span className="text-sm">📖</span> Glossary
      </button>
    </div>
  );
};

export default {
  TradingGlossary,
  PreTradeChecklist,
  TutorialOverlay,
  BeginnerHelpButtons,
};
