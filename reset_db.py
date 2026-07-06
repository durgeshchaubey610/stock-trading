from app.database import engine, Base
from app.models.stock import Stock, StockSector, StockBasket, BasketStock
from app.models.daily_pick import DailyPick
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_db():
    try:
        logger.info("Dropping existing tables...")
        # Order matters for foreign keys
        Base.metadata.drop_all(bind=engine, tables=[
            BasketStock.__table__,
            Stock.__table__,
            StockSector.__table__,
            StockBasket.__table__,
            DailyPick.__table__
        ])
        logger.info("Creating tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tables recreated successfully.")
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    reset_db()
