from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
from typing import Literal, Optional
from sqlmodel import SQLModel, Field as SQLField
from datetime import datetime

class SimulationRequest(BaseModel):
  initial_balance: Decimal = Field(..., gt=0, description="The starting balance for the simulation.")
  capital_utilization: Decimal = Field(..., gt=0, le=100, description="% Balance to be used in each trade (0-100).")
  risk_per_trade: Decimal = Field(..., gt=0, le=100, description="The percentage risk of each trade (0-100).")
  risk_reward_ratio: Decimal = Field(..., gt=0, description="The risk to reward ratio for each trade.")
  win_rate: Decimal = Field(..., ge=0, le=100, description="The expected win rate percentage (0-100).")
  trades_per_day: int = Field(..., gt=0, description="The number of trades to simulate per day.")
  simulation_days: int = Field(..., gt=0, le=3650, description="The number of days over which to run the simulation (max 10 years).")
  fees_per_trade: Decimal = Field(default=0, ge=0, description="Commission or fees per trade in currency.")
  risk_type: Literal["dynamic", "fixed"] = Field(default="dynamic", description="Risk calculation method: 'dynamic' (compounding) or 'fixed' (based on initial capital).")
  
  #validators
  @field_validator('initial_balance')
  def validate_decimals(cls, v):
    return v.quantize(Decimal("0.01"))
  
class DailyResult(BaseModel):
  day: int
  start_balance: str
  profit_loss: str
  end_balance: str
  roi: str

class TradeResult(BaseModel):
  trade_no: int
  day: int
  result: str # "WIN" or "LOSS"
  pnl: str
  balance: str

class SimulationResponse(BaseModel):
  status: str
  summary: dict
  daily_breakdown: list[DailyResult]
  monte_carlo: dict | None = None
  trade_log: list[TradeResult] = []

class GoalPlannerRequest(BaseModel):
    initial_balance: Decimal = Field(..., gt=0)
    target_balance: Decimal = Field(..., gt=0)
    deadline_months: int = Field(..., gt=0, le=120) # Max 10 years

class GoalPlannerResponse(BaseModel):
    status: str
    required_monthly_return: str
    feasibility: str
    message: str

class ChatRequest(BaseModel):
  message: str

class ChatResponse(BaseModel):
  response: str

# db models (auth)

class User(SQLModel, table=True):
  id: Optional[int] = SQLField(default=None, primary_key=True)
  username: str = SQLField(index=True, unique=True)
  email: str = SQLField(index=True, unique=True)
  hashed_password: str
  role: str = SQLField(default="user")  # roles: user, admin
  avatar_url: Optional[str] = SQLField(default=None)
  
class UserCreate(BaseModel):
  username: str
  email: str
  password: str
  
class UserRead(BaseModel):
  id: int
  username: str
  email: str
  role: str
  avatar_url: Optional[str] = None

class Token(BaseModel):
  access_token: str
  token_type: str
  
class Notification(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(index=True, foreign_key="user.id") # The one being notified
    actor_username: str # The one who did the action
    type: str # 'mention_post', 'mention_comment', 'reply_post', 'reply_comment'
    post_id: int = SQLField(foreign_key="post.id")
    comment_id: Optional[int] = SQLField(default=None, foreign_key="comment.id")
    community_id: Optional[int] = SQLField(default=None, foreign_key="community.id")
    is_read: bool = SQLField(default=False, index=True)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
  
class CommunityMemberRead(BaseModel):
    user_id: int
    username: str
    avatar_url: Optional[str] = None
    joined_at: datetime

# --- COMMUNITY MODELS ---
class Community(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    name: str = SQLField(index=True)
    description: str
    members_count: int = SQLField(default=1)
    active_count: int = SQLField(default=0)
    creator_username: str = SQLField(default="system")
    avatar_url: Optional[str] = SQLField(default=None)
    bg_type: str = SQLField(default="color") # 'color', 'gradient', 'image'
    bg_value: str = SQLField(default="#1f2937") # hex, gradient string, or url
    text_color: str = SQLField(default="#ffffff")
    font_family: str = SQLField(default="sans") # 'sans', 'serif', 'mono'
    hover_animation: str = SQLField(default="none") # 'scale', 'glow', 'none'
    hover_color: str = SQLField(default="#3b82f6")
    
class NotificationRead(BaseModel):
    id: int
    actor_username: str
    actor_avatar_url: Optional[str] = None
    type: str
    content_preview: str
    post_id: int
    community_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    
class CommunityMember(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    community_id: int = SQLField(foreign_key="community.id")
    user_id: int = SQLField(foreign_key="user.id")
    joined_at: datetime = SQLField(default_factory=datetime.utcnow)

class CommunityCreate(BaseModel):
    name: str
    description: str

class Post(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    community_id: Optional[int] = SQLField(foreign_key="community.id")
    username: str
    content: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    likes: int = SQLField(default=0)
    comments_count: int = SQLField(default=0)
    shares_count: int = SQLField(default=0)
    is_edited: bool = SQLField(default=False)

class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None

class Comment(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    post_id: int = SQLField(foreign_key="post.id")
    parent_id: Optional[int] = SQLField(default=None, foreign_key="comment.id")
    username: str
    content: str
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    is_edited: bool = SQLField(default=False)

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class Reaction(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    post_id: int = SQLField(foreign_key="post.id")
    username: str
    type: str # 'like', 'shock', 'rocket', 'chart_up', 'clap'

class ReactionCreate(BaseModel):
    type: str # 'like', 'shock', 'rocket', 'chart_up', 'clap'

class Feedback(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    email: str
    message: str
    created_at: datetime = SQLField(default_factory=datetime.utcnow)

class FeedbackCreate(BaseModel):
    email: str
    message: str