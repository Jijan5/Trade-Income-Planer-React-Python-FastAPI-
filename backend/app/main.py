from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import SimulationRequest, SimulationResponse, GoalPlannerRequest, GoalPlannerResponse, ChatRequest, ChatResponse
from .engine import calculate_compounding, calculate_goal_plan, get_market_price
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Trading Simulation API", version="1.0.0")

#setup CORS
app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000", "http://localhost:4000", "http://localhost:5173"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

@app.get("/")
def read_root():
  return{"message": "Welcome to the Trading Simulation API"}

@app.post("/api/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
  try:
    #call math engine
    result = calculate_compounding(request)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
  
@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    # 1. Cek apakah ada API KEY Google Gemini
    # Cara set di terminal: set GEMINI_API_KEY=AIzaSy... (Windows) atau export GEMINI_API_KEY=... (Mac/Linux)
    # Atau untuk testing cepat, Anda bisa hardcode sementara di bawah (TIDAK DISARANKAN UNTUK PRODUCTION):
    # api_key = "PASTE_KEY_ANDA_DISINI" 
    api_key = os.getenv("GEMINI_API_KEY")

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
    return {"response": response}

@app.get("/api/price/{symbol}")
async def get_price(symbol: str):
    result = get_market_price(symbol)
    return result

@app.post("/api/plan", response_model=GoalPlannerResponse)
async def run_goal_planner(request: GoalPlannerRequest):
  try:
    result = calculate_goal_plan(request)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result
  except Exception as e:
      raise HTTPException(status_code=500, detail=str(e))