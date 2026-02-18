from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
from typing import Literal, Optional
from sqlmodel import Session, SQLModel, Field as SQLField
from datetime import datetime, timedelta

# SaaS Tenant Model
class Tenant(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    name: str = SQLField(unique=True, index=True)
    domain: str = SQLField(unique=True, index=True)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    is_active: bool = SQLField(default=True)

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
  tenant_id: int = SQLField(foreign_key="tenant.id", index=True)
  username: str = SQLField(index=True, unique=True)
  email: str = SQLField(index=True, unique=True)
  country_code: str
  phone_number: str
  full_name: str
  hashed_password: str
  role: str = SQLField(default="user")  # roles: user, admin
  avatar_url: Optional[str] = SQLField(default=None)
  plan: str = SQLField(default="Free")
  reset_token: Optional[str] = SQLField(default=None, index=True)
  reset_token_expires: Optional[datetime] = SQLField(default=None)
  status: str = SQLField(default="active")  # statuses: active, banned
  plan_billing_cycle: Optional[str] = SQLField(default=None) # Monthly, Yearly
  plan_start_date: Optional[datetime] = SQLField(default=None)
  plan_expires_at: Optional[datetime] = SQLField(default=None)
  suspended_until: Optional[datetime] = SQLField(default=None)
  suspension_reason: Optional[str] = SQLField(default=None)
  appeal_message: Optional[str] = SQLField(default=None)
  appeal_status: Optional[str] = SQLField(default="none")
  appeal_response: Optional[str] = SQLField(default=None)

class UserCreate(BaseModel):
  username: str
  email: str
  password: str
  full_name: str
  country_code: str
  phone_number: str
  
class UserRead(BaseModel):
  id: int
  tenant_id: int
  username: str
  email: str
  role: str
  avatar_url: Optional[str] = None
  plan: str
  status: str
  full_name: Optional[str] = None
  country_code: Optional[str] = None
  phone_number: Optional[str] = None
  plan_billing_cycle: Optional[str] = None
  plan_start_date: Optional[datetime] = None
  plan_expires_at: Optional[datetime] = None
  suspended_until: Optional[datetime] = None
  suspension_reason: Optional[str] = None
  appeal_message: Optional[str] = None
  appeal_status: Optional[str] = None
  appeal_response: Optional[str] = None

class AdminUserUpdate(BaseModel):
  username: str
  email: str
  role: str
  plan: str
  status: str
  full_name: Optional[str] = None
  country_code: Optional[str] = None
  phone_number: Optional[str] = None
  plan_billing_cycle: Optional[str] = None
  plan_expires_at: Optional[datetime] = None

class UserUpdateAdmin(SQLModel):
    tenant_id: int
    username: str
    email: str
    role: str
    plan: str
    status: str
    full_name: Optional[str] = None
    country_code: Optional[str] = None
    phone_number: Optional[str] = None
    plan_billing_cycle: Optional[str] = None
    plan_expires_at: Optional[datetime] = None
    suspended_until: Optional[datetime] = None
    suspension_reason: Optional[str] = None
    appeal_message: Optional[str] = None
    appeal_status: Optional[str] = None
    appeal_response: Optional[str] = None
    
    def auto_unsuspend_user(self, session: Session):
      if self:
        self.status = "active"
        self.suspended_until = None
        self.suspension_reason = None
        session.add(self)
        session.commit()
        session.refresh(self)

class Token(BaseModel):
  access_token: str
  token_type: str
  
class Notification(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True, index=True)
    tenant_id: int = SQLField(foreign_key="tenant.id", index=True)
    user_id: int = SQLField(index=True, foreign_key="user.id") # The one being notified
    actor_username: str # The one who did the action
    type: str # 'mention_post', 'mention_comment', 'reply_post', 'reply_comment'
    post_id: Optional[int] = SQLField(default=None, foreign_key="post.id")
    comment_id: Optional[int] = SQLField(default=None, foreign_key="comment.id")
    content: Optional[str] = SQLField(default=None, max_length=512) # For broadcasts
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
    tenant_id: int = SQLField(foreign_key="tenant.id", index=True)
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
    actor_role: str = "user"
    actor_plan: str = "Free"
    type: str
    content_preview: str
    post_id: Optional[int]
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
    tenant_id: int = SQLField(foreign_key="tenant.id", index=True)
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

class PostResponse(BaseModel):
    id: int
    tenant_id: int
    community_id: Optional[int] = None
    username: str
    content: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    created_at: datetime
    likes: int
    comments_count: int
    shares_count: int
    is_edited: bool
    user_role: str
    user_plan: str
    user_avatar_url: Optional[str] = None
    user_reaction: Optional[str] = None

class Comment(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    tenant_id: int = SQLField(foreign_key="tenant.id", index=True)
    post_id: int = SQLField(foreign_key="post.id")
    parent_id: Optional[int] = SQLField(default=None, foreign_key="comment.id")
    username: str
    content: str
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    is_edited: bool = SQLField(default=False)

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    post_id: int
    parent_id: Optional[int] = None
    username: str
    content: str
    created_at: datetime
    is_edited: bool
    user_role: str
    user_plan: str
    user_avatar_url: Optional[str] = None

class Reaction(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    tenant_id: int = SQLField(foreign_key="tenant.id", index=True)
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
    
class ManualTrade(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    tenant_id: int = SQLField(foreign_key="tenant.id", index=True)
    user_id: int = SQLField(foreign_key="user.id", index=True)
    symbol: str
    entry_price: Decimal = Field(default=0, max_digits=20, decimal_places=8)
    exit_price: Decimal = Field(default=0, max_digits=20, decimal_places=8)
    pnl: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    is_win: bool
    trade_date: datetime = SQLField(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class ManualTradeCreate(BaseModel):
    symbol: str
    entry_price: float
    exit_price: float
    pnl: float
    is_win: bool
    notes: Optional[str] = None
    
class BroadcastRequest(BaseModel):
    message: str
    
class Report(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    tenant_id: int = SQLField(foreign_key="tenant.id", index=True)
    reporter_username: str
    post_id: Optional[int] = SQLField(default=None, foreign_key="post.id")
    comment_id: Optional[int] = SQLField(default=None, foreign_key="comment.id")
    reason: str
    created_at: datetime = SQLField(default_factory=datetime.utcnow)

class ReportCreate(BaseModel):
    post_id: Optional[int] = None
    comment_id: Optional[int] = None
    reason: str
    
# trader health score model
class TradeItem(BaseModel):
  pnl: Decimal
  risk_amount: Decimal # risk amount per trade
  balance: Decimal # balance before execute trade
  is_win: bool
  
class HealthAnalysisRequest(BaseModel):
  trades: list[TradeItem]

class HealthAnalysisResponse(BaseModel):
  overall_score: int
  risk_score: int
  emotional_score: int
  system_score: int
  summary: str
  warnings: list[str]
  recommended_risk: float
  recommendation_reason: str
  trading_identity: str
  identity_insight: str