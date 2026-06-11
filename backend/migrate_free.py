import sqlite3

def migrate():
    # Connect to the SQLite database
    conn = sqlite3.connect('trade_income.db')
    cursor = conn.cursor()

    try:
        # Add is_free column to learningmodule table
        print("Adding is_free to learningmodule...")
        cursor.execute("ALTER TABLE learningmodule ADD COLUMN is_free BOOLEAN DEFAULT 0;")
        print("Success.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column already exists in learningmodule, skipping.")
        else:
            print("Error adding to learningmodule:", e)

    try:
        # Add is_free column to modulebundle table
        print("Adding is_free to modulebundle...")
        cursor.execute("ALTER TABLE modulebundle ADD COLUMN is_free BOOLEAN DEFAULT 0;")
        print("Success.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column already exists in modulebundle, skipping.")
        else:
            print("Error adding to modulebundle:", e)

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
