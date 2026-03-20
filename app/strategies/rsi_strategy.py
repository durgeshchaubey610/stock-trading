import ta
from app.strategies.base_strategy import BaseStrategy

class RSIStrategy(BaseStrategy):

    def execute(self, stock, user_id):

        rsi = stock.get("rsi", 50)

        if rsi < 30:
            print("BUY SIGNAL", stock["symbol"])