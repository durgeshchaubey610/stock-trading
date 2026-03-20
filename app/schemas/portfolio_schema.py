from pydantic import BaseModel

class PortfolioCreate(BaseModel):
    stock_symbol: str
    buy_price: float
    quantity: int
    buy_number: int
    action: int