from app.database import SessionLocal
from app.models.stock import Stock
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def mark_fno():
    db = SessionLocal()
    try:
        # Mark top 100 stocks by market cap as FNO for the purpose of the strategy
        stocks = db.query(Stock).order_by(Stock.market_cap.desc()).limit(100).all()
        for s in stocks:
            s.is_fno = 1
        db.commit()
        logger.info(f"Marked {len(stocks)} stocks as FNO.")
    except Exception as e:
        logger.error(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    mark_fno()
