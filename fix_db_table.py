from sqlalchemy import create_engine, text
from app.database import Base, engine
# Import all models to register them with Base
from app.models.stock import Stock
from app.models.daily_pick import DailyPick
from app.models.user import User
# ... other models if needed, but Stock is the main one here

def fix_daily_picks_table():
    with engine.connect() as conn:
        print("Dropping existing 'daily_picks' table...")
        conn.execute(text("DROP TABLE IF EXISTS daily_picks"))
        conn.commit()
    
    print("Creating tables via Base.metadata.create_all...")
    Base.metadata.create_all(bind=engine)
    print("Table 'daily_picks' recreated successfully.")

if __name__ == "__main__":
    fix_daily_picks_table()
