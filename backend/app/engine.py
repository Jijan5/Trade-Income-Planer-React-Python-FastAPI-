from decimal import Decimal, getcontext, ROUND_HALF_UP
from typing import List, Dict
import math
import random
from .models import SimulationRequest, DailyResult
from .models import SimulationRequest, DailyResult, GoalPlannerRequest

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
  
  # Convert to float for faster processing in loop (Monte Carlo doesn't need Decimal precision)
  win_rate_float = float(data.win_rate / 100)
  util_float = float(data.capital_utilization / 100)
  risk_float = float(data.risk_per_trade / 100)
  rr_float = float(data.risk_reward_ratio)
  fees_float = float(data.fees_per_trade)
  initial_bal_float = float(data.initial_balance)
  
  total_trades = data.trades_per_day * data.simulation_days

  for _ in range(iterations):
    balance = initial_bal_float
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
      
      if balance <= 0:
        balance = 0
        break
    final_balances.append(balance)
  
  final_balances.sort()
  
  return {
    "worst_case": f"{final_balances[int(iterations * 0.05)]:.2f}", # 5th percentile
    "median": f"{final_balances[int(iterations * 0.5)]:.2f}",      # 50th percentile
    "best_case": f"{final_balances[int(iterations * 0.95)]:.2f}",  # 95th percentile
    "iterations": iterations
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