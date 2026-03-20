from datetime import datetime
from app.strategies.base_strategy import BaseStrategy
from app.database import SessionLocal
from app.config import BASE_BUY_QTY, MARKET_BUY_TIME

class Low52Strategy(BaseStrategy):

    def execute(self, stock, user_id):

        db = SessionLocal()

        price = stock["price"]
        week_low = stock["week52_low"]

        now = datetime.now()

        if now.hour < MARKET_BUY_TIME:
            return

        result = db.execute(
            "SELECT * FROM portfolio WHERE user_id=%s AND stock_symbol=%s ORDER BY buy_number DESC LIMIT 1",
            (user_id, stock["symbol"])
        )

        last = result.fetchone()

        if not last:

            qty = BASE_BUY_QTY
            buy_number = 1

        else:

            last_price = last.buy_price

            drop = (last_price - price) / last_price * 100

            if drop < 5:
                return

            qty = last.quantity * 2
            buy_number = last.buy_number + 1

        investment = qty * price

        db.execute(
            "INSERT INTO portfolio(user_id,stock_symbol,buy_price,quantity,buy_number,investment,created_at) VALUES (%s,%s,%s,%s,%s,%s,NOW())",
            (user_id, stock["symbol"], price, qty, buy_number, investment)
        )

        db.commit()