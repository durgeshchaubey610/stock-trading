from pydantic import BaseModel, HttpUrl
from typing import Optional

class AlertCreate(BaseModel):
    symbol: str
    alert_type: str # e.g., "PRICE_ABOVE", "PRICE_BELOW", "RSI_BELOW", "SENTIMENT_BULLISH"
    threshold_value: Optional[float] = None
    notify_email: bool = False
    notify_webhook: bool = False
    webhook_url: Optional[str] = None

class AlertResponse(AlertCreate):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True
