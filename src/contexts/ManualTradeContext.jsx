import React, { createContext, useState, useEffect, useContext, useCallback, useMemo  } from 'react';
import api from '../lib/axios';
import { useAuth } from './AuthContext';

const ManualTradeContext = createContext();

export const useManualTrade = () => useContext(ManualTradeContext);

const defaultState = {
    config: { initialCapital: 10000, tradeAmount: 1000, stopLossPct: 1, takeProfitPct: 2, isChallengeMode: false, challengeTargetPct: 10, challengeMaxDrawdownPct: 10, tradeNote: "", enableRules: false, maxTradesPerDay: 5, maxDailyLoss: 500, maxConsecutiveLosses: 2 },
    account: { balance: 10000, equity: 10000, positions: [], history: [] },
    challengeState: { status: 'IDLE', startTime: null, endTime: null, reason: '' },
    isSessionActive: false
};

export const ManualTradeProvider = ({ children, activeSymbol }) => {
    const { userData } = useAuth();
    const storageKey = userData ? `manual_trade_session_${userData.id}` : null;

    const loadState = () => {
        if (!storageKey) return null;
        try {
            const savedState = localStorage.getItem(storageKey);
            return savedState ? JSON.parse(savedState) : null;
        } catch (e) {
            console.error("Failed to parse saved state", e);
            return null;
        }
    };

    const [config, setConfig] = useState(() => loadState()?.config || defaultState.config);
    const [account, setAccount] = useState(() => loadState()?.account || defaultState.account);
    const [challengeState, setChallengeState] = useState(() => loadState()?.challengeState || defaultState.challengeState);
    const [isSessionActive, setIsSessionActive] = useState(() => loadState()?.isSessionActive || defaultState.isSessionActive);

    const [marketState, setMarketState] = useState({
        price: 0,
        isLoading: true,
        lastUpdate: null
    });

    const [healthData, setHealthData] = useState(null);

    const [lockout, setLockout] = useState(() => {
        const saved = localStorage.getItem('trading_lockout');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (new Date().getTime() < parsed.until) return parsed;
                localStorage.removeItem('trading_lockout');
            } catch (e) {
                console.error("Failed to parse lockout data", e);
                localStorage.removeItem('trading_lockout');
            }
        }
        return null;
    });

    const [timeLeft, setTimeLeft] = useState("");

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (storageKey) {
            const stateToSave = { config, account, challengeState, isSessionActive };
            localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        }
    }, [config, account, challengeState, isSessionActive, storageKey]);

    const triggerLockout = useCallback((reason) => {
        const until = new Date().getTime() + 30 * 60 * 1000; // 30 minutes lockout
        const lockoutData = { active: true, until, reason };
        setLockout(lockoutData);
        localStorage.setItem('trading_lockout', JSON.stringify(lockoutData));
        setIsSessionActive(false);
    }, []);

    const checkRulesAfterClose = useCallback((updatedHistory) => {
        if (!config.enableRules) return;

        const todayLoss = updatedHistory.reduce((acc, trade) => trade.finalPnL < 0 ? acc + Math.abs(trade.finalPnL) : acc, 0);
        if (todayLoss >= config.maxDailyLoss) {
            triggerLockout(`Max Daily Loss limit ($${config.maxDailyLoss}) reached.`);
            return;
        }

        let consecutiveLosses = 0;
        for (let i = 0; i < updatedHistory.length; i++) {
            if (updatedHistory[i].finalPnL < 0) consecutiveLosses++;
            else break;
        }
        if (consecutiveLosses >= config.maxConsecutiveLosses) {
            triggerLockout(`Max Consecutive Losses limit (${config.maxConsecutiveLosses}) reached.`);
        }
    }, [config.enableRules, config.maxDailyLoss, config.maxConsecutiveLosses, triggerLockout]);

    const saveTradeToDb = async (tradeData) => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            await api.post("/manual-trades", {
                symbol: tradeData.symbol,
                entry_price: tradeData.entryPrice,
                exit_price: tradeData.exitPrice,
                pnl: tradeData.finalPnL,
                is_win: tradeData.finalPnL > 0,
                notes: tradeData.note
            });
        } catch (error) {
            console.error("Failed to save trade to DB", error);
        }
    };

    const closePosition = useCallback((id, reason = 'MANUAL') => {
        setAccount(prev => {
            const position = prev.positions.find(p => p.id === id);
            if (!position) return prev;

            let pnl = 0;
            const priceDiff = marketState.price - position.entryPrice;
            if (position.type === 'BUY') {
                pnl = (priceDiff / position.entryPrice) * position.size;
            } else {
                pnl = (-priceDiff / position.entryPrice) * position.size;
            }

            const historyItem = { ...position, exitPrice: marketState.price, closeTime: new Date(), finalPnL: pnl, reason };
            const newHistory = [historyItem, ...prev.history];
            const newBalance = prev.balance + pnl;

            // Save the completed trade to the permanent database history
            saveTradeToDb(historyItem);
            
            checkRulesAfterClose(newHistory);

            return {
                ...prev,
                balance: newBalance,
                equity: newBalance,
                positions: prev.positions.filter(p => p.id !== id),
                history: newHistory
            };
        });
    }, [marketState.price, checkRulesAfterClose, saveTradeToDb]);

    useEffect(() => {
        if (!isSessionActive) return;
        let isMounted = true;
        // setMarketState({ price: 0, isLoading: true, lastUpdate: null });
        
        let isFetching = false; 
        const fetchPrice = async () => {
            if (isFetching) return; 
            isFetching = true;
            try {
                const symbolMap = { "UNIUSDT": "UNI7083-USD", "PEPEUSDT": "PEPE24478-USD" };
                let backendSymbol = symbolMap[activeSymbol] || activeSymbol.replace("BINANCE:", "");
                if (!symbolMap[activeSymbol] && backendSymbol.endsWith("USDT")) {
                    backendSymbol = backendSymbol.replace("USDT", "-USD");
                }
                const encodedSymbol = encodeURIComponent(backendSymbol);
                // use api.get with path relatif and timeout fetch with interval
                const response = await api.get(`/price/${encodedSymbol}`, { timeout: 5000 });
                if (isMounted && response.data.status === 'success') {
                    setMarketState({ price: response.data.price, isLoading: false, lastUpdate: new Date() });
                } else if (isMounted) {
                    setMarketState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                if (isMounted) console.error("Error fetching price:", error);
                if (isMounted) setMarketState(prev => ({ ...prev, isLoading: false }));
            } finally {
                isFetching = false;
            }
        };
        fetchPrice();
        const intervalId = setInterval(fetchPrice, 5000);
        return () => { isMounted = false; clearInterval(intervalId); };
    }, [isSessionActive, activeSymbol]);

    useEffect(() => {
        if (lockout) {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const diff = lockout.until - now;
                if (diff <= 0) {
                    setLockout(null);
                    localStorage.removeItem('trading_lockout');
                    clearInterval(interval);
                } else {
                    setTimeLeft(new Date(diff).toISOString().substr(14, 5));
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [lockout]);

    useEffect(() => {
        if (account.positions.length > 0 && marketState.price > 0) {
            let totalFloatingPnL = 0;
            let positionsToClose = [];
            account.positions.forEach(pos => {
                let pnl = pos.type === 'BUY' ? ((marketState.price - pos.entryPrice) / pos.entryPrice) * pos.size : (-(marketState.price - pos.entryPrice) / pos.entryPrice) * pos.size;
                totalFloatingPnL += pnl;
                if (pos.type === 'BUY') {
                    if (marketState.price <= pos.slPrice) positionsToClose.push({ id: pos.id, reason: 'SL' });
                    if (marketState.price >= pos.tpPrice) positionsToClose.push({ id: pos.id, reason: 'TP' });
                } else {
                    if (marketState.price >= pos.slPrice) positionsToClose.push({ id: pos.id, reason: 'SL' });
                    if (marketState.price <= pos.tpPrice) positionsToClose.push({ id: pos.id, reason: 'TP' });
                }
            });
            const newEquity = account.balance + totalFloatingPnL;
            setAccount(prev => {
                if (Math.abs(prev.equity - newEquity) < 0.0001) return prev; // Prevent re-render if change is negligible
                return { ...prev, equity: newEquity };
            });

            if (config.isChallengeMode && challengeState.status === 'ACTIVE') {
                const maxDrawdownLimit = config.initialCapital * (1 - config.challengeMaxDrawdownPct / 100);
                const targetLimit = config.initialCapital * (1 + config.challengeTargetPct / 100);
                if (newEquity <= maxDrawdownLimit) {
                    setChallengeState(prev => ({ ...prev, status: 'FAILED', endTime: new Date(), reason: 'Max Drawdown Violated' }));
                } else if (account.balance >= targetLimit) {
                    setChallengeState(prev => ({ ...prev, status: 'PASSED', endTime: new Date(), reason: 'Profit Target Reached' }));
                }
            }

            if (positionsToClose.length > 0) {
                const idsToClose = new Set(positionsToClose.map(p => p.id));
                idsToClose.forEach(id => {
                    const reason = positionsToClose.find(p => p.id === id).reason;
                    closePosition(id, reason);
                });
            }
        } else {
            setAccount(prev => {
                if (prev.equity === prev.balance) return prev; // Prevent re-render if already synced
                return { ...prev, equity: prev.balance };
            });
        }
    }, [marketState.price, account.balance, account.positions, config, challengeState.status, closePosition]);

    const startSession = useCallback((e) => {
        e.preventDefault();
        setAccount({ balance: config.initialCapital, equity: config.initialCapital, positions: [], history: [] });
        setIsSessionActive(true);
        if (config.isChallengeMode) {
            setChallengeState({ status: 'ACTIVE', startTime: new Date(), endTime: null, reason: '' });
        } else {
            setChallengeState({ status: 'IDLE', startTime: null, endTime: null, reason: '' });
        }
    }, [config.initialCapital, config.isChallengeMode]);

    const resetSession = useCallback(() => {
        setIsSessionActive(false);
        setAccount(defaultState.account);
        setChallengeState(defaultState.challengeState);
        if (storageKey) {
            localStorage.removeItem(storageKey);
        }
    }, [storageKey]);

    const openPosition = useCallback((type) => {
        if (marketState.price === 0) return;
        if (config.enableRules && account.history.length >= config.maxTradesPerDay) {
            triggerLockout(`Max Trades Per Day limit (${config.maxTradesPerDay}) reached.`);
            return;
        }
        let slPrice, tpPrice;
        if (type === 'BUY') {
            slPrice = marketState.price * (1 - config.stopLossPct / 100);
            tpPrice = marketState.price * (1 + config.takeProfitPct / 100);
        } else {
            slPrice = marketState.price * (1 + config.stopLossPct / 100);
            tpPrice = marketState.price * (1 - config.takeProfitPct / 100);
        }
        const newPosition = { id: Date.now(), type, entryPrice: marketState.price, size: config.tradeAmount, symbol: activeSymbol, openTime: new Date(), slPrice, tpPrice, note: config.tradeNote || "-" };
        setAccount(prev => ({ ...prev, positions: [newPosition, ...prev.positions] }));
        setConfig(prev => ({ ...prev, tradeNote: '' }));
    }, [marketState.price, config, account.history.length, activeSymbol, triggerLockout]);

    const value = useMemo(() => ({
        config, setConfig,
        marketState,
        account, setAccount,
        challengeState,
        isSessionActive, setIsSessionActive,
        healthData, setHealthData,
        lockout,
        timeLeft,
        startSession,
        openPosition,
        closePosition,
        resetSession,
    }), [config, marketState, account, challengeState, isSessionActive, healthData, lockout, timeLeft, startSession, openPosition, closePosition, resetSession]);

    return (
        <ManualTradeContext.Provider value={value}>
            {children}
        </ManualTradeContext.Provider>
    );
};