import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

# Use MySQL for SaaS tenants
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://user:password@localhost/trade_db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})

def create_db_and_tables():
  SQLModel.metadata.create_all(engine)

def get_session():
  with Session(engine) as session:
    yield session
