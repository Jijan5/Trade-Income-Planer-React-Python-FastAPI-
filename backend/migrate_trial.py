from sqlalchemy import text
from sqlmodel import Session, create_engine
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

try:
    with Session(engine) as session:
        session.exec(text("ALTER TABLE user ADD COLUMN has_used_trial BOOLEAN DEFAULT FALSE;"))
        session.commit()
        print("Migration successful: added has_used_trial to user table.")
except Exception as e:
    print(f"Migration error (might already exist): {e}")
