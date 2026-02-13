import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import SimulationRequest, SimulationResponse, GoalPlannerRequest, GoalPlannerResponse, HealthAnalysisRequest, HealthAnalysisResponse, ManualTrade, ManualTradeCreate, User
from ..engine import calculate_compounding, calculate_goal_plan, get_market_price, analyze_trade_health
from ..dependencies import get_current_user, get_current_active_user

router = APIRouter()

@router.post("/api/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
  try:
    result = calculate_compounding(request)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/plan", response_model=GoalPlannerResponse)
async def run_goal_planner(request: GoalPlannerRequest):
  try:
    result = calculate_goal_plan(request)
    if isinstance(result, dict) and result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result
  except Exception as e:
      raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/analyze/health", response_model=HealthAnalysisResponse)
async def analyze_health(request: HealthAnalysisRequest):
    try:
        result = analyze_trade_health(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/manual-trades", response_model=list[ManualTrade])
async def get_manual_trades(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(
        select(ManualTrade)
        .where(ManualTrade.tenant_id == user.tenant_id, ManualTrade.user_id == user.id)
        .order_by(ManualTrade.trade_date.desc())
    ).all()

@router.post("/api/manual-trades", response_model=ManualTrade)
async def create_manual_trade(trade: ManualTradeCreate, user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    db_trade = ManualTrade(
        tenant_id=user.tenant_id,
        user_id=user.id,
        symbol=trade.symbol,
        entry_price=trade.entry_price,
        exit_price=trade.exit_price,
        pnl=trade.pnl,
        is_win=trade.is_win,
        notes=trade.notes
    )
    session.add(db_trade)
    session.commit()
    session.refresh(db_trade)
    return db_trade

@router.get("/api/price/{symbol}")
def get_price(symbol: str):
    result = get_market_price(symbol)
    return result

@router.get("/api/klines/{symbol}")
def get_klines(symbol: str, interval: str = "1d"):
    try:
        url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit=150"
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch data from Binance")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
