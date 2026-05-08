import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

# Construct DATABASE_URL from individual MySQL environment variables
mysql_user     = os.getenv("MYSQL_USER", "root")
mysql_password = os.getenv("MYSQL_PASSWORD", "")
mysql_server   = os.getenv("MYSQL_SERVER", "localhost")
mysql_port     = os.getenv("MYSQL_PORT", "3306")
mysql_db       = os.getenv("MYSQL_DB", "db-trade-planer")

# Build the DATABASE_URL
if mysql_password:
    DATABASE_URL = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_server}:{mysql_port}/{mysql_db}"
else:
    DATABASE_URL = f"mysql+pymysql://{mysql_user}@{mysql_server}:{mysql_port}/{mysql_db}"

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
