from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.database import Base
import datetime

class Alert(Base):
    """
    Model for user-defined price/indicator alerts.
    """
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    
    symbol = Column(String(50), index=True)
    
    # Types: "PRICE_ABOVE", "PRICE_BELOW", "RSI_ABOVE", "RSI_BELOW", "SENTIMENT_BULLISH"
    alert_type = Column(String(50))
    
    # The threshold value to trigger the alert
    threshold_value = Column(Float, nullable=True)
    
    # Status flags
    is_active = Column(Boolean, default=True)
    triggered_at = Column(DateTime, nullable=True)
    
    # Notification preferences
    notify_email = Column(Boolean, default=False)
    notify_webhook = Column(Boolean, default=False)
    webhook_url = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
