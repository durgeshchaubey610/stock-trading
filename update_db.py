from sqlalchemy import text
from app.database import engine, Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_database():
    logger.info("Starting database update for 'stock_ai'...")
    
    # 1. Create new tables (Alerts, ScreenerTemplates, InvestmentBaskets)
    try:
        # Import all models to ensure they are registered with Base
        from app.models.user import User
        from app.models.stock import Stock
        # pyrefly: ignore [missing-import]
        from app.models.user_strategy import UserStrategy
        from app.models.alert import Alert
        from app.models.screener_template import ScreenerTemplate
        from app.models.basket import InvestmentBasket
        from app.models.stock_details import (
            StockFinancials, StockGrowth, StockValuation, StockOwnership,
            StockTechnicals, StockScores, StockForecasts, StockNews, StockEvents
        )
        from app.models.paper_trading import (
            PaperPortfolio, PaperPosition, PaperOrder, PaperTrade, PaperJournal
        )
        
        logger.info("Creating new tables if they don't exist...")
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.error(f"Error creating tables: {e}")

    # 2. Alter existing tables to add new columns
    with engine.connect() as conn:
        # Update users table
        logger.info("Checking for new columns in 'users' table...")
        columns_to_add_users = [
            ("is_public", "BOOLEAN DEFAULT FALSE"),
            ("profile_slug", "VARCHAR(50) UNIQUE"),
            ("is_premium", "BOOLEAN DEFAULT FALSE"),
            ("subscription_tier", "VARCHAR(20) DEFAULT 'free'"),
            ("subscription_expiry", "DATETIME")
        ]
        
        for col_name, col_type in columns_to_add_users:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                logger.info(f"Added column '{col_name}' to 'users' table.")
            except Exception as e:
                if "Duplicate column name" in str(e) or "already exists" in str(e):
                    logger.info(f"Column '{col_name}' already exists in 'users' table.")
                else:
                    logger.error(f"Error adding column '{col_name}' to 'users': {e}")


        # Update stocks table
        logger.info("Checking for new columns in 'stocks' table...")
        columns_to_add_stocks = [
            ("sector", "VARCHAR(100)"),
            ("debt_to_equity", "FLOAT DEFAULT 0.0"),
            ("roe", "FLOAT DEFAULT 0.0"),
            ("roce", "FLOAT DEFAULT 0.0"),
            ("sma20", "FLOAT"),
            ("sma50", "FLOAT"),
            ("sma200", "FLOAT"),
            ("ema20", "FLOAT"),
            ("ema50", "FLOAT"),
            ("atr14", "FLOAT"),
            ("macd", "FLOAT"),
            ("macd_signal", "FLOAT"),
            ("adx", "FLOAT"),
            ("supertrend", "FLOAT"),
            ("high_52_week", "FLOAT"),
            ("low_52_week", "FLOAT"),
            ("delivery_percentage", "FLOAT"),
            ("oi_change", "FLOAT"),
            ("avg_volume_20d", "FLOAT"),
            ("signal", "VARCHAR(20)"),
            ("pb_ratio", "FLOAT"),
            ("peg_ratio", "FLOAT"),
            ("ev_to_ebitda", "FLOAT"),
            ("ev_to_sales", "FLOAT"),
            ("price_to_sales", "FLOAT"),
            ("dividend_yield", "FLOAT"),
            ("enterprise_value", "FLOAT"),
            ("roa", "FLOAT"),
            ("ebitda_margin", "FLOAT"),
            ("operating_margin", "FLOAT"),
            ("gross_margin", "FLOAT"),
            ("net_profit_margin", "FLOAT"),
            ("revenue_growth_3y", "FLOAT"),
            ("revenue_growth_5y", "FLOAT"),
            ("profit_growth_3y", "FLOAT"),
            ("profit_growth_5y", "FLOAT"),
            ("current_ratio", "FLOAT"),
            ("quick_ratio", "FLOAT"),
            ("interest_coverage_ratio", "FLOAT"),
            ("total_debt", "FLOAT"),
            ("total_cash", "FLOAT"),
            ("beta", "FLOAT"),
            ("vwap", "FLOAT"),
            ("target_price", "FLOAT"),
            ("upside_pct", "FLOAT"),
            ("recommendation_count", "INT"),
            ("recommendation_key", "VARCHAR(50)"),
            ("shares_outstanding", "BIGINT"),
            ("face_value", "FLOAT"),
            ("book_value", "FLOAT")
        ]
        
        for col_name, col_type in columns_to_add_stocks:
            try:
                # Use backticks for reserved keywords like 'signal'
                quoted_col = f"`{col_name}`" if col_name == "signal" else col_name
                conn.execute(text(f"ALTER TABLE stocks ADD COLUMN {quoted_col} {col_type}"))
                conn.commit()
                logger.info(f"Added column '{col_name}' to 'stocks' table.")
            except Exception as e:
                if "Duplicate column name" in str(e) or "already exists" in str(e):
                    logger.info(f"Column '{col_name}' already exists in 'stocks' table.")
                else:
                    logger.error(f"Error adding column '{col_name}' to 'stocks': {e}")

        # Update user_strategy table
        logger.info("Checking for new columns in 'user_strategy' table...")
        columns_to_add_strategy = [
            ("description", "VARCHAR(255)"),
            ("conditions", "TEXT"),
            ("created_at", "DATETIME"),
            ("updated_at", "DATETIME")
        ]
        
        for col_name, col_type in columns_to_add_strategy:
            try:
                conn.execute(text(f"ALTER TABLE user_strategy ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                logger.info(f"Added column '{col_name}' to 'user_strategy' table.")
            except Exception as e:
                if "Duplicate column name" in str(e) or "already exists" in str(e):
                    logger.info(f"Column '{col_name}' already exists in 'user_strategy' table.")
                else:
                    logger.error(f"Error adding column '{col_name}' to 'user_strategy': {e}")
        
        # Ensure strategy_name is 100 chars
        try:
            conn.execute(text("ALTER TABLE user_strategy MODIFY COLUMN strategy_name VARCHAR(100)"))
            conn.commit()
            logger.info("Updated 'strategy_name' length in 'user_strategy' table.")
        except Exception as e:
            logger.info(f"Skipping strategy_name modification: {e}")

        # Update strategy_automations table
        logger.info("Checking for new columns in 'strategy_automations' table...")
        try:
            conn.execute(text("ALTER TABLE strategy_automations ADD COLUMN strategy_id INT"))
            conn.commit()
            logger.info("Added column 'strategy_id' to 'strategy_automations' table.")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e):
                logger.info("Column 'strategy_id' already exists in 'strategy_automations' table.")
            else:
                logger.error(f"Error adding column 'strategy_id' to 'strategy_automations': {e}")

        # Update health_profile table
        logger.info("Checking for new columns in 'health_profile' table...")
        columns_to_add_health = [
            ("first_name", "VARCHAR(100)"),
            ("last_name", "VARCHAR(100)")
        ]
        for col_name, col_type in columns_to_add_health:
            try:
                conn.execute(text(f"ALTER TABLE health_profile ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                logger.info(f"Added column '{col_name}' to 'health_profile' table.")
            except Exception as e:
                if "Duplicate column name" in str(e) or "already exists" in str(e):
                    logger.info(f"Column '{col_name}' already exists in 'health_profile' table.")
                else:
                    logger.error(f"Error adding column '{col_name}' to 'health_profile': {e}")

        # Update user_health_roadmap table
        logger.info("Checking for new columns in 'user_health_roadmap' table...")
        try:
            conn.execute(text("ALTER TABLE user_health_roadmap ADD COLUMN tasks TEXT"))
            conn.commit()
            logger.info("Added column 'tasks' to 'user_health_roadmap' table.")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e):
                logger.info("Column 'tasks' already exists in 'user_health_roadmap' table.")
            else:
                logger.error(f"Error adding column 'tasks' to 'user_health_roadmap': {e}")

    logger.info("Database update completed.")

if __name__ == "__main__":
    update_database()
