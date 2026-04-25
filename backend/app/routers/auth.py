from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta, datetime
from pydantic import BaseModel, EmailStr
from ..database import get_session
import secrets
import string
from ..models import User, UserCreate, Token, Tenant, ContactMessage, ContactMessageCreate
from ..auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from ..email_utils import send_contact_email, send_password_reset_email

router = APIRouter()

@router.post("/api/register")
async def register(user: UserCreate, session: Session = Depends(get_session)):
  # Get default tenant
  default_tenant = session.exec(select(Tenant).where(Tenant.name == "default")).first()
  if not default_tenant:
    raise HTTPException(status_code=500, detail="Default tenant not found")

  existing_user = session.exec(select(User).where(User.username == user.username, User.tenant_id == default_tenant.id)).first()
  if existing_user:
    raise HTTPException(status_code=400, detail="Username already registered")

  hashed_pwd = get_password_hash(user.password)
  db_user = User(
      tenant_id=default_tenant.id,
      username=user.username,
      email=user.email,
      hashed_password=hashed_pwd,
      full_name=user.full_name,
      country_code=user.country_code,
      phone_number=user.phone_number
  )
  session.add(db_user)
  session.commit()
  session.refresh(db_user)

  return {"message": "User created successfully"}

@router.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    # First, get the default tenant to check against
    default_tenant = session.exec(select(Tenant).where(Tenant.name == "default")).first()
    if not default_tenant:
        raise HTTPException(status_code=500, detail="Default tenant not found")

    user = session.exec(select(User).where(User.username == form_data.username, User.tenant_id == default_tenant.id)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"},)
  
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username, "role": user.role, "tenant_id": user.tenant_id}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

class CheckUsernameRequest(BaseModel):
    username: str
    tenant_id: int = 1

@router.post("/api/check_username")
async def check_username(req: CheckUsernameRequest, session: Session = Depends(get_session)):
  existing_user = session.exec(select(User).where(User.username == req.username, User.tenant_id == req.tenant_id)).first()
  available = existing_user is None
  return {"available": available}

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    tenant_id: int

class VerifyPinRequest(BaseModel):
    email: EmailStr
    pin: str
    tenant_id: int

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    pin: str
    new_password: str
    confirm_password: str
    tenant_id: int

@router.post("/api/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == req.email, User.tenant_id == req.tenant_id)).first()
    if user:
        # Generate 6-digit PIN
        pin = ''.join(secrets.choice(string.digits) for _ in range(6))
        user.reset_token = pin
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=15)  # PIN valid for 15 minutes
        session.add(user)
        session.commit()

        # --- PRODUCTION: Send PIN via email ---
        # In production, this sends the actual email to the user
        email_sent = send_password_reset_email(user.email, pin)
        
        if email_sent:
            print(f"\n========================================")
            print(f" [PRODUCTION] PIN sent to email: {user.email}")
            print(f"========================================\n")
        else:
            # Fallback for development - show PIN in console if email fails
            print(f"\n========================================")
            print(f" [LOCAL/DEBUG] PASSWORD RESET PIN: {pin} ")
            print(f" [Email failed to send - check SMTP settings]")
            print(f"========================================\n")

    # Always return generic message to prevent email enumeration
    return {"status": "success", "message": "If an account with this email exists, a PIN has been sent."}

@router.post("/api/verify-reset-pin")
async def verify_reset_pin(req: VerifyPinRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == req.email, User.tenant_id == req.tenant_id)).first()
    if not user or user.reset_token != req.pin:
        raise HTTPException(status_code=400, detail="Invalid PIN")
    
    if user.reset_token_expires and datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(status_code=400, detail="PIN expired")
        
    return {"status": "success", "message": "PIN verified"}

@router.post("/api/reset-password")
async def reset_password(req: ResetPasswordRequest, session: Session = Depends(get_session)):
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    # Reuse verification logic for security
    await verify_reset_pin(VerifyPinRequest(email=req.email, pin=req.pin, tenant_id=req.tenant_id), session)
    
    user = session.exec(select(User).where(User.email == req.email, User.tenant_id == req.tenant_id)).first()
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    session.add(user)
    session.commit()
    
    return {"status": "success", "message": "Password reset successfully"}

@router.post("/api/contact")
async def contact_us(message_data: ContactMessageCreate, session: Session = Depends(get_session)):
    db_message = ContactMessage.from_orm(message_data)
    # In a real multi-tenant app, you might determine the tenant differently
    db_message.tenant_id = 1 
    session.add(db_message)
    session.commit()
    
    # Trigger an email to support/admin
    send_contact_email(
        name=db_message.name,
        from_email=db_message.email,
        subject=db_message.subject,
        message=db_message.message
    )
    
    return {"status": "success", "message": "Your message has been sent successfully."}

# ─────────────────────────────────────────────
# Google OAuth2 (Authlib)
# ─────────────────────────────────────────────
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse, Response
from ..dependencies import get_current_user
from ..auth import create_access_token
import os

_GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
_GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

_oauth = OAuth()
if _GOOGLE_CLIENT_ID and _GOOGLE_CLIENT_SECRET:
    _oauth.register(
        name="google",
        client_id=_GOOGLE_CLIENT_ID,
        client_secret=_GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

@router.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Silence the 404 that browsers request after an OAuth redirect."""
    return Response(status_code=204)

@router.get("/auth/google")
async def google_login(request: Request):
    if not _GOOGLE_CLIENT_ID or not _GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=501,
            detail="Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env",
        )
    redirect_uri = request.url_for("google_callback")
    return await _oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback", name="google_callback")
async def google_callback(request: Request, session: Session = Depends(get_session)):
    try:
        token = await _oauth.google.authorize_access_token(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"OAuth error: {exc}")

    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")

    email = user_info["email"]
    full_name = user_info.get("name", "")
    # Derive a clean username from the Google name (fallback to email prefix)
    raw_name = user_info.get("given_name") or full_name or email.split("@")[0]
    base_username = raw_name.replace(" ", "_").lower()[:20]

    # Find or create the user
    existing = session.exec(select(User).where(User.email == email)).first()
    if not existing:
        # Ensure username is unique — append a short suffix if needed
        candidate = base_username
        suffix = 1
        while session.exec(select(User).where(User.username == candidate)).first():
            candidate = f"{base_username[:17]}_{suffix}"
            suffix += 1

        existing = User(
            tenant_id=1,
            username=candidate,
            email=email,
            full_name=full_name,
            hashed_password="social_auth_google",
            provider="google",
        )
        session.add(existing)
        session.commit()
        session.refresh(existing)

    access_token = create_access_token(
        data={"sub": existing.username, "role": existing.role, "tenant_id": existing.tenant_id}
    )
    frontend_url = os.getenv("VITE_FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(url=f"{frontend_url}/auth/callback/google?token={access_token}")

# Keep facebook stub for potential future use
@router.get("/auth/facebook")
async def facebook_login():
    raise HTTPException(status_code=501, detail="Facebook OAuth is not yet configured.")
