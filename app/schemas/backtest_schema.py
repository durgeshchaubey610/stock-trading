from pydantic import BaseModel, Field
from typing import List, Optional

class StrategyRule(BaseModel):
    indicator: str  # "rsi", "sma", "ema", "price"
    operator: str   # "<", ">", "crosses_above", "crosses_below"
    value: float
    indicator_period: Optional[int] = 14

class BacktestRequest(BaseModel):
    symbol: str
    period: str = "1y"  # "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"
    initial_capital: float = 100000.0
    buy_rules: List[StrategyRule]
    sell_rules: List[StrategyRule]
    stop_loss_pct: Optional[float] = None
    take_profit_pct: Optional[float] = None
