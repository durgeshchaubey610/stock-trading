from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime
from app.database import Base
from datetime import datetime

class ScreenerTemplate(Base):
    """
    Model to store user-defined screener filter configurations.
    """
    __tablename__ = "screener_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    name = Column(String(100), index=True)
    description = Column(String(255), nullable=True)
    
    # TEXT structure storing the actual filters (JSON string)
    filters = Column(Text)
    
    is_public = Column(Boolean, default=False)
    
    # Simple upvote counter for community ranking
    upvotes = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
