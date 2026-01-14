from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta, datetime
from pydantic import BaseModel, EmailStr
from ..database import get_session
import secrets
from ..models import User, UserCreate, Token
from ..auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

@router.post("/api/register")
async def register(user: UserCreate, session: Session = Depends(get_session)):
  existing_user = session.exec(select(User).where(User.username == user.username)).first()
  if existing_user:
    raise HTTPException(status_code=400, detail="Username already registered")
  
  hashed_pwd = get_password_hash(user.password)
  db_user = User(
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
  user = session.exec(select(User).where(User.username == form_data.username)).first()
  if not user or not verify_password(form_data.password, user.hashed_password):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"},)
  
  access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = create_access_token(data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires)
  return {"access_token": access_token, "token_type": "bearer"}

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == req.email)).first()
    if user:
        # Generate a secure token
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1) # Token is valid for 1 hour
        session.add(user)
        session.commit()

        # In a real application, you would send an email here.
        # For development, we'll just print the link.
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        print("--- PASSWORD RESET LINK (FOR DEVELOPMENT) ---")
        print(reset_link)
        print("---------------------------------------------")

    return {"message": "If an account with this email exists, a password reset link has been sent."}