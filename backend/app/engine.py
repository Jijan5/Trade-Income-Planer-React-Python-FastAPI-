from decimal import Decimal, getcontext, ROUND_HALF_UP
from typing import List, Dict
import math
import random
import yfinance as yf
import statistics
from .models import SimulationRequest, DailyResult, GoalPlannerRequest, HealthAnalysisRequest, HealthAnalysisResponse

# set precision global
getcontext().prec = 28

def calculate_compounding(data: SimulationRequest) -> Dict:
  current_balance = data.initial_balance
  peak_balance = data.initial_balance
  max_drawdown_pct = Decimal("0")
  total_gross_profit = Decimal("0")
  total_gross_loss = Decimal("0")
  trade_log = []
  trade_counter = 0
  result = []
  
  # convertion percent to decimal
  utilization_rate = data.capital_utilization / Decimal("100")
  risk_rate = data.risk_per_trade / Decimal("100")
  win_prob = data.win_rate / Decimal("100")
  loss_prob = Decimal("1") - win_prob
  
  # Pre-calculate fixed risk amount if needed
  fixed_active_capital = data.initial_balance * utilization_rate
  fixed_risk_amount = fixed_active_capital * risk_rate
  fixed_reward_amount = fixed_risk_amount * data.risk_reward_ratio
  
  # loop through days
  for day in range(1, data.simulation_days + 1):
    start_bal = current_balance
    daily_pl = Decimal("0")
    
    # loop trades per day
    # expected values
    # Win% * Reward$ - Loss% * Risk$
    for _ in range(data.trades_per_day):
      trade_counter += 1
      if data.risk_type == "fixed":
        # Fixed Risk: Based on Initial Balance
        risk_amount = fixed_risk_amount
        reward_amount = fixed_reward_amount
      else:
        # Dynamic Risk: Based on Current Balance (Compounding)
        active_capital = current_balance * utilization_rate
        risk_amount = active_capital * risk_rate
        reward_amount = risk_amount * data.risk_reward_ratio

      # Accumulate Gross Profit/Loss for Profit Factor
      # Expected Gross Profit per trade = Win% * Reward
      total_gross_profit += (win_prob * reward_amount)
      total_gross_loss += (loss_prob * risk_amount) + data.fees_per_trade
      
      # calculate expected value
      expected_value = (win_prob * reward_amount) - (loss_prob * risk_amount)
      
      # subtract fees (fees apply to every trade, win or lose)
      net_profit = expected_value - data.fees_per_trade
      
      daily_pl += net_profit
      current_balance += net_profit
      
      # Record Trade Log
      trade_log.append({
        "trade_no": trade_counter,
        "day": day,
        "result": "WIN" if net_profit > 0 else "LOSS",
        "pnl": f"{net_profit:.2f}",
        "balance": f"{current_balance:.2f}"
      })
      
      # Calculate Drawdown
      if current_balance > peak_balance:
        peak_balance = current_balance
      else:
        drawdown = (peak_balance - current_balance) / peak_balance * 100
        if drawdown > max_drawdown_pct:
          max_drawdown_pct = drawdown
      
      # edge case: balance should not go below zero
      if current_balance <= 0:
        current_balance = Decimal("0")
        break
      
    # formatting results per day
    roi_pct = ((daily_pl / start_bal) * 100) if start_bal > 0 else Decimal("0")
    
    result.append(DailyResult(
      day=day,
      start_balance=f"{start_bal:.2f}",
      profit_loss=f"{daily_pl:.2f}",
      end_balance=f"{current_balance:.2f}",
      roi=f"{roi_pct:.2f}%"
    ))
    
    if current_balance <= 0:
      break
    
  # final summary
  total_profit = current_balance - data.initial_balance
  total_roi = (total_profit / data.initial_balance * 100) if data.initial_balance > 0 else Decimal("0")
  
  # Advanced Metrics
  # 1. Profit Factor
  profit_factor = (total_gross_profit / total_gross_loss) if total_gross_loss > 0 else Decimal("99.99")
  
  # 2. Expectancy (Average Profit per Trade)
  total_trades = data.trades_per_day * len(result)
  expectancy = (total_profit / total_trades) if total_trades > 0 else Decimal("0")

  # 3. Risk of Ruin (Approximation)
  # Formula: ((1 - Win%) / (Win% * RR)) ^ (1 / Risk%)
  # Only valid if Edge > 0
  risk_of_ruin = Decimal("0.00")
  edge = (win_prob * data.risk_reward_ratio) - loss_prob
  
  if edge <= 0:
    risk_of_ruin = Decimal("100.00")
  else:
    try:
      # Simple approximation for Risk of Ruin
      numerator = (Decimal("1") - win_prob)
      denominator = (win_prob * data.risk_reward_ratio)
      exponent = Decimal("1") / risk_rate
      # Using float for power calculation as Decimal power can be slow/complex
      ror_float = math.pow(float(numerator / denominator), float(exponent)) * 100
      risk_of_ruin = Decimal(str(ror_float))
      if risk_of_ruin > 100: risk_of_ruin = Decimal("100.00")
    except:
      risk_of_ruin = Decimal("0.00") # Should not happen if edge > 0
      
    # Monte Carlo Simulation
  monte_carlo_results = run_monte_carlo(data)
  
  return {
    "status": "success",
    "summary": {
      "initial_balance": f"{data.initial_balance:.2f}",
      "final_balance": f"{current_balance:.2f}",
      "total_profit": f"{total_profit:.2f}",
      "total_roi": f"{total_roi:.2f}%",
      "max_drawdown": f"{max_drawdown_pct:.2f}%",
      "profit_factor": f"{profit_factor:.2f}",
      "expectancy": f"{expectancy:.2f}",
      "risk_of_ruin": f"{risk_of_ruin:.2f}%",
      "day_simulated": len(result)
    },
    "daily_breakdown": result, 
    "trade_log": trade_log,
    "monte_carlo": monte_carlo_results
  }

def run_monte_carlo(data: SimulationRequest, iterations: int = 500) -> Dict:
  final_balances = []
  ruin_count = 0
  
  # Convert to float for faster processing in loop (Monte Carlo doesn't need Decimal precision)
  win_rate_float = float(data.win_rate / 100)
  util_float = float(data.capital_utilization / 100)
  risk_float = float(data.risk_per_trade / 100)
  rr_float = float(data.risk_reward_ratio)
  fees_float = float(data.fees_per_trade)
  initial_bal_float = float(data.initial_balance)
  
  # Define Ruin Threshold
  # For dynamic risk, we define ruin as < 1% of initial capital (99% drawdown)
  ruin_threshold = initial_bal_float * 0.01 if data.risk_type == "dynamic" else 0.0
  
  total_trades = data.trades_per_day * data.simulation_days

  for _ in range(iterations):
    balance = initial_bal_float
    is_ruined = False
    for _ in range(total_trades):
      # Determine Risk Amount
      if data.risk_type == "fixed":
        risk_amt = (initial_bal_float * util_float) * risk_float
      else:
        risk_amt = (balance * util_float) * risk_float
      
      # Randomize Outcome
      if random.random() < win_rate_float:
        profit = (risk_amt * rr_float) - fees_float
        balance += profit
      else:
        loss = risk_amt + fees_float
        balance -= loss
      
      if balance <= ruin_threshold:
        balance = 0
        is_ruined = True
        break
      
    if is_ruined:
      ruin_count += 1
    final_balances.append(balance)
  
  final_balances.sort()
  ruin_probability = (ruin_count / iterations) * 100
  
  return {
    "worst_case": f"{final_balances[int(iterations * 0.05)]:.2f}", # 5th percentile
    "median": f"{final_balances[int(iterations * 0.5)]:.2f}",      # 50th percentile
    "best_case": f"{final_balances[int(iterations * 0.95)]:.2f}",  # 95th percentile
    "iterations": iterations,
    "ruin_probability": f"{ruin_probability:.1f}"
  }
  
def calculate_goal_plan(data: GoalPlannerRequest) -> Dict:
    try:
        # Formula: r = (FV / PV)^(1/n) - 1
        fv = data.target_balance
        pv = data.initial_balance
        n = data.deadline_months

        if fv <= pv:
            return {
                "status": "error",
                "message": "Target balance must be greater than the initial balance."
            }

        # Using float for power calculation is fine here for an estimate
        monthly_rate = (fv / pv) ** (Decimal(1) / n) - 1
        monthly_return_pct = monthly_rate * 100

        # Feasibility Score
        feasibility = "Realistic"
        if monthly_return_pct > 20:
            feasibility = "Ambitious"
        if monthly_return_pct > 50:
            feasibility = "Very Unlikely"

        message = (
            f"To grow ${pv:,.2f} to ${fv:,.2f} in {n} months, "
            f"you need an average monthly return of {monthly_return_pct:.2f}%. "
            f"This is considered a {feasibility.lower()} target."
        )

        return {
            "status": "success",
            "required_monthly_return": f"{monthly_return_pct:.2f}%",
            "feasibility": feasibility,
            "message": message
        }
    except Exception as e:
        return {"status": "error", "message": f"An error occurred: {str(e)}"}

def get_market_price(symbol: str) -> Dict:
    try:
        # Mapping TradingView symbols to Yahoo Finance symbols
        yf_symbol = symbol
        if "BTC" in symbol and "USD" in symbol: yf_symbol = "BTC-USD"
        elif "ETH" in symbol and "USD" in symbol: yf_symbol = "ETH-USD"
        elif "SOL" in symbol and "USD" in symbol: yf_symbol = "SOL-USD"
        elif "XAUUSD" in symbol or "GOLD" in symbol: yf_symbol = "GC=F"
        elif "EURUSD" in symbol: yf_symbol = "EURUSD=X"
        elif "GBPUSD" in symbol: yf_symbol = "GBPUSD=X"
        elif "JPY" in symbol: yf_symbol = "JPY=X"
        elif "IDX:" in symbol: yf_symbol = symbol.split(":")[1] + ".JK"
        elif ":" in symbol: yf_symbol = symbol.split(":")[1] # NASDAQ:TSLA -> TSLA
        
        ticker = yf.Ticker(yf_symbol)
        # Get fast price data
        data = ticker.history(period="1d", interval="1m")
        
        if data.empty:
             return {"status": "error", "price": 0}
             
        current_price = data['Close'].iloc[-1]
        return {"status": "success", "symbol": yf_symbol, "price": float(current_price)}
    except Exception as e:
        return {"status": "error", "message": str(e), "price": 0}
      
def analyze_trade_health(data: HealthAnalysisRequest) -> dict:
  trades = data.trades
  if not trades:
    return {
      "overall_score": 0,
      "risk_score": 0,
      "emotional_score": 0,
      "system_score": 0,
      "summary": "No trades to analyze",
      "warnings": []
    }
    
  # 1. risk consistent score (30%)
  # calculate $ risk per trade
  risk_pcts = []
  for t in trades:
    if t.balance > 0:
      risk_pcts.append(float(t.risk_amount / t.balance) * 100)
        
  risk_score = 100
  if len(risk_pcts) > 1:
    stdev_risk = statistics.stdev(risk_pcts)
    # penalty for high risk standard deviation
    # if stdev 0 (very consistent) -> score 100
    risk_score = max (0, 100 - (stdev_risk * 40))
    
  #2. emotional control score
  emotional_score=100
  warnings = []
  
  #detection revenge credit
  revenge_count = 0
  for i in range(1, len(trades)):
    prev = trades [i-1]
    curr = trades [i]
    
    if not prev.is_win: # check previously lost
      # check risk amount is higher because emotional
      if curr.risk_amount > (prev.risk_amount * Decimal("1.5")):
        revenge_count += 1
        warnings.append(f"⚠️ Terdeteksi Revenge Trade pada trade #{i+1}: Risiko naik >50% setelah Loss.")
    
  emotional_score -= (revenge_count * 20) # big penalty for revenge trade
  emotional_score = max(0, emotional_score)
  
  # 3. System Quality Score (30%)
  system_score = 50 # Base score
  total_pnl = sum(t.pnl for t in trades)
  win_count = sum(1 for t in trades if t.is_win)
  win_rate = win_count / len(trades) if trades else 0
  
  if total_pnl > 0: system_score += 20
  if win_rate > 0.4: system_score += 15 # Winrate > 40% itu sehat
  if win_rate > 0.6: system_score += 15
  system_score = min(100, system_score)
      
  # Hitung Overall Score
  overall = int((risk_score * 0.3) + (emotional_score * 0.4) + (system_score * 0.3))
    
  # Generate Summary "Killer Feature"
  summary = ""
  if total_pnl > 0 and overall < 60:
      summary = f"🚨 Your trading is PROFITABLE, but your HEALTH SCORE is low ({overall}%). There is a high risk of blow up in the near future due to inconsistency."
  elif total_pnl <= 0 and overall > 70:
      summary = f"✅ Your trading is a LOSS, but your HEALTH SCORE is good ({overall}%). Your discipline and mentality are correct, just evaluate your entry/exit strategy."
  elif overall >= 80:
      summary = f"🏆 Excellent! Healthy, disciplined, and profitable trading. (Score: {overall}%)."
  else:
      summary = f"Health Score: {overall}%. Improve risk consistency and control emotions."
      
  # 4. Adaptive Risk Recommendation (Feature #2)
  rec_risk = 1.0 # Default conservative risk
  rec_reason = "Market condition neutral. Standard risk recommended."
  
  # Analyze Streaks (Win/Loss)
  current_streak = 0
  if len(trades) > 0:
      is_win_streak = trades[-1].is_win
      for t in reversed(trades):
          if t.is_win == is_win_streak:
              current_streak += 1
          else:
              break
      
      if not is_win_streak: # Loss Streak Logic
          if current_streak >= 2:
              rec_risk = 0.5
              rec_reason = f"⚠️ Loss streak detected ({current_streak}x). Risk reduced to 0.5% to preserve capital & mental state."
          else:
              rec_risk = 0.8
              rec_reason = "Recent loss. Slightly reduced risk (0.8%) recommended to regain confidence."
      else: # Win Streak Logic
          if current_streak >= 3:
              rec_risk = 1.0
              rec_reason = f"🔥 Win streak ({current_streak}x). Maintain 1% risk, beware of overconfidence (House Money Effect)."
          else:
              rec_risk = 1.2
              rec_reason = "✅ Momentum is good. You can slightly increase risk to 1.2%."

  # Analyze Drawdown (Safety Net)
  # Calculate current drawdown from peak balance in this session
  if trades:
      current_balance = trades[-1].balance + trades[-1].pnl
      peak_balance = max([t.balance for t in trades] + [current_balance])
      if peak_balance > 0:
          dd_pct = (peak_balance - current_balance) / peak_balance * 100
          if dd_pct > 5:
              rec_risk = min(rec_risk, 0.5)
              rec_reason = f"🚨 High Drawdown ({dd_pct:.1f}%). Risk minimized to 0.5% to halt bleeding."
    
  # 5. Trading Identity Profile (Feature #5)
  identity = "Unclassified"
  insight = "Not enough data to determine identity."
  
  avg_risk_pct = sum(risk_pcts) / len(risk_pcts) if risk_pcts else 0
  
  if overall >= 80:
      identity = "The Disciplined Sniper"
      insight = "You have professional-grade discipline. Your strategy and risk management are aligned. Keep it up!"
  elif emotional_score < 50:
      identity = "The Emotional Chaser"
      insight = "Your main enemy is yourself. You tend to revenge trade or lose control after losses. Focus on psychology, not strategy."
  elif risk_score < 50:
      identity = "The Inconsistent Gunner"
      insight = "You have skill, but your sizing is all over the place. You treat trading like gambling occasionally. Standardize your risk."
  elif avg_risk_pct > 3.0:
      identity = "The Daredevil (High Risk)"
      insight = "You take massive risks. While you may win big, you are statistically likely to blow up eventually. Lower your size."
  elif win_rate > 0.6 and overall < 60:
      identity = "The Overconfident Scalper"
      insight = "High win rate, but poor risk management. You rely on talent rather than system. One bad trade could wipe you out."
  else:
      identity = "The Developing Trader"
      insight = "You are on the right path but need more consistency. Stick to your rules."
        
  return {
      "overall_score": overall,
      "risk_score": int(risk_score),
      "emotional_score": int(emotional_score),
      "system_score": int(system_score),
      "summary": summary,
      "warnings": warnings,
      "recommended_risk": float(rec_risk),
      "recommendation_reason": rec_reason,
      "trading_identity": identity,
      "identity_insight": insight,
  }
