from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from .models import SimulationRequest, SimulationResponse, GoalPlannerRequest, GoalPlannerResponse, ChatRequest, ChatResponse, User, UserCreate, Token, Community, CommunityCreate, Post, PostCreate, Comment, CommentCreate, Reaction, ReactionCreate
from .engine import calculate_compounding, calculate_goal_plan, get_market_price
from .database import create_db_and_tables, get_session
from .auth import get_password_hash, verify_password, create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
import os
import google.generativeai as genai
from dotenv import load_dotenv
import requests
import random
from datetime import timedelta

load_dotenv()

app = FastAPI(title="Trading Simulation API", version="1.0.0")

#setup CORS
app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000", "http://localhost:4000", "http://localhost:5173", "http://127.0.0.1:5173"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

# db startup
@app.on_event("startup")
def on_startup():
  create_db_and_tables()

@app.get("/")
def read_root():
  return{"message": "Welcome to the Trading Simulation API"}

# auth endpoint
@app.post("/api/register", response_model=Token)
async def register(user: UserCreate, session: Session = Depends(get_session)):
  # check user
  existing_user = session.exec(select(User).where(User.username == user.username)).first()
  if existing_user:
    raise HTTPException(status_code=400, detail="Username already registered")
  
  #create new user
  hashed_pwd = get_password_hash(user.password)
  db_user = User(username=user.username, email=user.email, hashed_password=hashed_pwd)
  session.add(db_user)
  session.commit()
  session.refresh(db_user)
  
  # auto login after register
  access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = create_access_token(data={"sub": db_user.username, "role": db_user.role}, expires_delta=access_token_expires)
  return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
  # search user db
  user = session.exec(select(User).where(User.username == form_data.username)).first()
  if not user or not verify_password(form_data.password, user.hashed_password):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"},)
  
  access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = create_access_token(data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires)
  return {"access_token": access_token, "token_type": "bearer"}

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

@app.get("/api/klines/{symbol}")
async def get_klines(symbol: str, interval: str = "1d"):
    try:
        # Proxy request ke Binance untuk menghindari masalah CORS di frontend
        # Mengambil data candle harian (1d) sebanyak 150 candle terakhir
        url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit=150"
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail="Gagal mengambil data dari Binance")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news")
async def get_crypto_news():
    try:
        # get news from cryptocompare
        url = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN"
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail="Gagal mengambil berita")
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
    
# --- COMMUNITY ENDPOINTS ---
@app.get("/api/communities", response_model=list[Community])
async def get_communities(session: Session = Depends(get_session)):
    return session.exec(select(Community)).all()

@app.post("/api/communities", response_model=Community)
async def create_community(community: CommunityCreate, session: Session = Depends(get_session)):
    # Buat komunitas baru
    db_community = Community(name=community.name, description=community.description)
    # simulation random members and active count
    db_community.members_count = random.randint(10, 500)
    db_community.active_count = random.randint(1, 50)
    
    session.add(db_community)
    session.commit()
    session.refresh(db_community)
    return db_community
  
@app.get("/api/communities/{community_id}/posts", response_model=list[Post])
async def get_community_posts(community_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Post).where(Post.community_id == community_id).order_by(Post.created_at.desc())).all()

@app.post("/api/communities/{community_id}/posts", response_model=Post)
async def create_community_post(community_id: int, post: PostCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    db_post = Post(
        community_id=community_id, 
        username=user.username, 
        content=post.content,
        image_url=post.image_url,
        link_url=post.link_url
    )
    session.add(db_post)
    session.commit()
    session.refresh(db_post)
    return db_post
  
# --- INTERACTION ENDPOINTS ---

@app.get("/api/posts/{post_id}/comments", response_model=list[Comment])
async def get_post_comments(post_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at.asc())).all()

@app.post("/api/posts/{post_id}/comments", response_model=Comment)
async def create_comment(post_id: int, comment: CommentCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # 1. Buat Komentar
    db_comment = Comment(post_id=post_id, username=user.username, content=comment.content)
    session.add(db_comment)
    
    # 2. Update Counter di Post
    post = session.get(Post, post_id)
    if post:
        post.comments_count += 1
        session.add(post)
        
    session.commit()
    session.refresh(db_comment)
    return db_comment

@app.post("/api/posts/{post_id}/react")
async def react_to_post(post_id: int, reaction: ReactionCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Cek apakah user sudah react sebelumnya
    existing_reaction = session.exec(select(Reaction).where(Reaction.post_id == post_id, Reaction.username == user.username)).first()
    
    if existing_reaction:
        existing_reaction.type = reaction.type # Update tipe reaksi
        session.add(existing_reaction)
    else:
        new_reaction = Reaction(post_id=post_id, username=user.username, type=reaction.type)
        session.add(new_reaction)
        # Update total likes count di Post (sebagai representasi total reaksi)
        post = session.get(Post, post_id)
        if post:
            post.likes += 1
            session.add(post)
            
    session.commit()
    return {"status": "success"}

@app.post("/api/posts/{post_id}/share")
async def share_post(post_id: int, session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if post:
        post.shares_count += 1
        session.add(post)
        session.commit()
    return {"status": "success"}
