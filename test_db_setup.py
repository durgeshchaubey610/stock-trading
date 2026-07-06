from app.database import engine, Base
from app.models.stock import Stock, StockSector, StockBasket, BasketStock
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_db():
    try:
        logger.info("Connecting to database...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created successfully.")
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    test_db()
