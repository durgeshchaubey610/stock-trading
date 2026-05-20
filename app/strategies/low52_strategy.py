from datetime import datetime
from sqlalchemy import text

from app.strategies.base_strategy import BaseStrategy
from app.database import SessionLocal
from app.config import BASE_BUY_QTY, MARKET_BUY_TIME

class Low52Strategy(BaseStrategy):

    def execute(self, stock, user_id):

        db = SessionLocal()
        try:
            price = stock["price"]
            now = datetime.now()

            if now.hour < MARKET_BUY_TIME:
                return

            result = db.execute(
                text("""
                SELECT buy_price, quantity, buy_number
                FROM portfolio
                WHERE user_id = :user_id AND stock_symbol = :symbol
                ORDER BY buy_number DESC
                LIMIT 1
                """),
                {"user_id": user_id, "symbol": stock["symbol"]}
            )

            last = result.mappings().first()

            if not last:
                qty = BASE_BUY_QTY
                buy_number = 1
            else:
                last_price = float(last["buy_price"])
                drop = (last_price - price) / last_price * 100

                if drop < 5:
                    return

                qty = int(last["quantity"]) * 2
                buy_number = int(last["buy_number"]) + 1

            investment = qty * price

            db.execute(
                text("""
                INSERT INTO portfolio(
                    user_id, stock_symbol, buy_price, quantity, buy_number, investment, created_at
                )
                VALUES (
                    :user_id, :symbol, :price, :quantity, :buy_number, :investment, :created_at
                )
                """),
                {
                    "user_id": user_id,
                    "symbol": stock["symbol"],
                    "price": price,
                    "quantity": qty,
                    "buy_number": buy_number,
                    "investment": investment,
                    "created_at": datetime.utcnow(),
                }
            )

            db.commit()
        finally:
            db.close()
