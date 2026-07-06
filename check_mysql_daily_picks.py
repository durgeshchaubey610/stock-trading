from sqlalchemy import create_engine, inspect
from app.config import DB_HOST, DB_USER, DB_PASS, DB_NAME

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

def check_columns():
    inspector = inspect(engine)
    if "daily_picks" in inspector.get_table_names():
        columns = inspector.get_columns("daily_picks")
        print(f"Columns in 'daily_picks':")
        for column in columns:
            print(f"- {column['name']} ({column['type']})")
    else:
        print("'daily_picks' table does not exist.")

if __name__ == "__main__":
    check_columns()
