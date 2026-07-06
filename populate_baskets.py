from app.database import SessionLocal
from app.models.stock import Stock, StockBasket, BasketStock
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def populate_baskets():
    db = SessionLocal()
    try:
        # 1. Insert Baskets
        baskets_data = [
            (1, 'NIFTY 50'),
            (2, 'NIFTY NEXT 50'),
            (3, 'VALUE STOCK'),
            (4, 'NIFTY MIDCAP'),
            (5, 'NIFTY SMALLCAL')
        ]
        
        for b_id, b_name in baskets_data:
            basket = db.query(StockBasket).filter(StockBasket.id == b_id).first()
            if not basket:
                basket = StockBasket(id=b_id, name=b_name)
                db.add(basket)
            else:
                basket.name = b_name
        
        db.commit()
        logger.info("Baskets inserted/updated.")

        # 2. Get all stocks sorted by market cap
        all_stocks = db.query(Stock).order_by(Stock.market_cap.desc()).all()
        
        if not all_stocks:
            logger.error("No stocks found in database. Run sync first.")
            return

        # Clear existing associations to avoid duplicates if re-run
        db.query(BasketStock).delete()
        db.commit()

        # Helper to add stocks to basket
        def add_to_basket(basket_id, stocks_list):
            for s in stocks_list:
                db.add(BasketStock(basket_id=basket_id, stock_id=s.id))
            db.commit()
            logger.info(f"Added {len(stocks_list)} stocks to basket {basket_id}")

        # NIFTY 50: Top 50 by Market Cap
        nifty_50_stocks = all_stocks[:50]
        add_to_basket(1, nifty_50_stocks)

        # NIFTY NEXT 50: Next 50
        nifty_next_50_stocks = all_stocks[50:100]
        add_to_basket(2, nifty_next_50_stocks)

        # NIFTY MIDCAP: Next 150
        nifty_midcap_stocks = all_stocks[100:250]
        add_to_basket(4, nifty_midcap_stocks)

        # NIFTY SMALLCAL: Remaining
        nifty_smallcap_stocks = all_stocks[250:]
        add_to_basket(5, nifty_smallcap_stocks)

        # VALUE STOCK: Top 50 by lowest PE (where PE > 0)
        value_stocks = db.query(Stock).filter(Stock.pe_ratio > 0).order_by(Stock.pe_ratio.asc()).limit(50).all()
        add_to_basket(3, value_stocks)

        logger.info("Basket associations completed.")

    except Exception as e:
        logger.error(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_baskets()
