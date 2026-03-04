import os
import requests
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ..database import get_session
from ..models import ChatRequest, ChatResponse, FeedbackCreate, Feedback, ReportCreate, Report, User
from ..dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

# Market data response model
class MarketData(BaseModel):
    symbol: str
    price: float
    change_24h: float
    high_24h: float
    low_24h: float
    volume_24h: float
    trend: str

class MarketDataResponse(BaseModel):
    data: List[MarketData]
    timestamp: str

@router.get("/")
def read_root():
  return{"message": "Welcome to the Trading Simulation"}

# Get market data for multiple symbols
@router.get("/api/market-data", response_model=MarketDataResponse)
async def get_market_data(symbols: str = "BTC,ETH,BNB,SOL,XRP"):
    """Fetch real-time market data from Binance"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    market_data = []
    
    try:
        for symbol in symbol_list:
            try:
                # Get 24hr ticker
                url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={symbol}USDT"
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    change = float(data.get('priceChangePercent', 0))
                    trend = "📈 Bullish" if change > 2 else "📉 Bearish" if change < -2 else "➡️ Sideways"
                    
                    market_data.append(MarketData(
                        symbol=symbol,
                        price=float(data.get('lastPrice', 0)),
                        change_24h=change,
                        high_24h=float(data.get('highPrice', 0)),
                        low_24h=float(data.get('lowPrice', 0)),
                        volume_24h=float(data.get('volume', 0)),
                        trend=trend
                    ))
            except Exception as e:
                print(f"Error fetching {symbol}: {e}")
                continue
                
        return {"data": market_data, "timestamp": "live"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get single symbol market data
@router.get("/api/market-data/{symbol}")
async def get_single_market_data(symbol: str):
    """Fetch market data for a single symbol"""
    try:
        url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={symbol.upper()}USDT"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            change = float(data.get('priceChangePercent', 0))
            trend = "bullish" if change > 2 else "bearish" if change < -2 else "sideways"
            
            return {
                "symbol": symbol.upper(),
                "price": float(data.get('lastPrice', 0)),
                "change_24h": change,
                "high_24h": float(data.get('highPrice', 0)),
                "low_24h": float(data.get('lowPrice', 0)),
                "volume_24h": float(data.get('volume', 0)),
                "trend": trend,
                "trend_emoji": "📈" if change > 2 else "📉" if change < -2 else "➡️"
            }
        else:
            raise HTTPException(status_code=404, detail="Symbol not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    response_text = "AI service unavailable."
    
    # Check if user is asking about market trends
    market_keywords = ['trend', 'market', 'price', 'bull', 'bear', 'going up', 'going down', 'analysis', 'crypto', 'bitcoin', 'ethereum']
    needs_market_data = any(keyword in request.message.lower() for keyword in market_keywords)
    
    # Fetch market data if needed
    market_context = ""
    if needs_market_data:
        try:
            symbols = ["BTC", "ETH", "BNB", "SOL", "XRP"]
            market_info = []
            for symbol in symbols:
                try:
                    url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={symbol}USDT"
                    response = requests.get(url, timeout=3)
                    if response.status_code == 200:
                        data = response.json()
                        change = float(data.get('priceChangePercent', 0))
                        trend = "📈" if change > 2 else "📉" if change < -2 else "➡️"
                        market_info.append(f"{symbol}: ${float(data.get('lastPrice', 0)):,.2f} ({change:+.2f}%) {trend}")
                except:
                    continue
            if market_info:
                market_context = f"\n\nCurrent Market Data (from Binance):\n" + "\n".join(market_info)
        except Exception as e:
            print(f"Market data fetch error: {e}")

    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"""
            You are Tip, a professional AI Trading Mentor for the 'Trade Income Planner' app.
            Answer the user's question about trading, finance, risk management, psychology, cryptocurrency, market data, and more.
            If the user asks about market trends or crypto prices, provide analysis based on the market data provided.
            If the user speaks Indonesian, reply in Indonesian. If English, reply in English.
            Keep it concise, helpful, friendly, and educational.
            
            {market_context}
            
            User Question: {request.message}
            """
            response = model.generate_content(prompt)
            return {"response": response.text}
        except Exception as e:
            print(f"Gemini API Error: {e}")
    return {"response": response_text}

@router.get("/api/news")
def get_crypto_news():
    try:
        url = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch news")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/feedback")
async def submit_feedback(feedback: FeedbackCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    db_feedback = Feedback(email=feedback.email, message=feedback.message, tenant_id=user.tenant_id)
    session.add(db_feedback)
    session.commit()
    return {"status": "success", "message": "Feedback received"}

@router.post("/api/reports")
async def create_report(report: ReportCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    db_report = Report(
        reporter_username=user.username,
        post_id=report.post_id,
        comment_id=report.comment_id,
        reason=report.reason,
        tenant_id=user.tenant_id
    )
    session.add(db_report)
    session.commit()
    return {"status": "success"}