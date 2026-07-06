from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class BasketConstituent(BaseModel):
    symbol: str
    weight: float # percentage, e.g., 25.5

class InvestmentBasketBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: str = Field(..., max_length=255)
    category: str = Field(..., max_length=50)
    constituents: List[BasketConstituent]
    risk_level: str # Low, Moderate, High
    min_investment: float = 0.0

class InvestmentBasketCreate(InvestmentBasketBase):
    pass

class InvestmentBasketResponse(InvestmentBasketBase):
    id: int
    creator_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
