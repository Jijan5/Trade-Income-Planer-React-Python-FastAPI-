from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
from typing import Literal
class SimulationRequest(BaseModel):
  initial_balance: Decimal = Field(..., gt=0, description="The starting balance for the simulation.")
  capital_utilization: Decimal = Field(..., gt=0, le=100, description="% Balance to be used in each trade (0-100).")
  risk_per_trade: Decimal = Field(..., gt=0, le=100, description="The percentage risk of each trade (0-100).")
  risk_reward_ratio: Decimal = Field(..., gt=0, description="The risk to reward ratio for each trade.")
  win_rate: Decimal = Field(..., ge=0, le=100, description="The expected win rate percentage (0-100).")
  trades_per_day: int = Field(..., gt=0, description="The number of trades to simulate per day.")
  simulation_days: int = Field(..., gt=0, le=3650, description="The number of days over which to run the simulation (max 10 years).")
  fees_per_trade: Decimal = Field(default=0, ge=0, description="Commission or fees per trade in currency.")
  risk_type: Literal["dynamic", "fixed"] = Field(default="dynamic", description="Risk calculation method: 'dynamic' (compounding) or 'fixed' (based on initial capital).")
  
  #validators
  @field_validator('initial_balance')
  def validate_decimals(cls, v):
    return v.quantize(Decimal("0.01"))
  
class DailyResult(BaseModel):
  day: int
  start_balance: str
  profit_loss: str
  end_balance: str
  roi: str

class TradeResult(BaseModel):
  trade_no: int
  day: int
  result: str # "WIN" or "LOSS"
  pnl: str
  balance: str

class SimulationResponse(BaseModel):
  status: str
  summary: dict
  daily_breakdown: list[DailyResult]
  monte_carlo: dict | None = None
  trade_log: list[TradeResult] = []

class GoalPlannerRequest(BaseModel):
    initial_balance: Decimal = Field(..., gt=0)
    target_balance: Decimal = Field(..., gt=0)
    deadline_months: int = Field(..., gt=0, le=120) # Max 10 years

class GoalPlannerResponse(BaseModel):
    status: str
    required_monthly_return: str
    feasibility: str
    message: str

class ChatRequest(BaseModel):
  message: str

class ChatResponse(BaseModel):
  response: str
