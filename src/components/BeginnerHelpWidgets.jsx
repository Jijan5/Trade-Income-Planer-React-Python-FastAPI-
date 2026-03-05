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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl my-4 max-h-[90vh] flex flex-col">
        <div className="p-3 sm:p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-white">
            Trading Glossary
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold px-2"
          >
            X
          </button>
        </div>

        <div className="p-3 sm:p-4 flex-1 overflow-hidden flex flex-col min-h-0">
          <input
            type="text"
            placeholder="Search terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg text-white p-2 sm:p-3 mb-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {filteredTerms.map(([key, value]) => (
              <button
                key={key}
                onClick={() => setSelectedTerm(value)}
                className="text-left p-2 sm:p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors"
              >
                <span className="text-xs sm:text-sm font-bold text-blue-400">
                  {value.term}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedTerm && (
          <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-900/50 shrink-0">
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              {selectedTerm.term}
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              {selectedTerm.definition}
            </p>
            <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
              <span className="text-xs text-blue-400 uppercase font-bold block mb-1">
                Example:
              </span>
              <p className="text-gray-300 text-sm italic">
                {selectedTerm.example}
              </p>
            </div>
            <button
              onClick={() => setSelectedTerm(null)}
              className="mt-3 text-sm text-gray-400 hover:text-white"
            >
              Back to list
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-[95vw] sm:max-w-md my-4 max-h-[90vh] flex flex-col">
        <div className="p-3 sm:p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-white">
            Pre-Trade Checklist
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold px-2"
          >
            X
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto flex-1">
          <p className="text-xs sm:text-sm text-gray-400 mb-2">
            Complete all required items before trading:
          </p>

          {DEFAULT_CHECKLIST.map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                checkedItems[item.id]
                  ? "bg-green-900/20 border-green-500/50"
                  : "bg-gray-700/30 border-gray-600 hover:border-gray-500"
              }`}
            >
              <input
                type="checkbox"
                checked={checkedItems[item.id] || false}
                onChange={() => toggleItem(item.id)}
                className="mt-0.5 sm:mt-1 w-4 h-4 rounded text-green-600 focus:ring-green-500"
              />
              <span
                className={`text-xs sm:text-sm ${
                  checkedItems[item.id] ? "text-green-300" : "text-gray-300"
                }`}
              >
                {item.text}
                {item.required && <span className="text-red-400 ml-1">*</span>}
              </span>
            </label>
          ))}
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-900 shrink-0">
          {showConfirmed ? (
            <div className="text-center py-2">
              <span className="text-2xl block mb-1">Ready to Trade!</span>
              <p className="text-green-400 font-bold">Checklist Complete!</p>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!allRequiredChecked}
              className={`w-full py-2 sm:py-3 rounded-lg font-bold transition-colors text-sm sm:text-base ${
                allRequiredChecked
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              {allRequiredChecked
                ? "Confirm and Ready to Trade"
                : "Complete Required Items First"}
            </button>
          )}
          <p className="text-[10px] text-gray-500 text-center mt-2">
            * Required items must be checked
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl border border-blue-500/50 w-full max-w-[95vw] sm:max-w-lg my-4 shadow-2xl">
        <div className="bg-gray-900 h-1.5 sm:h-2 rounded-t-xl">
          <div
            className="bg-blue-500 h-full transition-all duration-300 rounded-t-xl"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4 sm:p-8 text-center">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{step.icon}</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            {step.title}
          </h2>
          <p className="text-gray-300 whitespace-pre-line mb-4 sm:mb-6 text-sm sm:text-base">
            {step.content}
          </p>

          <div className="flex justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
            {TUTORIAL_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-colors ${
                  idx <= currentStep ? "bg-blue-500" : "bg-gray-600"
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center gap-2">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-300 text-xs sm:text-sm px-3 py-2"
            >
              Skip Tutorial
            </button>
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-lg font-bold transition-colors text-sm sm:text-base"
            >
              {currentStep < TUTORIAL_STEPS.length - 1
                ? "Next"
                : "Start Trading!"}
            </button>
          </div>

          <label className="flex items-center justify-center gap-2 mt-3 sm:mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3 h-3 sm:w-4 sm:h-4 rounded"
            />
            <span className="text-xs text-gray-500">
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
    <div className="flex gap-2 mb-4">
      <button
        onClick={onOpenTutorial}
        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors"
      >
        Tutorial
      </button>
      <button
        onClick={onOpenChecklist}
        className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors"
      >
        Checklist
      </button>
      <button
        onClick={onOpenGlossary}
        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors"
      >
        Glossary
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
