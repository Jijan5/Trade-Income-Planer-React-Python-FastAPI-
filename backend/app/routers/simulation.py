import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime
from ..database import get_session
from ..models import SimulationRequest, SimulationResponse, GoalPlannerRequest, GoalPlannerResponse, HealthAnalysisRequest, HealthAnalysisResponse, ManualTrade, ManualTradeCreate, User, UserTradingPreferences, UserTradingPreferencesUpdate
from ..engine import calculate_compounding, calculate_goal_plan, get_market_price, analyze_trade_health
from ..dependencies import get_current_user, get_current_active_user

router = APIRouter()

@router.post("/api/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest, user: User = Depends(get_current_user)):
  try:
    result = calculate_compounding(request)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/plan", response_model=GoalPlannerResponse)
async def run_goal_planner(request: GoalPlannerRequest, user: User = Depends(get_current_user)):
  try:
    result = calculate_goal_plan(request)
    if isinstance(result, dict) and result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result
  except Exception as e:
      raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/analyze/health", response_model=HealthAnalysisResponse)
async def analyze_health(request: HealthAnalysisRequest, user: User = Depends(get_current_user)):
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

# User Trading Preferences Endpoints
@router.get("/api/trading-preferences")
async def get_trading_preferences(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Get user's trading preferences for beginner features"""
    prefs = session.exec(
        select(UserTradingPreferences)
        .where(UserTradingPreferences.tenant_id == user.tenant_id, UserTradingPreferences.user_id == user.id)
    ).first()
    
    if not prefs:
        # Create default preferences
        prefs = UserTradingPreferences(
            tenant_id=user.tenant_id,
            user_id=user.id
        )
        session.add(prefs)
        session.commit()
        session.refresh(prefs)
    
    return prefs

@router.put("/api/trading-preferences")
async def update_trading_preferences(
    updates: UserTradingPreferencesUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update user's trading preferences"""
    prefs = session.exec(
        select(UserTradingPreferences)
        .where(UserTradingPreferences.tenant_id == user.tenant_id, UserTradingPreferences.user_id == user.id)
    ).first()
    
    if not prefs:
        # Create new preferences if not exists
        prefs = UserTradingPreferences(
            tenant_id=user.tenant_id,
            user_id=user.id
        )
    
    # Apply updates
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(prefs, key, value)
    
    prefs.updated_at = datetime.utcnow()
    session.add(prefs)
    session.commit()
    session.refresh(prefs)
    
    return prefs

@router.post("/api/trading-preferences/complete-tutorial")
async def complete_tutorial(
    step: int = 0,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Mark tutorial as completed or update step"""
    prefs = session.exec(
        select(UserTradingPreferences)
        .where(UserTradingPreferences.tenant_id == user.tenant_id, UserTradingPreferences.user_id == user.id)
    ).first()
    
    if not prefs:
        prefs = UserTradingPreferences(
            tenant_id=user.tenant_id,
            user_id=user.id,
            tutorial_completed=True,
            tutorial_step=step
        )
    else:
        prefs.tutorial_completed = True
        prefs.tutorial_step = step
        prefs.updated_at = datetime.utcnow()
    
    session.add(prefs)
    session.commit()
    session.refresh(prefs)
    
    return {"status": "success", "tutorial_completed": prefs.tutorial_completed}

@router.post("/api/trading-preferences/save-checklist")
async def save_checklist(
    items: str,  # JSON string of checklist items
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Save user's checklist configuration"""
    prefs = session.exec(
        select(UserTradingPreferences)
        .where(UserTradingPreferences.tenant_id == user.tenant_id, UserTradingPreferences.user_id == user.id)
    ).first()
    
    if not prefs:
        prefs = UserTradingPreferences(
            tenant_id=user.tenant_id,
            user_id=user.id,
            checklist_items=items
        )
    else:
        prefs.checklist_items = items
        prefs.updated_at = datetime.utcnow()
    
    session.add(prefs)
    session.commit()
    session.refresh(prefs)
    
    return {"status": "success", "checklist_items": prefs.checklist_items}
