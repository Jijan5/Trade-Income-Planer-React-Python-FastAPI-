import os
import requests
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ..database import get_session
from ..models import ChatRequest, ChatResponse, FeedbackCreate, Feedback, ReportCreate, Report, User
from ..dependencies import get_current_user

router = APIRouter()

@router.get("/")
def read_root():
  return{"message": "Welcome to the Trading Simulation"}

@router.post("/api/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    response_text = "AI service unavailable."

    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"""
            You are Tip, a professional AI Trading Mentor for the 'Trade Income Planer' app.
            Answer the user's question about trading, finance, risk management, or psychology.
            If the user speaks Indonesian, reply in Indonesian. If English, reply in English.
            Keep it concise, helpful, and friendly.
            
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
async def submit_feedback(feedback: FeedbackCreate, session: Session = Depends(get_session)):
    db_feedback = Feedback(email=feedback.email, message=feedback.message)
    session.add(db_feedback)
    session.commit()
    return {"status": "success", "message": "Feedback received"}

@router.post("/api/reports")
async def create_report(report: ReportCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    db_report = Report(
        reporter_username=user.username,
        post_id=report.post_id,
        comment_id=report.comment_id,
        reason=report.reason
    )
    session.add(db_report)
    session.commit()
    return {"status": "success"}
