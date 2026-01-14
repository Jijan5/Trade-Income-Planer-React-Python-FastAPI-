import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
import bcrypt
import hashlib
import base64

load_dotenv()

# secret key
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
  # Pre-hash the provided plain password with SHA256, then base64 encode it
  password_bytes = plain_password.encode('utf-8')
  pre_hashed_password = base64.b64encode(hashlib.sha256(password_bytes).digest())
  
  # Compare it with the stored bcrypt hash
  return bcrypt.checkpw(pre_hashed_password, hashed_password.encode('utf-8'))

def get_password_hash(password):
  # Pre-hash the password with SHA256 to ensure it's not longer than 72 bytes for bcrypt
  password_bytes = password.encode('utf-8')
  sha256_hash = hashlib.sha256(password_bytes).digest()
  pre_hashed_password = base64.b64encode(sha256_hash)
  
  # Generate the bcrypt hash from the pre-hashed password
  return bcrypt.hashpw(pre_hashed_password, bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
  to_encode = data.copy()
  if expires_delta:
    expire = datetime.utcnow() + expires_delta
  else:
    expire = datetime.utcnow() + timedelta(minutes=15)
    
  to_encode.update({"exp": expire})
  encode_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  return encode_jwt

def decode_access_token(token:str):
  try:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
  except JWTError:
    return None