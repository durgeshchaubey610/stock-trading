from fastapi import APIRouter
from app.services.stock_scanner import scan_stocks
from app.services.strategy_engine import get_strategy

router = APIRouter()

@router.get("/test-strategy")
def test_strategy():

    stocks = scan_stocks()

    strategy = get_strategy("low52")

    signals = []

    for stock in stocks:

        result = strategy.execute(stock, user_id=0)

        if result:
            signals.append(result)

    return {
        "strategy": "52 Week Low",
        "signals": signals
    }