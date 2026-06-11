import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.begin() as conn:
        try:
            print("Adding is_free to learningmodule...")
            conn.execute(text("ALTER TABLE learningmodule ADD COLUMN is_free BOOLEAN DEFAULT 0;"))
            print("Success.")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Column already exists in learningmodule, skipping.")
            else:
                print("Error adding to learningmodule:", e)

        try:
            print("Adding is_free to modulebundle...")
            conn.execute(text("ALTER TABLE modulebundle ADD COLUMN is_free BOOLEAN DEFAULT 0;"))
            print("Success.")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Column already exists in modulebundle, skipping.")
            else:
                print("Error adding to modulebundle:", e)

if __name__ == "__main__":
    migrate()
