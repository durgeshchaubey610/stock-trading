from app.strategies.base_strategy import BaseStrategy

class AIStrategy(BaseStrategy):

    def execute(self, stock, user_id):

        rsi = stock.get("rsi", 50)
        macd = stock.get("macd", 0)
        signal = stock.get("macd_signal", 0)

        if rsi < 35 and macd > signal:
            print("AI BUY", stock["symbol"])