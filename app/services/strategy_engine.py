from app.strategies.low52_strategy import Low52Strategy
from app.strategies.rsi_strategy import RSIStrategy
from app.strategies.ai_strategy import AIStrategy

def get_strategy(name):

    strategies = {

        "low52": Low52Strategy(),
        "rsi": RSIStrategy(),
        "ai": AIStrategy()

    }

    return strategies.get(name)