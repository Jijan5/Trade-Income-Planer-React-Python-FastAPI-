import os
import requests
import yfinance as yf
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
async def get_market_data(symbols: str = "BTC,ETH,BNB,SOL,XRP,EURUSD=X,GBPUSD=X,GC=F,CL=F"):
    """Fetch real-time market data from yfinance for all asset classes"""
    symbol_list = [s.strip() for s in symbols.split(",")]
    market_data = []

    # Human-readable display labels
    display_name_map = {
        "GC=F": "Gold (XAU/USD)",
        "SI=F": "Silver (XAG/USD)",
        "CL=F": "WTI Oil",
        "BZ=F": "Brent Oil",
        "EURUSD=X": "EUR/USD",
        "GBPUSD=X": "GBP/USD",
        "USDJPY=X": "USD/JPY",
        "AUDUSD=X": "AUD/USD",
        "USDCAD=X": "USD/CAD",
        "BTC": "BTC/USDT",
        "ETH": "ETH/USDT",
        "BNB": "BNB/USDT",
        "SOL": "SOL/USDT",
        "XRP": "XRP/USDT",
        "DOGE": "DOGE/USDT",
        "ADA": "ADA/USDT",
    }
    
    try:
        for symbol in symbol_list:
            try:
                original = symbol.upper()
                # If it's already a native yfinance symbol (has = sign), pass it through directly
                if "=" in original:
                    yf_symbol = original
                else:
                    yf_symbol = original.replace("BINANCE:", "").replace("PEPE24478", "PEPE").replace("UNI7083", "UNI")
                    yf_symbol = yf_symbol.replace("USDT", "USD")
                    
                    if 'XAU' in yf_symbol or 'GOLD' in yf_symbol:
                        yf_symbol = 'GC=F'
                    elif 'XAG' in yf_symbol or 'SILVER' in yf_symbol:
                        yf_symbol = 'SI=F'
                    elif 'OIL' in yf_symbol or 'WTI' in yf_symbol:
                        yf_symbol = 'CL=F'
                    elif yf_symbol.endswith("USD") and "-" not in yf_symbol and len(yf_symbol) > 3:
                        if not any(pair in yf_symbol for pair in ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']):
                            yf_symbol = f"{yf_symbol[:-3]}-USD"
                    elif yf_symbol in ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "ADA", "PEPE", "UNI"]:
                        yf_symbol = f"{yf_symbol}-USD"
                        
                    if "=" not in yf_symbol and "-" not in yf_symbol:
                        if any(pair in yf_symbol for pair in ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']):
                            yf_symbol += '=X'

                display_label = display_name_map.get(original, original)

                ticker = yf.Ticker(yf_symbol)
                info = ticker.info
                hist = ticker.history(period="2d")  # 2d for change calculation
                
                if hist.empty:
                    continue
                    
                price = info.get('regularMarketPrice') or info.get('currentPrice') or hist['Close'].iloc[-1]
                high = info.get('dayHigh') or hist['High'].max()
                low = info.get('dayLow') or hist['Low'].min()
                volume = info.get('volume') or hist['Volume'].sum()
                
                if len(hist) > 1:
                    change_pct = ((hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100
                else:
                    change_pct = 0
                
                trend = "📈 Bullish" if change_pct > 0.5 else "📉 Bearish" if change_pct < -0.5 else "➡️ Sideways"
                
                market_data.append(MarketData(
                    symbol=display_label,
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
        yf_symbol = symbol.upper().replace("BINANCE:", "").replace("PEPE24478", "PEPE").replace("UNI7083", "UNI")
        yf_symbol = yf_symbol.replace("USDT", "USD")
        
        if 'XAU' in yf_symbol or 'GOLD' in yf_symbol:
            yf_symbol = 'GC=F'
        elif 'XAG' in yf_symbol or 'SILVER' in yf_symbol:
            yf_symbol = 'SI=F'
        elif 'OIL' in yf_symbol:
            yf_symbol = 'CL=F'
        elif yf_symbol.endswith("USD") and "-" not in yf_symbol and len(yf_symbol) > 3:
            if not any(pair in yf_symbol for pair in ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']):
                yf_symbol = f"{yf_symbol[:-3]}-USD"
        elif yf_symbol in ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "ADA", "PEPE", "UNI"]:
            yf_symbol = f"{yf_symbol}-USD"
            
        if not '=' in yf_symbol and "-" not in yf_symbol:
            if any(pair in yf_symbol for pair in ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']):
                yf_symbol += '=X'

        ticker = yf.Ticker(yf_symbol)
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
    market_keywords = ['trend', 'market', 'price', 'bull', 'bear', 'going up', 'going down', 'analysis', 'crypto', 'bitcoin', 'ethereum', 'btc', 'eth', 'bnb', 'sol', 'xrp', 'forex', 'oil', 'gold', 'silver', 'eurusd', 'gbpusd', 'usdjpy', 'audusd', 'usdcad']
    needs_market_data = any(keyword in request.message.lower() for keyword in market_keywords)
    
    # Use market data from frontend panel if provided
    frontend_market_data = None
    if request.user_context and request.user_context.get("market_data"):
        frontend_market_data = request.user_context["market_data"]

    # Fetch live market data from Binance if needed and not already provided
    market_context = ""
    if frontend_market_data:
        market_context = f"\n\nCurrent Market Data (from Live Panel):\n{frontend_market_data}"
    elif needs_market_data:
        msg_lower = request.message.lower()
        market_info = []

        # --- Detect Forex intent ---
        forex_keywords = ['forex', 'eurusd', 'gbpusd', 'usdjpy', 'audusd', 'usdcad', 'currency', 'eur', 'gbp', 'jpy', 'aud', 'cad']
        needs_forex = any(k in msg_lower for k in forex_keywords)

        # --- Detect Commodities / Oil intent ---
        commodity_keywords = ['oil', 'gold', 'silver', 'xau', 'xag', 'commodity', 'commodities', 'crude', 'wti', 'brent']
        needs_commodity = any(k in msg_lower for k in commodity_keywords)

        # --- Detect Crypto intent (default if nothing specific) ---
        crypto_keywords = ['crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'bnb', 'sol', 'xrp', 'doge', 'coin']
        needs_crypto = any(k in msg_lower for k in crypto_keywords) or (not needs_forex and not needs_commodity)

        try:
            # Fetch crypto from Binance
            if needs_crypto:
                crypto_symbols = ["BTC", "ETH", "BNB", "SOL", "XRP"]
                for symbol in crypto_symbols:
                    try:
                        url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={symbol}USDT"
                        resp = requests.get(url, timeout=3)
                        if resp.status_code == 200:
                            data = resp.json()
                            change = float(data.get('priceChangePercent', 0))
                            trend = "📈 Bullish" if change > 2 else "📉 Bearish" if change < -2 else "➡️ Sideways"
                            market_info.append(f"{symbol}/USDT: ${float(data.get('lastPrice', 0)):,.4f} ({change:+.2f}%) {trend}")
                    except:
                        continue

            # Fetch Forex pairs from yfinance
            if needs_forex:
                forex_pairs = {
                    "EURUSD": "EURUSD=X",
                    "GBPUSD": "GBPUSD=X",
                    "USDJPY": "USDJPY=X",
                    "AUDUSD": "AUDUSD=X",
                    "USDCAD": "USDCAD=X",
                }
                for label, yf_sym in forex_pairs.items():
                    try:
                        ticker = yf.Ticker(yf_sym)
                        hist = ticker.history(period="2d")
                        if not hist.empty:
                            price = hist['Close'].iloc[-1]
                            change = ((hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100 if len(hist) > 1 else 0
                            trend = "📈 Bullish" if change > 0.5 else "📉 Bearish" if change < -0.5 else "➡️ Sideways"
                            market_info.append(f"{label}: {price:.5f} ({change:+.3f}%) {trend}")
                    except:
                        continue

            # Fetch Commodities from yfinance
            if needs_commodity:
                commodities = {
                    "Gold (XAU)": "GC=F",
                    "Silver (XAG)": "SI=F",
                    "WTI Oil": "CL=F",
                }
                for label, yf_sym in commodities.items():
                    try:
                        ticker = yf.Ticker(yf_sym)
                        hist = ticker.history(period="2d")
                        if not hist.empty:
                            price = hist['Close'].iloc[-1]
                            change = ((hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100 if len(hist) > 1 else 0
                            trend = "📈 Bullish" if change > 0.5 else "📉 Bearish" if change < -0.5 else "➡️ Sideways"
                            market_info.append(f"{label}: ${price:,.2f} ({change:+.2f}%) {trend}")
                    except:
                        continue

            if market_info:
                market_context = "\n\nLive Market Data:\n" + "\n".join(market_info)

        except Exception as e:
            print(f"Market data fetch error: {e}")

    # Build trades context
    trades_context = ""
    if request.trades_summary:
        ts = request.trades_summary
        trades_context = f"\n\nUser's Trade Summary (last 20 trades):\n- Total Trades: {ts.get('total_trades')}\n- Win Rate: {ts.get('win_rate')}\n- Total PnL: ${ts.get('total_pnl')}\n- Avg Win: ${ts.get('avg_win')} | Avg Loss: ${ts.get('avg_loss')}"

    # Build user context
    user_info = ""
    if request.user_context:
        username = request.user_context.get("username", "Trader")
        plan = request.user_context.get("plan", "free")
        user_info = f"\n\nUser: {username} (Plan: {plan})"

    if api_key:
        try:
            import base64 as b64lib
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            base_prompt = f"""You are Tip, a professional AI Trading Mentor for the 'Trade Income Planner' app.
Answer the user's question about trading, finance, risk management, psychology, cryptocurrency, market data, and more.
If market data is provided below, use it to give specific, data-backed analysis. Reference actual prices and trends in your response.
If the user speaks Indonesian, reply in Indonesian. If English, reply in English.
Keep responses concise, helpful, friendly, and educational. Avoid using excessive markdown symbols like ** or ##.
{user_info}
{market_context}
{trades_context}

User Question: {request.message}"""

            if request.image_base64:
                # Gemini Vision: analyze chart image
                chart_prompt = f"""You are Tip, a professional AI Trading Mentor. The user has uploaded a trading chart image.

Analyze the chart carefully and answer the user's question. In your analysis cover:
1. Overall trend direction (uptrend / downtrend / sideways)
2. Key support and resistance levels visible
3. Any chart patterns (head & shoulders, double top/bottom, triangle, flag, etc.)
4. Candlestick patterns if visible
5. Probability assessment: where is the price likely to go next?
6. Suggested trade setup: entry zone, stop loss, take profit
7. Overall sentiment: Bullish / Bearish / Neutral and confidence level

If the user speaks Indonesian, reply in Indonesian. If English, reply in English.
Keep it educational, specific, and data-driven. Avoid using excessive markdown symbols like ** or ##.
{user_info}
{trades_context}

User Question: {request.message}"""

                image_bytes = b64lib.b64decode(request.image_base64)
                image_part = {"mime_type": "image/jpeg", "data": image_bytes}
                response = model.generate_content([chart_prompt, image_part])
            else:
                response = model.generate_content(base_prompt)

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