import os
import time
import asyncio
import requests
import yfinance as yf
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlmodel import Session
from ..database import get_session
from ..models import ChatRequest, ChatResponse, FeedbackCreate, Feedback, ReportCreate, Report, User
from ..dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

# ── In-memory TTL cache ────────────────────────────────────────────────────
# Avoids hammering yfinance/CoinDesk on every request under high concurrency.
# Each entry: { "data": ..., "expires_at": float }
_cache: dict = {}
_cache_lock = asyncio.Lock()

MARKET_DATA_TTL = int(os.getenv("MARKET_CACHE_TTL", "30"))   # seconds
NEWS_TTL        = int(os.getenv("NEWS_CACHE_TTL",   "300"))  # 5 minutes

def _cache_get(key: str):
    entry = _cache.get(key)
    if entry and time.monotonic() < entry["expires_at"]:
        return entry["data"]
    return None

def _cache_set(key: str, data, ttl: int):
    _cache[key] = {"data": data, "expires_at": time.monotonic() + ttl}


# ── Market data helpers ────────────────────────────────────────────────────
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

DISPLAY_NAME_MAP = {
    "GC=F": "Gold (XAU/USD)", "SI=F": "Silver (XAG/USD)",
    "CL=F": "WTI Oil",        "BZ=F": "Brent Oil",
    "EURUSD=X": "EUR/USD",    "GBPUSD=X": "GBP/USD",
    "USDJPY=X": "USD/JPY",    "AUDUSD=X": "AUD/USD",
    "USDCAD=X": "USD/CAD",
    "BTC": "BTC/USDT",  "ETH": "ETH/USDT",  "BNB": "BNB/USDT",
    "SOL": "SOL/USDT",  "XRP": "XRP/USDT",  "DOGE": "DOGE/USDT",
    "ADA": "ADA/USDT",
}

def _to_yf_symbol(original: str) -> str:
    """Convert a user-facing symbol string to a yfinance-compatible ticker."""
    s = original.upper().replace("BINANCE:", "").replace("PEPE24478", "PEPE").replace("UNI7083", "UNI")
    if "=" in s:
        return s
    s = s.replace("USDT", "USD")
    if "XAU" in s or "GOLD" in s:  return "GC=F"
    if "XAG" in s or "SILVER" in s: return "SI=F"
    if "OIL" in s or "WTI" in s:   return "CL=F"
    forex = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"]
    if any(p in s for p in forex):
        return s if "=" in s else s + "=X"
    if s.endswith("USD") and "-" not in s and len(s) > 3:
        return f"{s[:-3]}-USD"
    if s in ["BTC","ETH","BNB","SOL","XRP","DOGE","ADA","PEPE","UNI"]:
        return f"{s}-USD"
    return s

def _fetch_symbol(original: str) -> Optional[MarketData]:
    """Fetch one symbol from yfinance. Returns None on any error."""
    try:
        yf_sym = _to_yf_symbol(original)
        ticker = yf.Ticker(yf_sym)
        info   = ticker.info
        hist   = ticker.history(period="2d")
        if hist.empty:
            return None
        price  = info.get("regularMarketPrice") or info.get("currentPrice") or float(hist["Close"].iloc[-1])
        high   = info.get("dayHigh")  or float(hist["High"].max())
        low    = info.get("dayLow")   or float(hist["Low"].min())
        volume = info.get("volume")   or float(hist["Volume"].sum())
        chg    = float(((hist["Close"].iloc[-1] - hist["Close"].iloc[-2]) / hist["Close"].iloc[-2]) * 100) if len(hist) > 1 else 0.0
        trend  = "📈 Bullish" if chg > 0.5 else "📉 Bearish" if chg < -0.5 else "➡️ Sideways"
        label  = DISPLAY_NAME_MAP.get(original.upper(), original.upper())
        return MarketData(symbol=label, price=price, change_24h=chg,
                          high_24h=high, low_24h=low, volume_24h=volume, trend=trend)
    except Exception as e:
        print(f"[market] Error fetching {original}: {e}")
        return None


# ── Endpoints ──────────────────────────────────────────────────────────────
@router.get("/")
def read_root():
    return {"message": "Welcome to the Trading Simulation"}


@router.get("/api/market-data", response_model=MarketDataResponse)
async def get_market_data(symbols: str = "BTC,ETH,BNB,SOL,XRP,EURUSD=X,GBPUSD=X,GC=F,CL=F"):
    """
    Fetch real-time market data.
    Results are cached for MARKET_CACHE_TTL seconds (default 30s) so that
    100 concurrent users all hitting this endpoint only trigger ONE yfinance call.
    """
    cache_key = f"market:{symbols}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    async with _cache_lock:
        # Double-check inside lock (another coroutine may have filled it)
        cached = _cache_get(cache_key)
        if cached:
            return cached

        symbol_list  = [s.strip() for s in symbols.split(",")]
        # Run blocking yfinance calls in thread pool so we don't block the event loop
        loop         = asyncio.get_event_loop()
        tasks        = [loop.run_in_executor(None, _fetch_symbol, sym) for sym in symbol_list]
        results      = await asyncio.gather(*tasks, return_exceptions=True)
        market_data  = [r for r in results if isinstance(r, MarketData)]

        response = MarketDataResponse(data=market_data, timestamp=datetime.utcnow().isoformat() + "Z")
        _cache_set(cache_key, response, MARKET_DATA_TTL)
        return response


@router.get("/api/market-data/{symbol}")
async def get_single_market_data(symbol: str):
    """Fetch market data for a single symbol, also cached."""
    cache_key = f"market:single:{symbol.upper()}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _fetch_symbol, symbol)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No data for symbol '{symbol}'")

    out = {
        "symbol": symbol.upper(), "price": result.price,
        "change_24h": result.change_24h, "high_24h": result.high_24h,
        "low_24h": result.low_24h, "volume_24h": result.volume_24h,
        "trend": "bullish" if result.change_24h > 2 else "bearish" if result.change_24h < -2 else "sideways",
        "trend_emoji": "📈" if result.change_24h > 2 else "📉" if result.change_24h < -2 else "➡️",
    }
    _cache_set(cache_key, out, MARKET_DATA_TTL)
    return out


@router.get("/api/news")
async def get_crypto_news():
    """
    Fetch crypto news from CoinTelegraph RSS.
    Cached for NEWS_CACHE_TTL seconds (default 5 min) to avoid slamming
    the external feed under high user load.
    """
    cache_key = "news:cointelegraph"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    def _fetch_news():
        import xml.etree.ElementTree as ET
        import re
        url     = "https://cointelegraph.com/rss"
        headers = {"User-Agent": "Mozilla/5.0"}
        resp    = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        
        root = ET.fromstring(resp.text)
        mapped_articles = []
        
        for item in root.findall('./channel/item')[:10]:
            try:
                title = item.find('title').text if item.find('title') is not None else "No title"
                link = item.find('link').text if item.find('link') is not None else "#"
                pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
                
                # Try to extract image from enclosure
                image_url = "https://via.placeholder.com/400x250/1e293b/94a3b8?text=Crypto+News"
                enclosure = item.find('enclosure')
                if enclosure is not None and enclosure.get('url'):
                    image_url = enclosure.get('url')
                
                # Extract clean description
                desc = item.find('description').text if item.find('description') is not None else ""
                clean_desc = re.sub('<[^<]+?>', '', desc) # Remove HTML tags
                body = (clean_desc[:300] + "...") if clean_desc else "Read full article..."

                mapped_articles.append({
                    "id":           link.split('/')[-1] if link else str(time.time()),
                    "title":        title,
                    "body":         body,
                    "imageurl":     image_url,
                    "published_on": pub_date,
                    "url":          link,
                    "source_info":  {"name": "CoinTelegraph"},
                })
            except Exception as e:
                print(f"[news] Error mapping article: {e}")
                
        return {"Data": mapped_articles}

    try:
        loop     = asyncio.get_event_loop()
        result   = await loop.run_in_executor(None, _fetch_news)
        _cache_set(cache_key, result, NEWS_TTL)
        return result
    except Exception as e:
        print(f"[news] Fetch error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch news")


@router.post("/api/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"response": "AI service unavailable."}

    market_keywords   = ["trend","market","price","bull","bear","going up","going down","analysis",
                         "crypto","bitcoin","ethereum","btc","eth","bnb","sol","xrp","forex",
                         "oil","gold","silver","eurusd","gbpusd","usdjpy","audusd","usdcad"]
    needs_market_data = any(kw in request.message.lower() for kw in market_keywords)

    frontend_market_data = (request.user_context or {}).get("market_data")
    market_context       = ""

    if frontend_market_data:
        market_context = f"\n\nCurrent Market Data (from Live Panel):\n{frontend_market_data}"
    elif needs_market_data:
        # Re-use the cached market data — no extra yfinance call
        cached = _cache_get("market:BTC,ETH,BNB,SOL,XRP,EURUSD=X,GBPUSD=X,GC=F,CL=F")
        if cached and hasattr(cached, "data"):
            lines = [f"{d.symbol}: ${d.price:,.4f} ({d.change_24h:+.2f}%) {d.trend}" for d in cached.data]
            market_context = "\n\nLive Market Data:\n" + "\n".join(lines)

    trades_context = ""
    if request.trades_summary:
        ts = request.trades_summary
        trades_context = (
            f"\n\nUser's Trade Summary (last 20 trades):\n"
            f"- Total Trades: {ts.get('total_trades')}\n"
            f"- Win Rate: {ts.get('win_rate')}\n"
            f"- Total PnL: ${ts.get('total_pnl')}\n"
            f"- Avg Win: ${ts.get('avg_win')} | Avg Loss: ${ts.get('avg_loss')}"
        )

    user_info = ""
    if request.user_context:
        user_info = f"\n\nUser: {request.user_context.get('username','Trader')} (Plan: {request.user_context.get('plan','free')})"

    try:
        import base64 as b64lib
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        if request.image_base64:
            prompt = (
                "You are Tip, a professional AI Trading Mentor. The user uploaded a trading chart.\n"
                "Analyze: 1) trend 2) support/resistance 3) chart patterns 4) candlestick patterns "
                "5) price prediction 6) trade setup (entry/SL/TP) 7) sentiment.\n"
                "Reply in user's language. Be concise and data-driven.\n"
                f"{user_info}{trades_context}\nUser Question: {request.message}"
            )
            image_part = {"mime_type": "image/jpeg", "data": b64lib.b64decode(request.image_base64)}
            loop     = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: model.generate_content([prompt, image_part]))
        else:
            prompt = (
                "You are Tip, a professional AI Trading Mentor for 'Trade Income Planner'.\n"
                "Answer questions about trading, finance, risk, crypto, and market data.\n"
                "Reply in user's language. Keep responses concise and educational.\n"
                f"{user_info}{market_context}{trades_context}\nUser Question: {request.message}"
            )
            loop     = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))

        return {"response": response.text}
    except Exception as e:
        print(f"[chat] Gemini error: {e}")
        return {"response": "AI service temporarily unavailable."}


class TradingCoachRequest(BaseModel):
    message: str
    trades:           Optional[list] = None
    current_symbol:   Optional[str]  = None
    current_position: Optional[dict] = None
    account_balance:  Optional[float]= None

class TradingCoachResponse(BaseModel):
    response: str
    insights: Optional[list[str]] = None

@router.post("/api/trading-coach", response_model=TradingCoachResponse)
async def trading_coach(request: TradingCoachRequest):
    api_key = os.getenv("GEMINI_TRADING_COACH_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Trading Coach unavailable.")

    context_parts = []
    if request.trades:
        trades_summary = "; ".join([
            f"PnL ${t.get('pnl',0)} ({'Win' if t.get('is_win') else 'Loss'})"
            for t in request.trades[-10:]
        ])
        context_parts.append(f"Recent trades: {trades_summary}")
    if request.current_position:
        context_parts.append(f"Open {request.current_position.get('type','')} @ ${request.current_position.get('entry',0)}")
    if request.account_balance:
        context_parts.append(f"Balance: ${request.account_balance}")

    context = " | ".join(context_parts) or "No context"
    prompt  = (
        f"AI Trading Coach.\nUSER CONTEXT: {context}\nUSER ASK: {request.message}\n"
        "Give: 1) Direct answer 2) Risk reminder 3) Setup if relevant 4) Psychology. Concise."
    )

    try:
        genai.configure(api_key=api_key)
        model    = genai.GenerativeModel("gemini-2.5-flash")
        loop     = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
        text     = response.text.strip()
        insights = [l.strip() for l in text.split("\n") if l.strip() and len(l.strip()) < 100][:3]
        return TradingCoachResponse(response=text, insights=insights)
    except Exception as e:
        print(f"[coach] Error: {e}")
        raise HTTPException(status_code=500, detail="Coach busy. Try again.")


@router.post("/api/feedback")
async def submit_feedback(feedback: FeedbackCreate, user: User = Depends(get_current_user),
                          session: Session = Depends(get_session)):
    db_feedback = Feedback(email=feedback.email, message=feedback.message, tenant_id=user.tenant_id)
    session.add(db_feedback)
    session.commit()
    return {"status": "success", "message": "Feedback received"}


@router.post("/api/reports")
async def create_report(report: ReportCreate, user: User = Depends(get_current_user),
                        session: Session = Depends(get_session)):
    db_report = Report(
        reporter_username=user.username,
        post_id=report.post_id,
        comment_id=report.comment_id,
        reason=report.reason,
        tenant_id=user.tenant_id,
    )
    session.add(db_report)
    session.commit()
    return {"status": "success"}