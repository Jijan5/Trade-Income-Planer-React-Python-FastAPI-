import random
import math
from decimal import Decimal, getcontext
import requests
from .models import ( SimulationResponse, DailyResult, TradeResult, GoalPlannerResponse, HealthAnalysisResponse )

# Set precision for Decimal calculations
getcontext().prec = 28

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
    # Prepare symbol
    raw_symbol = symbol.replace("BINANCE:", "").replace("24478", "").replace("7083", "")
    
    # 1. Try Binance (Primary)
    try:
        binance_symbol = raw_symbol.replace("-", "")
        if "USD" in binance_symbol and not binance_symbol.endswith("T"): binance_symbol += "T"
        
        url = f"https://api.binance.com/api/v3/ticker/price?symbol={binance_symbol}"
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=2)
        if r.status_code == 200: 
            return {"status": "success", "price": float(r.json()['price']), "symbol": binance_symbol}
    except:
        pass # Continue to fallback

    # 2. Fallback: CryptoCompare (If Binance is blocked)
    try:
        base_asset = raw_symbol.replace("-USD", "").replace("USDT", "").replace("USD", "")
        url = f"https://min-api.cryptocompare.com/data/price?fsym={base_asset}&tsyms=USD"
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "USD" in data:
                return {"status": "success", "price": float(data["USD"]), "symbol": base_asset + "USDT"}
    except Exception as e:
        print(f"Price fetch error: {e}")

    return {"status": "error", "price": 0}

def analyze_trade_health(request):
    trades = request.trades
    if not trades:
        return HealthAnalysisResponse(
            overall_score=0, risk_score=0, emotional_score=0, system_score=0,
            summary="Not enough data.", warnings=[], recommended_risk=1.0,
            recommendation_reason="Start trading to get analysis.",
            trading_identity="Newcomer", identity_insight="The journey begins."
        )
    # 1. Calculate Basic Metrics
    total_trades = len(trades)
    wins = [t for t in trades if t.is_win]
    losses = [t for t in trades if not t.is_win]
    win_rate = (len(wins) / total_trades) * 100 if total_trades > 0 else 0
    
    # 2. Risk Analysis
    # Check if any single loss > 3% of balance (Aggressive/Reckless) // uncomment if use this
    # high_risk_trades = [t for t in losses if abs(float(t.pnl)) > float(t.balance) * 0.03] // uncomment if use this
    
    # Calculate risk percentage for each trade based on intended risk (SL distance)
    risk_percents = []
    for t in trades:
        bal = float(t.balance)
        risk = float(t.risk_amount)
        if bal > 0:
            risk_percents.append((risk / bal) * 100)
        else:
            risk_percents.append(0)
    
    # Check consistency of risk amount (Standard Deviation)
    risk_amounts = [float(t.risk_amount) for t in trades]
    avg_risk = sum(risk_amounts) / len(risk_amounts) if risk_amounts else 0
    risk_variance = sum((r - avg_risk) ** 2 for r in risk_amounts) / len(risk_amounts) if risk_amounts else 0
    risk_std_dev = math.sqrt(risk_variance)
    
    risk_score = 100
    # if high_risk_trades: risk_score -= 30 // uncomment if use this
    # if avg_risk > 0 and risk_std_dev > avg_risk * 0.5: risk_score -= 20 // uncomment if use this
    
    # Penalize for high risk bets (> 3% of balance) - Gambler behavior
    if any(rp > 3.0 for rp in risk_percents): 
        risk_score -= 30 
    
    # Penalize for generally high average risk (> 2%) - Aggressive behavior
    avg_risk_pct = sum(risk_percents) / len(risk_percents) if risk_percents else 0
    if avg_risk_pct > 2.0:
        risk_score -= 20    
    # Penalize for inconsistent sizing (Standard Deviation > 50% of Average)
    if avg_risk > 0 and risk_std_dev > avg_risk * 0.5: 
        risk_score -= 20
    
    risk_score = max(0, min(100, risk_score))
    # 3. Emotional Analysis (Revenge Trading & Tilt)
    emotional_score = 100
    consecutive_losses = 0
    max_consecutive_losses = 0
    revenge_trading_detected = False
    
    for i in range(len(trades)):
        if not trades[i].is_win:
            consecutive_losses += 1
            # Check if next trade risk increased significantly (> 20%) after a loss
            if i + 1 < len(trades):
                if float(trades[i+1].risk_amount) > float(trades[i].risk_amount) * 1.2:
                    revenge_trading_detected = True
        else:
            consecutive_losses = 0
        max_consecutive_losses = max(max_consecutive_losses, consecutive_losses)
    if max_consecutive_losses >= 3: emotional_score -= 20
    if max_consecutive_losses >= 5: emotional_score -= 20
    if revenge_trading_detected: emotional_score -= 40
    emotional_score = max(0, min(100, emotional_score))
    # 4. System Analysis (Performance)
    system_score = 100
    gross_profit = sum(float(t.pnl) for t in wins)
    gross_loss = abs(sum(float(t.pnl) for t in losses))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else (10 if gross_profit > 0 else 0)
    
    if win_rate < 30: system_score -= 30
    elif win_rate < 40: system_score -= 10
    
    if profit_factor < 1.0: system_score -= 40
    elif profit_factor < 1.5: system_score -= 10
    
    system_score = max(0, min(100, system_score))
    # 5. Overall & Identity Logic
    overall_score = int((risk_score + emotional_score + system_score) / 3)
    
    # CRITICAL FIX: Cap score if unprofitable (Profit Factor < 1)
    # This ensures a losing trader never gets a "Good" score
    if profit_factor < 1.0:
        overall_score = min(overall_score, 45)
    identity = "Disciplined Trader"
    insight = "You are following a consistent plan."
    rec_risk = 1.0
    rec_reason = "Maintain current sizing."
    
    if revenge_trading_detected:
        identity = "Revenge Trader"
        insight = "Increasing size after losses is dangerous."
        rec_risk = 0.5
        rec_reason = "Reduce size to regain control."
    elif max_consecutive_losses >= 3 and emotional_score < 60:
        identity = "Tilting Trader"
        insight = "Consecutive losses are affecting you."
        rec_risk = 0.5
        rec_reason = "Take a break."
    elif risk_score < 60:
        identity = "Gunslinger"
        insight = "Risk sizing is too erratic or high."
        rec_risk = 1.0
        rec_reason = "Standardize risk."
    elif system_score < 50:
        identity = "Strategist in Training"
        insight = "Strategy is not yet profitable."
        rec_risk = 0.5
        rec_reason = "Focus on setup quality."
    elif total_trades < 5:
        identity = "Novice Trader"
        insight = "Building data history."
    return HealthAnalysisResponse(
        overall_score=overall_score,
        risk_score=int(risk_score),
        emotional_score=int(emotional_score),
        system_score=int(system_score),
        summary=f"Win Rate: {win_rate:.1f}%, PF: {profit_factor:.2f}. {insight}",
        warnings=["Stop trading if tilted."] if emotional_score < 50 else [],
        recommended_risk=rec_risk,
        recommendation_reason=rec_reason,
        trading_identity=identity,
        identity_insight=insight
    )