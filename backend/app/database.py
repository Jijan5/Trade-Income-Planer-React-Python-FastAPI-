import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

# Construct DATABASE_URL from .env
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/db-trade-planer")

# ── Connection pool tuned for high concurrency ─────────────────────────────
# pool_size     : persistent connections always open
# max_overflow  : extra burst connections allowed under spike load
# pool_pre_ping : drop stale connections before use (prevents "MySQL gone away")
# pool_recycle  : recycle connections every 30 min (avoids MySQL 8h timeout)
# pool_timeout  : raise immediately when pool exhausted instead of hanging
engine = create_engine(
    DATABASE_URL,
    connect_args={"connect_timeout": 10},
    pool_size=int(os.getenv("DB_POOL_SIZE", "20")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "40")),
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_timeout=10,
    echo=False,
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
