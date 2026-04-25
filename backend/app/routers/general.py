import os
import requests
import google.generativeai as genai
# from google import genai
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ..database import get_session
from ..models import ChatRequest, ChatResponse, ChatEnhancedRequest, ChatEnhancedResponse, FeedbackCreate, Feedback, ReportCreate, Report, User
from ..dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

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
async def get_market_data(symbols: str = "BTC,ETH,BNB,SOL,XRP,EURUSD=X,CL=F,GC=F"):
    """Fetch real-time market data from yfinance"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    market_data = []
    
    try:
        for symbol in symbol_list:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                hist = ticker.history(period="2d")  # 2d for change calculation
                
                price = info.get('regularMarketPrice') or info.get('currentPrice') or hist['Close'].iloc[-1] if not hist.empty else 0
                high = info.get('dayHigh') or hist['High'].max() if not hist.empty else 0
                low = info.get('dayLow') or hist['Low'].min() if not hist.empty else 0
                volume = info.get('volume') or hist['Volume'].sum() if not hist.empty else 0
                
                if len(hist) > 1:
                    change_pct = ((hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100
                else:
                    change_pct = 0
                
                trend = "📈 Bullish" if change_pct > 2 else "📉 Bearish" if change_pct < -2 else "➡️ Sideways"
                
                market_data.append(MarketData(
                    symbol=symbol,
                    price=float(price),
                    change_24h=float(change_pct),
                    high_24h=float(high),
                    low_24h=float(low),
                    volume_24h=float(volume),
                    trend=trend
                ))
            except Exception as e:
                print(f"Error fetching {symbol}: {e}")
                continue
                
        return MarketDataResponse(data=market_data, timestamp="live")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get single symbol market data
@router.get("/api/market-data/{symbol}")
async def get_single_market_data(symbol: str):
    """Fetch market data for a single symbol"""
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info
        hist = ticker.history(period="2d")
        
        price = info.get('regularMarketPrice') or info.get('currentPrice') or hist['Close'].iloc[-1] if not hist.empty else 0
        high = info.get('dayHigh') or hist['High'].max() if not hist.empty else 0
        low = info.get('dayLow') or hist['Low'].min() if not hist.empty else 0
        volume = info.get('volume') or hist['Volume'].sum() if not hist.empty else 0
        
        change_pct = 0
        if len(hist) > 1:
            change_pct = ((hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100
        
        trend = "bullish" if change_pct > 2 else "bearish" if change_pct < -2 else "sideways"
        
        return {
            "symbol": symbol.upper(),
            "price": float(price),
            "change_24h": float(change_pct),
            "high_24h": float(high),
            "low_24h": float(low),
            "volume_24h": float(volume),
            "trend": trend,
            "trend_emoji": "📈" if change_pct > 2 else "📉" if change_pct < -2 else "➡️"
        }
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

class TradingCoachRequest(BaseModel):
    message: str
    trades: Optional[list] = None
    current_symbol: Optional[str] = None
    current_position: Optional[dict] = None
    account_balance: Optional[float] = None

class TradingCoachResponse(BaseModel):
    response: str
    insights: Optional[list[str]] = None

@router.post("/api/trading-coach", response_model=TradingCoachResponse)
async def trading_coach(request: TradingCoachRequest):
    api_key = os.getenv("GEMINI_TRADING_COACH_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Trading Coach unavailable.")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        context_parts = []
        if request.trades:
            trades_summary = "; ".join([
                f"PnL ${t.get('pnl',0)} ({'Win' if t.get('is_win') else 'Loss'}), Risk ${t.get('risk_amount', 'N/A')}"
                for t in request.trades[-10:]
            ])
            context_parts.append(f"Recent trades: {trades_summary}")
        if request.current_position:
            pos_type = request.current_position.get('type', '')
            entry = request.current_position.get('entry', 0)
            context_parts.append(f"Open {pos_type} @ ${entry}")
        if request.account_balance:
            context_parts.append(f"Balance: ${request.account_balance}")
        
        context = " | ".join(context_parts) if context_parts else "No context"
        
        prompt = f"""AI Trading Coach for Trade Income Planner app.

USER CONTEXT: {context}
USER ASK: {request.message}

Give:
1. Direct actionable answer
2. Risk reminder
3. Setup suggestion if relevant (entry/SL/TP)
4. Psychology if fits

Concise, professional."""

        response = model.generate_content(prompt)
        coach_response = response.text.strip()
        
        lines = coach_response.split('\n')
        insights = [l.strip() for l in lines if l.strip() and len(l.strip()) < 100][:3]
        
        return TradingCoachResponse(response=coach_response, insights=insights)
    except Exception as e:
        print(f"Trading Coach error: {e}")
        raise HTTPException(status_code=500, detail="Coach busy. Try again.")

@router.get("/api/news")
def get_crypto_news():
    try:
        url = "https://data-api.coindesk.com/news/v1/article/list?lang=EN&limit=10"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        api_data = response.json()
        print(f"CoinDesk raw response keys: {api_data.keys()}")
        articles = api_data.get('Data', [])
        print(f"Found {len(articles)} articles")
        
        # Map to frontend expected format (CryptoCompare fields)
        mapped_articles = []
        for article in articles[:10]:
            try:
                # Use PUBLISHED_ON unix timestamp directly
                published_on = article.get('PUBLISHED_ON', 0)
                source_name = article.get('SOURCE_DATA', {}).get('NAME', 'Crypto News')
                
                mapped = {
                    'id': str(article.get('ID', '')),
                    'title': article.get('TITLE', 'No title'),
                    'body': article.get('BODY', 'No description')[:300] + '...' if article.get('BODY') else 'Read full article for details.',
                    'imageurl': article.get('IMAGE_URL', 'https://via.placeholder.com/400x250/1e293b/94a3b8?text=Crypto+News'),
                    'published_on': published_on,
                    'url': article.get('URL', '#'),
                    'source_info': {
                        'name': source_name
                    }
                }
                mapped_articles.append(mapped)
                print(f"Mapped article: {mapped['title'][:50]}...")
            except Exception as e:
                print(f"Error mapping article {article.get('ID')}: {e}")
                continue
        
        print(f"Returning {len(mapped_articles)} mapped articles")
        return {'Data': mapped_articles}
    except Exception as e:
        print(f"News fetch error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch news from CoinDesk")

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