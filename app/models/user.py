from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date
from app.database import Base
import uuid
from datetime import datetime

def generate_uuid():
    return str(uuid.uuid4())[:8] # Short unique slug

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True)
    email = Column(String(100), unique=True)
    password = Column(String(255))
    date_of_birth = Column(Date, nullable=True)

    # Social features
    is_public = Column(Boolean, default=False)
    profile_slug = Column(String(50), unique=True, default=generate_uuid)

    # Premium features
    is_premium = Column(Boolean, default=False)
    subscription_tier = Column(String(20), default="free") # free, pro, premium
    subscription_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)