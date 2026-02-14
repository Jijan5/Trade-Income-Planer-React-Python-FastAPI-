from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta, datetime
from pydantic import BaseModel, EmailStr
from ..database import get_session
import secrets
import string
from ..models import User, UserCreate, Token, Tenant
from ..auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

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
    tenant_id: int  # Assuming tenant_id is passed from frontend

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
         # --- PRODUCTION SCRIPT (COMMENTED OUT) ---
        # reset_token = secrets.token_urlsafe(32)
        # user.reset_token = reset_token
        # user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        # session.add(user)
        # session.commit()
        # send_email_reset(user.email, reset_token) # send email
        
        # --- LOCALHOST SCRIPT (PIN GENERATION) ---
        pin = ''.join(secrets.choice(string.digits) for _ in range(6))
        user.reset_token = pin
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=15) # PIN valid 15 minutes
        session.add(user)
        session.commit()

        print(f"\n========================================")
        print(f" [LOCALHOST] PASSWORD RESET PIN: {pin} ")
        print(f"========================================\n")

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