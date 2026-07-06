from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from app.database import Base
from datetime import datetime

class InvestmentBasket(Base):
    """
    Model for 'Smallcases' or curated investment baskets.
    """
    __tablename__ = "investment_baskets"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(100), index=True)
    description = Column(String(255))
    category = Column(String(50), index=True) # e.g., "Thematic", "Sectoral", "Dividend"
    
    # TEXT structure storing the stocks and their weights (JSON string)
    constituents = Column(Text)
    
    risk_level = Column(String(20)) # Low, Moderate, High
    min_investment = Column(Float, default=0.0)
    
    # Creator info (could be an admin or expert user)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
