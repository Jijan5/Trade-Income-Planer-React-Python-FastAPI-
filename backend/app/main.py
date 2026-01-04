from fastapi import FastAPI, HTTPException, Depends, status, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from .models import SimulationRequest, SimulationResponse, GoalPlannerRequest, GoalPlannerResponse, ChatRequest, ChatResponse, User, UserCreate, Token, UserRead, AdminUserUpdate, Community, CommunityCreate, CommunityMember, CommunityMemberRead, Post, PostCreate, Comment, CommentCreate, Reaction, ReactionCreate, Feedback, FeedbackCreate, Notification, NotificationRead, HealthAnalysisRequest, HealthAnalysisResponse
from .engine import calculate_compounding, calculate_goal_plan, get_market_price, analyze_trade_health
from .database import create_db_and_tables, get_session
from .auth import get_password_hash, verify_password, create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
import os
import google.generativeai as genai
from dotenv import load_dotenv
import re
import requests
import random
import uuid
import shutil
from datetime import timedelta, datetime
from typing import Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

# --- Pydantic Response Models ---
class PostResponse(BaseModel):
    id: int
    community_id: Optional[int]
    username: str
    content: str
    image_url: Optional[str]
    link_url: Optional[str]
    created_at: datetime
    likes: int
    comments_count: int
    shares_count: int
    is_edited: bool
    user_role: str
    user_plan: str
    user_avatar_url: Optional[str]

class CommentResponse(Comment):
    user_role: str
    user_plan: str
    user_avatar_url: Optional[str]

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

# Sajikan folder 'static' agar bisa diakses dari browser
app.mount("/static", StaticFiles(directory="static"), name="static")

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

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user

# db startup
@app.on_event("startup")
def on_startup():
  create_db_and_tables()

async def process_mentions_and_create_notifications(
    session: Session,
    content: str,
    author_user: User,
    post_id: int,
    community_id: Optional[int],
    notified_user_ids: set,
    comment_id: Optional[int] = None
):
    mentioned_usernames = set(re.findall(r'@(\w+)', content))
    for username in mentioned_usernames:
        if username == author_user.username:
            continue
        
        mentioned_user = session.exec(select(User).where(User.username == username)).first()
        if mentioned_user and mentioned_user.id not in notified_user_ids:
            notif_type = "mention_comment" if comment_id else "mention_post"
            notification = Notification(
                user_id=mentioned_user.id, actor_username=author_user.username, type=notif_type,
                post_id=post_id, comment_id=comment_id, community_id=community_id
            )
            session.add(notification)
            notified_user_ids.add(mentioned_user.id)

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

@app.get("/api/users/me", response_model=UserRead)
async def read_user_profile(user: User = Depends(get_current_user)):
    return user

@app.put("/api/users/me", response_model=UserRead)
async def update_user_profile(
    username: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    avatar_file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    #update username
    if username and username != user.username:
        existing_user = session.exec(select(User).where(User.username == username)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = username

    #update email
    if email and email != user.email:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = email
        
    #update password
    if password:
        user.hashed_password = get_password_hash(password)
        
    #update avatar
    if avatar_file:
        os.makedirs("static/avatars", exist_ok=True)
        filename = f"avatar_{user.id}_{uuid.uuid4()}_{avatar_file.filename}"
        file_path = os.path.join("static/avatars", filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(avatar_file.file, buffer)
        user.avatar_url = f"/static/avatars/{filename}"
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

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

@app.post("/api/analyze/health", response_model=HealthAnalysisResponse)
async def analyze_health(request: HealthAnalysisRequest):
    try:
        result = analyze_trade_health(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- GLOBAL POSTS ENDPOINTS (HOME FEED) ---
@app.get("/api/posts", response_model=list[PostResponse])
async def get_all_posts(session: Session = Depends(get_session)):
    posts = session.exec(select(Post).order_by(Post.created_at.desc())).all()
    if not posts:
        return []
    
    usernames = {p.username for p in posts}
    users = session.exec(select(User).where(User.username.in_(usernames))).all()
    user_map = {u.username: u for u in users}

    results = []
    for post in posts:
        user = user_map.get(post.username)
        post_dict = post.dict()
        # Manually add fields for the response model
        post_dict['user_role'] = user.role if user else "user"
        post_dict['user_plan'] = user.plan if user else "Free"
        post_dict['user_avatar_url'] = user.avatar_url if user else None
        
        # This part is for compatibility if user_reaction is added later dynamically
        if 'user_reaction' not in post_dict:
            post_dict['user_reaction'] = None
        results.append(PostResponse(**post_dict))
    return results

@app.post("/api/posts", response_model=Post)
async def create_public_post(content: str = Form(...), link_url: Optional[str] = Form(None), image_file: Optional[UploadFile] = File(None), user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    try:
        image_url_to_save = None
        if image_file:
            os.makedirs("static/images", exist_ok=True)
            filename = f"{uuid.uuid4()}-{image_file.filename}"
            file_path = os.path.join("static/images", filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image_file.file, buffer)
            image_url_to_save = f"/static/images/{filename}"
            
        db_post = Post(
            community_id=None, # Global post
            username=user.username, 
            content=content,
            image_url=image_url_to_save,
            link_url=link_url
        )
        session.add(db_post)
        session.commit()
        session.refresh(db_post)

        # Handle mentions
        await process_mentions_and_create_notifications(
            session=session, content=content, author_user=user, post_id=db_post.id,
            community_id=None, notified_user_ids=set()
        )
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
        return db_post
    except Exception as e:
        session.rollback()
        if "1054" in str(e):
             raise HTTPException(status_code=500, detail="Database schema mismatch. Please drop tables and restart backend.")
        raise HTTPException(status_code=500, detail=str(e))

# --- COMMUNITY ENDPOINTS ---

@app.get("/api/users/search")
async def search_users(q: str = "", session: Session = Depends(get_session)):
    if not q:
        return []
    users = session.exec(select(User).where(User.username.ilike(f"{q}%")).limit(5)).all()
    return [{"username": user.username} for user in users]

@app.get("/api/communities", response_model=list[Community])
async def get_communities(session: Session = Depends(get_session)):
    return session.exec(select(Community)).all()

@app.get("/api/users/me/communities", response_model=list[Community])
async def get_my_communities(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(Community).where(Community.creator_username == user.username)).all()

@app.get("/api/communities/{community_id}/members", response_model=list[CommunityMemberRead])
async def get_community_members(community_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    if community.creator_username != user.username:
        raise HTTPException(status_code=403, detail="Only the creator can view the member list.")

    members = session.exec(
        select(CommunityMember, User)
        .join(User, CommunityMember.user_id == User.id)
        .where(CommunityMember.community_id == community_id)
    ).all()

    return [
        CommunityMemberRead(
            user_id=member.User.id, username=member.User.username, avatar_url=member.User.avatar_url, joined_at=member.CommunityMember.joined_at
        ) for member in members
    ]

@app.get("/api/users/me/joined_communities", response_model=list[int])
async def get_joined_communities(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    members = session.exec(select(CommunityMember).where(CommunityMember.user_id == user.id)).all()
    return [m.community_id for m in members]

@app.post("/api/communities/{community_id}/join")
async def join_community(community_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Check if already joined
    existing = session.exec(select(CommunityMember).where(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id)).first()
    if existing:
        return {"status": "already_joined"}
    
    member = CommunityMember(community_id=community_id, user_id=user.id)
    session.add(member)
    
    # Update count
    comm = session.get(Community, community_id)
    if comm:
        comm.members_count += 1
        session.add(comm)
    
    session.commit()
    return {"status": "success"}

@app.post("/api/communities/{community_id}/leave")
async def leave_community(community_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    comm = session.get(Community, community_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    if comm.creator_username == user.username:
        raise HTTPException(status_code=403, detail="Creators cannot leave their own community.")
    member = session.exec(select(CommunityMember).where(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id)).first()
    if not member:
        raise HTTPException(status_code=400, detail="Not a member")
    
    session.delete(member)
    if comm and comm.members_count > 0:
        comm.members_count -= 1
        session.add(comm)
        
    session.commit()
    return {"status": "success"}

@app.delete("/api/communities/{community_id}/members/{username_to_kick}")
async def kick_community_member(community_id: int, username_to_kick: str, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    if community.creator_username != user.username:
        raise HTTPException(status_code=403, detail="Only the creator can kick members.")

    if community.creator_username == username_to_kick:
        raise HTTPException(status_code=400, detail="Creator cannot be kicked.")

    user_to_kick = session.exec(select(User).where(User.username == username_to_kick)).first()
    if not user_to_kick:
        raise HTTPException(status_code=404, detail="User to kick not found.")

    member_record = session.exec(select(CommunityMember).where(CommunityMember.community_id == community_id, CommunityMember.user_id == user_to_kick.id)).first()
    if not member_record:
        raise HTTPException(status_code=404, detail="User is not a member of this community.")

    session.delete(member_record)
    if community.members_count > 0:
        community.members_count -= 1
        session.add(community)
    
    session.commit()
    return {"status": "success"}

@app.post("/api/communities", response_model=Community)
async def create_community(
    name: str = Form(...),
    description: str = Form(...),
    bg_type: str = Form("color"),
    bg_value: str = Form("#1f2937"),
    text_color: str = Form("#ffffff"),
    font_family: str = Form("sans"),
    hover_animation: str = Form("none"),
    hover_color: str = Form("#3b82f6"),
    avatar_file: Optional[UploadFile] = File(None),
    bg_image_file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Handle Avatar Upload
    avatar_url = None
    if avatar_file:
        os.makedirs("static/avatars", exist_ok=True)
        filename = f"comm_av_{uuid.uuid4()}_{avatar_file.filename}"
        file_path = os.path.join("static/avatars", filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(avatar_file.file, buffer)
        avatar_url = f"/static/avatars/{filename}"

    # Handle BG Image Upload
    final_bg_value = bg_value
    if bg_type == "image" and bg_image_file:
        os.makedirs("static/backgrounds", exist_ok=True)
        filename = f"comm_bg_{uuid.uuid4()}_{bg_image_file.filename}"
        file_path = os.path.join("static/backgrounds", filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(bg_image_file.file, buffer)
        final_bg_value = f"/static/backgrounds/{filename}"

    db_community = Community(
        name=name,
        description=description,
        creator_username=user.username,
        avatar_url=avatar_url,
        bg_type=bg_type,
        bg_value=final_bg_value,
        text_color=text_color,
        font_family=font_family,
        hover_animation=hover_animation,
        hover_color=hover_color,
        members_count=1,
        active_count=1
    )
    
    session.add(db_community)
    session.commit()
    session.refresh(db_community)
    return db_community

@app.put("/api/communities/{community_id}", response_model=Community)
async def update_community(
    community_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    bg_type: Optional[str] = Form(None),
    bg_value: Optional[str] = Form(None),
    text_color: Optional[str] = Form(None),
    font_family: Optional[str] = Form(None),
    hover_animation: Optional[str] = Form(None),
    hover_color: Optional[str] = Form(None),
    avatar_file: Optional[UploadFile] = File(None),
    bg_image_file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    if community.creator_username != user.username:
        raise HTTPException(status_code=403, detail="Not authorized")

    if name: community.name = name
    if description: community.description = description
    if bg_type: community.bg_type = bg_type
    if text_color: community.text_color = text_color
    if font_family: community.font_family = font_family
    if hover_animation: community.hover_animation = hover_animation
    if hover_color: community.hover_color = hover_color

    # Handle Avatar
    if avatar_file:
        os.makedirs("static/avatars", exist_ok=True)
        filename = f"comm_av_{uuid.uuid4()}_{avatar_file.filename}"
        file_path = os.path.join("static/avatars", filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(avatar_file.file, buffer)
        community.avatar_url = f"/static/avatars/{filename}"

    # Handle BG
    if bg_type == "image" and bg_image_file:
        os.makedirs("static/backgrounds", exist_ok=True)
        filename = f"comm_bg_{uuid.uuid4()}_{bg_image_file.filename}"
        file_path = os.path.join("static/backgrounds", filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(bg_image_file.file, buffer)
        community.bg_value = f"/static/backgrounds/{filename}"
    elif bg_value:
        community.bg_value = bg_value

    session.add(community)
    session.commit()
    session.refresh(community)
    return community
  
@app.get("/api/communities/{community_id}/posts", response_model=list[PostResponse])
async def get_community_posts(community_id: int, session: Session = Depends(get_session)):
    posts = session.exec(select(Post).where(Post.community_id == community_id).order_by(Post.created_at.desc())).all()
    if not posts:
        return []

    usernames = {p.username for p in posts}
    users = session.exec(select(User).where(User.username.in_(usernames))).all()
    user_map = {u.username: u for u in users}

    results = []
    for post in posts:
        user = user_map.get(post.username)
        post_dict = post.dict()
        post_dict['user_role'] = user.role if user else "user"
        post_dict['user_plan'] = user.plan if user else "Free"
        post_dict['user_avatar_url'] = user.avatar_url if user else None
        if 'user_reaction' not in post_dict:
            post_dict['user_reaction'] = None
        results.append(PostResponse(**post_dict))
    return results

@app.post("/api/communities/{community_id}/posts", response_model=Post)
async def create_community_post(community_id: int, content: str = Form(...), link_url: Optional[str] = Form(None), image_file: Optional[UploadFile] = File(None), user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    try:
        image_url_to_save = None
        if image_file:
            # Pastikan direktori static/images ada
            os.makedirs("static/images", exist_ok=True)
            # Buat nama file yang unik
            filename = f"{uuid.uuid4()}-{image_file.filename}"
            file_path = os.path.join("static/images", filename)
            
            # Simpan file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image_file.file, buffer)
            
            image_url_to_save = f"/static/images/{filename}"
            
        db_post = Post(
            community_id=community_id, 
            username=user.username, 
            content=content,
            image_url=image_url_to_save,
            link_url=link_url
        )
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
        return db_post
    except Exception as e:
        session.rollback()
        # Deteksi error kolom hilang (MySQL Error 1054)
        if "1054" in str(e):
            raise HTTPException(status_code=500, detail="Database schema mismatch: Missing columns in 'post' table. Please drop the table or migrate.")
        raise HTTPException(status_code=500, detail=str(e))
  
# --- INTERACTION ENDPOINTS ---

@app.get("/api/posts/{post_id}/comments", response_model=list[CommentResponse])
async def get_post_comments(post_id: int, session: Session = Depends(get_session)):
    comments = session.exec(select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at.asc())).all()
    if not comments:
        return []

    usernames = {c.username for c in comments}
    users = session.exec(select(User).where(User.username.in_(usernames))).all()
    user_map = {u.username: u for u in users}

    results = []
    for comment in comments:
        user = user_map.get(comment.username)
        comment_dict = comment.dict()
        comment_dict['user_role'] = user.role if user else "user"
        comment_dict['user_plan'] = user.plan if user else "Free"
        comment_dict['user_avatar_url'] = user.avatar_url if user else None
        results.append(CommentResponse(**comment_dict))
    return results

@app.post("/api/posts/{post_id}/comments", response_model=Comment)
async def create_comment(post_id: int, comment: CommentCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    try:
        post = session.get(Post, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # 1. make comment
        db_comment = Comment(post_id=post_id, username=user.username, content=comment.content, parent_id=comment.parent_id)
        session.add(db_comment)
        session.commit()
        session.refresh(db_comment)
        
        # 2. Update Counter at post
        if post:
            post.comments_count += 1
            session.add(post)
            
        # 3. Handle notifications
        notified_user_ids = set()
        await process_mentions_and_create_notifications(
            session=session, content=comment.content, author_user=user, post_id=post_id,
            community_id=post.community_id, notified_user_ids=notified_user_ids, comment_id=db_comment.id
        )

        # Handle replies
        if comment.parent_id:
            parent_comment = session.get(Comment, comment.parent_id)
            if parent_comment:
                parent_owner = session.exec(select(User).where(User.username == parent_comment.username)).first()
                if parent_owner and parent_owner.id != user.id and parent_owner.id not in notified_user_ids:
                    reply_notif = Notification(user_id=parent_owner.id, actor_username=user.username, type='reply_comment', post_id=post_id, comment_id=db_comment.id, community_id=post.community_id)
                    session.add(reply_notif)
                    notified_user_ids.add(parent_owner.id)
        else: # It's a reply to the post itself
            post_owner = session.exec(select(User).where(User.username == post.username)).first()
            if post_owner and post_owner.id != user.id and post_owner.id not in notified_user_ids:
                reply_notif = Notification(user_id=post_owner.id, actor_username=user.username, type='reply_post', post_id=post_id, comment_id=db_comment.id, community_id=post.community_id)
                session.add(reply_notif)
                notified_user_ids.add(post_owner.id)
            
        session.commit()
        session.refresh(db_comment)
        return db_comment
    except Exception as e:
        session.rollback()
        if "1054" in str(e) and "comment" in str(e):
            raise HTTPException(status_code=500, detail="Database schema mismatch: 'comment' table is missing columns. Please update the database.")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/posts/{post_id}/react")
async def react_to_post(post_id: int, reaction: ReactionCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # check user has been react or not
    existing_reaction = session.exec(select(Reaction).where(Reaction.post_id == post_id, Reaction.username == user.username)).first()
    
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if existing_reaction:
        if existing_reaction.type == reaction.type:
            # like/unlike
            session.delete(existing_reaction)
            post.likes -= 1
        else:
            # reaction update
            existing_reaction.type = reaction.type
            session.add(existing_reaction)
    else:
        new_reaction = Reaction(post_id=post_id, username=user.username, type=reaction.type)
        session.add(new_reaction)
        # Update total likes count
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

# --- EDIT & DELETE ENDPOINTS ---

@app.put("/api/posts/{post_id}", response_model=Post)
async def update_post(post_id: int, post_data: PostCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.username != user.username:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
    
    post.content = post_data.content
    post.image_url = post_data.image_url
    post.link_url = post_data.link_url
    post.is_edited = True
    session.add(post)
    session.commit()
    session.refresh(post)
    return post

@app.delete("/api/posts/{post_id}")
async def delete_post(post_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.username != user.username:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    # IMPORTANT: Delete dependent objects first to satisfy foreign key constraints.
    
    # 1. Delete Notifications related to the post
    notifications = session.exec(select(Notification).where(Notification.post_id == post_id)).all()
    for n in notifications:
        session.delete(n)

    # 2. Delete all reactions that are related to the post.
    reactions = session.exec(select(Reaction).where(Reaction.post_id == post_id)).all()
    for r in reactions:
        session.delete(r)
    
    session.commit() # for clear references from notif/reaction
        
    # 3. Delete all comments related to the post.
    session.exec(text("DELETE FROM comment WHERE post_id = :post_id ORDER BY id DESC"), params={"post_id": post_id})
        
    # 4. Finally, delete the post itself.
    post_to_delete = session.get(Post, post_id)
    if post_to_delete:
        session.delete(post_to_delete)
    session.commit()
    return {"status": "success"}

@app.put("/api/comments/{comment_id}", response_model=Comment)
async def update_comment(comment_id: int, comment_data: CommentCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.username != user.username:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    comment.content = comment_data.content
    comment.is_edited = True
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment

@app.delete("/api/comments/{comment_id}")
async def delete_comment(comment_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.username != user.username:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    # less counter comment
    post = session.get(Post, comment.post_id)
    if post:
        post.comments_count = max(0, post.comments_count - 1)
        session.add(post)

    session.delete(comment)
    session.commit()
    return {"status": "success"}

# --- NOTIFICATION ENDPOINTS ---
@app.get("/api/notifications", response_model=list[NotificationRead])
async def get_notifications(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notifications = session.exec(
        select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50)
    ).all()
    
    response_data = []
    for notif in notifications:
        actor = session.exec(select(User).where(User.username == notif.actor_username)).first()
        content_preview = ""
        if notif.comment_id:
            comment = session.get(Comment, notif.comment_id)
            if comment: content_preview = comment.content[:75]
        else:
            post = session.get(Post, notif.post_id)
            if post: content_preview = post.content[:75]

        response_data.append(
            NotificationRead(
                id=notif.id, actor_username=notif.actor_username, actor_avatar_url=actor.avatar_url if actor else None,
                type=notif.type, content_preview=content_preview, post_id=notif.post_id,
                community_id=notif.community_id, is_read=notif.is_read, created_at=notif.created_at
            )
        )
    return response_data

@app.get("/api/notifications/unread_count", response_model=dict)
async def get_unread_notification_count(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    results = session.exec(select(Notification).where(Notification.user_id == user.id, Notification.is_read == False)).all()
    return {"count": len(results)}

@app.post("/api/notifications/mark_as_read")
async def mark_notifications_as_read(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notifications = session.exec(select(Notification).where(Notification.user_id == user.id, Notification.is_read == False)).all()
    for notif in notifications:
        notif.is_read = True
        session.add(notif)
    session.commit()
    return {"status": "success"}

# --- ADMIN ENDPOINTS ---

@app.get("/api/admin/users", response_model=list[UserRead])
async def get_all_users(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    return session.exec(select(User)).all()

@app.get("/api/admin/feedbacks", response_model=list[Feedback])
async def get_all_feedbacks(user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    return session.exec(select(Feedback).order_by(Feedback.created_at.desc())).all()

@app.put("/api/admin/users/{user_id}", response_model=UserRead)
async def admin_update_user(
    user_id: int, 
    user_update: AdminUserUpdate, 
    admin_user: User = Depends(get_current_admin_user), 
    session: Session = Depends(get_session)
):
    user_to_update = session.get(User, user_id)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields from the request
    user_data = user_update.model_dump(exclude_unset=True)
    for key, value in user_data.items():
        setattr(user_to_update, key, value)
    
    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)
    return user_to_update

@app.delete("/api/admin/feedbacks/{feedback_id}")
async def delete_feedback(feedback_id: int, user: User = Depends(get_current_admin_user), session: Session = Depends(get_session)):
    feedback = session.get(Feedback, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    session.delete(feedback)
    session.commit()
    return {"status": "success"}

@app.post("/api/feedback")
async def submit_feedback(feedback: FeedbackCreate, session: Session = Depends(get_session)):
    db_feedback = Feedback(email=feedback.email, message=feedback.message)
    session.add(db_feedback)
    session.commit()
    return {"status": "success", "message": "Feedback received"}