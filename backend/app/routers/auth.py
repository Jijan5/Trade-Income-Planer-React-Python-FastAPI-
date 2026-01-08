from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta
from ..database import get_session
from ..models import User, UserCreate, Token
from ..auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

@router.post("/api/register", response_model=Token)
async def register(user: UserCreate, session: Session = Depends(get_session)):
  existing_user = session.exec(select(User).where(User.username == user.username)).first()
  if existing_user:
    raise HTTPException(status_code=400, detail="Username already registered")
  
  hashed_pwd = get_password_hash(user.password)
  db_user = User(username=user.username, email=user.email, hashed_password=hashed_pwd)
  session.add(db_user)
  session.commit()
  session.refresh(db_user)
  
  access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = create_access_token(data={"sub": db_user.username, "role": db_user.role}, expires_delta=access_token_expires)
  return {"access_token": access_token, "token_type": "bearer"}

@router.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
  user = session.exec(select(User).where(User.username == form_data.username)).first()
  if not user or not verify_password(form_data.password, user.hashed_password):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"},)
  
  access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = create_access_token(data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires)
  return {"access_token": access_token, "token_type": "bearer"}
