from pydantic import BaseModel, Field, field_validator
from decimal import Decimal

class SimulationRequest(BaseModel):
  initial_balance: Decimal = Field(..., gt=0, description="The starting balance for the simulation.")
  capital_utilization: Decimal = Field(..., gt=0, le=100, description="% Balance to be used in each trade (0-100).")
  risk_per_trade: Decimal = Field(..., gt=0, le=100, description="The percentage risk of each trade (0-100).")
  risk_reward_ratio: Decimal = Field(..., gt=0, description="The risk to reward ratio for each trade.")
  win_rate: Decimal = Field(..., ge=0, le=100, description="The expected win rate percentage (0-100).")
  trades_per_day: int = Field(..., gt=0, description="The number of trades to simulate per day.")
  simulation_days: int = Field(..., gt=0, le=3650, description="The number of days over which to run the simulation (max 10 years).")
  
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

class SimulationResponse(BaseModel):
  status: str
  summary: dict
  daily_breakdown: list[DailyResult]  