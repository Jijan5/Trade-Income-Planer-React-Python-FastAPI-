import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

# Construct DATABASE_URL from individual MySQL environment variables
mysql_user = os.getenv("MYSQL_USER")
mysql_password = os.getenv("MYSQL_PASSWORD")
mysql_server = os.getenv("MYSQL_SERVER")
mysql_port = os.getenv("MYSQL_PORT")
mysql_db = os.getenv("MYSQL_DB")

# Build the DATABASE_URL
if mysql_password:
    DATABASE_URL = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_server}:{mysql_port}/{mysql_db}"
else:
    DATABASE_URL = f"mysql+pymysql://{mysql_user}@{mysql_server}:{mysql_port}/{mysql_db}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})

def create_db_and_tables():
  SQLModel.metadata.create_all(engine)

def get_session():
  with Session(engine) as session:
    yield session
