from decimal import Decimal, getcontext
import random
import time
import os
# from google import genai
import google.generativeai as genai
import yfinance as yf
import requests
from .models import ( SimulationResponse, DailyResult, TradeResult, GoalPlannerResponse, HealthAnalysisResponse )

# Set precision for Decimal calculations
getcontext().prec = 28

# Simple in-memory cache for market prices
# Cache format: {symbol: (price_data, timestamp)}
_price_cache = {}
_CACHE_DURATION = 30  # seconds

def calculate_compounding(request):
    initial_balance = float(request.initial_balance)
    # capital_utilization is used for margin logic, but for simple compounding usually risk is based on total equity
    # We will assume risk % is based on total account balance for dynamic, or initial for fixed.
    risk_per_trade = float(request.risk_per_trade) / 100
    rr_ratio = float(request.risk_reward_ratio)
    win_rate = float(request.win_rate) / 100
    trades_per_day = request.trades_per_day
    days = request.simulation_days
    fees = float(request.fees_per_trade)
    risk_type = request.risk_type

    total_trades = days * trades_per_day
    
    # --- 1. Deterministic Projection (For the main chart) ---
    # Creates a "representative" equity curve based on the win rate
    
    daily_results = []
    current_balance = initial_balance
    trade_log = []
    
    # Create a deterministic sequence of wins/losses based on winrate
    wins_needed = int(total_trades * win_rate)
    losses_needed = total_trades - wins_needed
    outcomes = [True] * wins_needed + [False] * losses_needed
    random.shuffle(outcomes) # Shuffle to make the daily log look realistic
    
    trade_counter = 0
    
    for day in range(1, days + 1):
        start_bal = current_balance
        daily_pnl = 0
        
        for _ in range(trades_per_day):
            if current_balance <= 0: break
            if trade_counter >= len(outcomes): break
            is_win = outcomes[trade_counter]
            trade_counter += 1
            
            # Calculate Risk Amount
            if risk_type == "dynamic":
                risk_amount = current_balance * risk_per_trade
            else: # fixed
                risk_amount = initial_balance * risk_per_trade
            
            # Calculate PnL
            trade_pnl = 0
            if is_win:
                trade_pnl = (risk_amount * rr_ratio) - fees
            else:
                trade_pnl = -risk_amount - fees
            
            current_balance += trade_pnl
            daily_pnl += trade_pnl
            
            # Log first 100 trades for UI
            if len(trade_log) < 100:
                trade_log.append(TradeResult(
                    trade_no=trade_counter,
                    day=day,
                    result="WIN" if is_win else "LOSS",
                    pnl=f"{trade_pnl:.2f}",
                    balance=f"{current_balance:.2f}"
                ))

        if current_balance <= 0:
            current_balance = 0
            
        roi = ((current_balance - start_bal) / start_bal * 100) if start_bal > 0 else 0
        
        daily_results.append(DailyResult(
            day=day,
            start_balance=f"{start_bal:.2f}",
            profit_loss=f"{daily_pnl:.2f}",
            end_balance=f"{current_balance:.2f}",
            roi=f"{roi:.2f}%"
        ))
        
        if current_balance <= 0:
            break

    # --- 2. Monte Carlo Simulation (The Optimization) ---
    # Run 500 parallel universes to find the probability of ruin and range of outcomes
    
    iterations = 500
    final_balances = []
    ruin_count = 0
    max_drawdowns = []
    
    for _ in range(iterations):
        mc_balance = initial_balance
        mc_peak = initial_balance
        mc_drawdown = 0
        
        # Simulate trades for this iteration
        for _ in range(total_trades):
            if mc_balance <= 0:
                break
            
            # Randomize outcome based on win rate
            is_win = random.random() < win_rate
            
            if risk_type == "dynamic":
                risk_amt = mc_balance * risk_per_trade
            else:
                risk_amt = initial_balance * risk_per_trade
                
            if is_win:
                pnl = (risk_amt * rr_ratio) - fees
            else:
                pnl = -risk_amt - fees
            
            mc_balance += pnl
            
            # Track Drawdown
            if mc_balance > mc_peak:
                mc_peak = mc_balance
            
            if mc_peak > 0:
                dd = (mc_peak - mc_balance) / mc_peak * 100
                if dd > mc_drawdown:
                    mc_drawdown = dd
        
        if mc_balance <= 0:
            ruin_count += 1
            mc_balance = 0
            
        final_balances.append(mc_balance)
        max_drawdowns.append(mc_drawdown)

    final_balances.sort()
    median_result = final_balances[len(final_balances)//2]
    worst_case = final_balances[int(len(final_balances)*0.05)] # Bottom 5%
    best_case = final_balances[int(len(final_balances)*0.95)] # Top 5%
    
    ruin_probability = (ruin_count / iterations) * 100
    avg_max_drawdown = sum(max_drawdowns) / len(max_drawdowns)
    
    # Summary Metrics
    total_profit = current_balance - initial_balance
    total_roi = (total_profit / initial_balance) * 100 if initial_balance > 0 else 0
    
    # Expectancy Calculation
    expectancy_val = (initial_balance * risk_per_trade * rr_ratio * win_rate) - (initial_balance * risk_per_trade * (1 - win_rate)) - fees
    
    return SimulationResponse(
        status="success",
        summary={
            "initial_balance": f"{initial_balance:.2f}",
            "final_balance": f"{current_balance:.2f}",
            "total_profit": f"{total_profit:.2f}",
            "total_roi": f"{total_roi:.2f}%",
            "max_drawdown": f"{avg_max_drawdown:.2f}%", # Average Max Drawdown from MC is more reliable
            "profit_factor": f"{((win_rate * rr_ratio) / (1 - win_rate) if win_rate < 1 else 999):.2f}",
            "expectancy": f"{expectancy_val:.2f}",
            "risk_of_ruin": f"{ruin_probability:.1f}%",
            "day_simulated": days
        },
        daily_breakdown=daily_results,
        monte_carlo={
            "iterations": iterations,
            "worst_case": f"{worst_case:.2f}",
            "median": f"{median_result:.2f}",
            "best_case": f"{best_case:.2f}",
            "ruin_probability": f"{ruin_probability:.1f}"
        },
        trade_log=trade_log
    )

def calculate_goal_plan(request):
    try:
        initial = float(request.initial_balance)
        target = float(request.target_balance)
        months = request.deadline_months
        
        if initial >= target:
            return GoalPlannerResponse(status="success", required_monthly_return="0.00%", feasibility="Achieved", message="Target reached.")
            
        required_growth = (target / initial) ** (1 / months) - 1
        required_monthly_pct = required_growth * 100
        
        feasibility = "Realistic"
        msg = "Achievable with discipline."
        if required_monthly_pct > 50: feasibility, msg = "Very Unlikely", "Extremely high risk required."
        elif required_monthly_pct > 20: feasibility, msg = "Ambitious", "Requires high skill or risk."
        elif required_monthly_pct > 10: feasibility, msg = "Challenging", "Professional level returns."
            
        return GoalPlannerResponse(status="success", required_monthly_return=f"{required_monthly_pct:.2f}%", feasibility=feasibility, message=msg)
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_market_price(symbol):
    global _price_cache
    
    # Check cache first
    current_time = time.time()
    if symbol in _price_cache:
        cached_data, timestamp = _price_cache[symbol]
        if current_time - timestamp < _CACHE_DURATION:
            return cached_data
    
    try:
        # Normalize symbol for yfinance
        norm_symbol = symbol.upper().replace("BINANCE:", "").replace("PEPE24478", "PEPE").replace("UNI7083", "UNI")
        norm_symbol = norm_symbol.replace("USDT", "USD")
        
        # Commodities direct map
        if 'XAU' in norm_symbol or 'GOLD' in norm_symbol:
            norm_symbol = 'GC=F'
        elif 'XAG' in norm_symbol or 'SILVER' in norm_symbol:
            norm_symbol = 'SI=F'
        elif 'OIL' in norm_symbol:
            norm_symbol = 'CL=F'
        # Format for Crypto (yfinance needs -USD suffix)
        elif norm_symbol.endswith("USD") and "-" not in norm_symbol and len(norm_symbol) > 3:
            if not any(pair in norm_symbol for pair in ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']):
                norm_symbol = f"{norm_symbol[:-3]}-USD"
        elif norm_symbol in ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "ADA", "PEPE", "UNI"]:
            norm_symbol = f"{norm_symbol}-USD"
            
        # Forex suffix
        if not '=' in norm_symbol and "-" not in norm_symbol:
            if any(pair in norm_symbol for pair in ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']):
                norm_symbol += '=X'
        
        ticker = yf.Ticker(norm_symbol)
        info = ticker.info
        price = info.get('regularMarketPrice') or info.get('currentPrice')
        
        if price is None:
            # Fallback to history
            hist = ticker.history(period="1d")
            if not hist.empty:
                price = hist['Close'].iloc[-1]
            else:
                raise ValueError("No price data")
        
        result = {"status": "success", "price": float(price), "symbol": norm_symbol}
        _price_cache[symbol] = (result, current_time)
        return result
        
    except Exception as e:
        print(f"yfinance price fetch error for {symbol}: {e}")
        return {"status": "error", "price": 0}

def analyze_trade_health(request):
    trades = request.trades
    if not trades:
        return HealthAnalysisResponse(
            overall_score=0, risk_score=0, emotional_score=0, system_score=0,
            summary="Not enough data. Complete a few trades for AI analysis.", warnings=[], recommended_risk=1.0,
            recommendation_reason="Start trading to get personalized coaching.", ai_insight="",
            trading_identity="Newcomer", identity_insight="Let's build your trading history first."
        )
    
    # Use new GEMINI_TRADING_COACH_KEY for tests, fallback rule-based
    api_key = os.getenv("GEMINI_TRADING_COACH_KEY")
    if not api_key:
        # Rule-based fallback for tests
        total_trades = len(trades)
        wins = sum(1 for t in trades if t.is_win)
        win_rate_pct = (wins / total_trades * 100) if total_trades > 0 else 0
        
        # Risk analysis
        avg_risk = sum(t.risk_amount for t in trades) / total_trades if total_trades > 0 else 0
        risk_score = 80 if avg_risk <= trades[0].balance * 0.02 else 40 if avg_risk <= trades[0].balance * 0.05 else 20
        
        # Emotional: check revenge (increasing size after loss)
        emotional_score = 80
        if total_trades >= 2:
            for i in range(1, total_trades):
                if not trades[i-1].is_win and trades[i].risk_amount > trades[i-1].risk_amount * 1.2:
                    emotional_score = 30
                    break
        
        overall_score = int((win_rate_pct / 100 * 40) + (risk_score / 100 * 30) + (emotional_score / 100 * 30))
        system_score = 70  # Default
        
        return HealthAnalysisResponse(
            overall_score=overall_score,
            risk_score=risk_score,
            emotional_score=emotional_score,
            system_score=system_score,
            summary=f"Win Rate: {win_rate_pct:.1f}%, Risk: Good",
            warnings=[] if risk_score > 60 else ["High risk per trade detected"],
            recommended_risk=1.0 if risk_score > 70 else 0.5,
            recommendation_reason="Standard 1% risk",
            trading_identity="Developing Trader" if win_rate_pct > 50 else "Risk Taker",
            identity_insight="Work on consistency.",
            ai_insight="Review last 3 trades."
        )
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Prepare trade data for AI
        trade_summaries = []
        for trade in trades:
            trade_summaries.append(f"Trade: PnL ${trade.pnl} (Balance ${trade.balance}, Risk ${trade.risk_amount or 'N/A'}), {'Win' if trade.is_win else 'Loss'}")
        
        trades_text = "; ".join(trade_summaries)
        total_trades = len(trades)
        wins = sum(1 for t in trades if t.is_win)
        win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
        
        prompt = f'''You are an expert AI Trading Coach for Trade Income Planner app.

ANALYZE these {total_trades} trades: {trades_text}

Key Metrics:
- Win Rate: {win_rate:.1f}%
- Total Trades: {total_trades}

REQUIRED OUTPUT FORMAT (JSON):
{{
  "overall_score": 0-100,
  "risk_score": 0-100,
  "emotional_score": 0-100, 
  "system_score": 0-100,
  "summary": "1 sentence summary",
  "warnings": ["list", "of", "warnings"],
  "recommended_risk": 0.5-2.0,
  "recommendation_reason": "Why this risk %",
  "trading_identity": "e.g. Revenge Trader, Disciplined Scalper",
  "identity_insight": "1 sentence insight about their style",
  "ai_insight": "Actionable next trade advice (2-3 sentences)"
}}

Score LOW if:
- Win rate <40%
- Risk/reward poor
- Revenge trading (bigger size after losses)
- Inconsistent sizing

Score HIGH if:
- Consistent profits
- Proper risk mgmt (1-2%)
- No tilt signs
'''
        
        response = model.generate_content(prompt)
        ai_analysis = response.text.strip()
        
        # Simple JSON parse (in production use proper parser)
        try:
            # Extract JSON from response (handle markdown)
            json_start = ai_analysis.find('{')
            json_end = ai_analysis.rfind('}') + 1
            json_str = ai_analysis[json_start:json_end]
            analysis = eval(json_str)  # Dangerous, replace with json.loads in prod
        except:
            analysis = {
                "overall_score": 50,
                "risk_score": 50, 
                "emotional_score": 50,
                "system_score": 50,
                "summary": "AI analysis processing - check your trades.",
                "warnings": [],
                "recommended_risk": 1.0,
                "recommendation_reason": "Standard risk.",
                "trading_identity": "Developing Trader",
                "identity_insight": "Continue building consistency.",
                "ai_insight": "Review your last 3 trades for patterns."
            }
        
        return HealthAnalysisResponse(
            overall_score=int(analysis.get("overall_score", 50)),
            risk_score=int(analysis.get("risk_score", 50)),
            emotional_score=int(analysis.get("emotional_score", 50)),
            system_score=int(analysis.get("system_score", 50)),
            summary=analysis.get("summary", ""),
            warnings=analysis.get("warnings", []),
            recommended_risk=float(analysis.get("recommended_risk", 1.0)),
            recommendation_reason=analysis.get("recommendation_reason", ""),
            trading_identity=analysis.get("trading_identity", "Trader"),
            identity_insight=analysis.get("identity_insight", ""),
            ai_insight=analysis.get("ai_insight", "")
        )
    except Exception as e:
        print(f"AI Coach error: {e}")
        # Graceful fallback
        return HealthAnalysisResponse(
            overall_score=50, risk_score=50, emotional_score=50, system_score=50,
            summary=f"AI Coach enhanced analysis (fallback). Error: {str(e)[:50]}",
            warnings=["AI temporarily unavailable"], recommended_risk=1.0,
            recommendation_reason="Standard practice until fixed.",
            ai_insight="AI Coach will provide deeper insights soon.",
            trading_identity="Active Trader", identity_insight="Keep trading."
        )