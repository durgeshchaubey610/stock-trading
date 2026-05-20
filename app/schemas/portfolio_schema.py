from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

class PortfolioCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    stock_symbol: str = Field(min_length=1, max_length=50)
    buy_price: float = Field(gt=0)
    quantity: int = Field(gt=0)
    action: Literal[1, 2]
