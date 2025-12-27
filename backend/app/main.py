from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import SimulationRequest, SimulationResponse, GoalPlannerRequest, GoalPlannerResponse
from .engine import calculate_compounding, calculate_goal_plan

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

@app.post("/api/plan", response_model=GoalPlannerResponse)
async def run_goal_planner(request: GoalPlannerRequest):
  try:
    result = calculate_goal_plan(request)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result
  except Exception as e:
      raise HTTPException(status_code=500, detail=str(e))