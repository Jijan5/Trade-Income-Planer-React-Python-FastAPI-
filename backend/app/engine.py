from decimal import Decimal, getcontext, ROUND_HALF_UP
from typing import List, Dict
from .models import SimulationRequest, DailyResult

# set precision global
getcontext().prec = 28

def calculate_compounding(data: SimulationRequest) -> Dict:
  current_balance = data.initial_balance
  result = []
  
  # convertion percent to decimal
  utilization_rate = data.capital_utilization / Decimal("100")
  risk_rate = data.risk_per_trade / Decimal("100")
  win_prob = data.win_rate / Decimal("100")
  loss_prob = Decimal("1") - win_prob
  
  # loop through days
  for day in range(1, data.simulation_days + 1):
    start_bal = current_balance
    daily_pl = Decimal("0")
    
    # loop trades per day
    # expected values
    # Win% * Reward$ - Loss% * Risk$
    for _ in range(data.trades_per_day):
      # active capital
      active_capital = current_balance * utilization_rate
      
      # calculate risk
      risk_amount = active_capital * risk_rate
      
      # calculate reward
      reward_amount = risk_amount * data.risk_reward_ratio
      
      # calculate expected value
      expected_value = (win_prob * reward_amount) - (loss_prob * risk_amount)
      
      daily_pl += expected_value
      current_balance += expected_value
      
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
  
  return {
    "status": "success",
    "summary": {
      "initial_balance": f"{data.initial_balance:.2f}",
      "final_balance": f"{current_balance:.2f}",
      "total_profit": f"{total_profit:.2f}",
      "total_roi": f"{total_roi:.2f}%",
      "day_simulated": len(result)
    },
    "daily_breakdown": result
  }