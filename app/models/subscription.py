from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # basic, pro, premium
    display_name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    duration_days = Column(Integer, default=30)
    features = Column(Text, nullable=True) # JSON string of features
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

class UserInvoice(Base):
    __tablename__ = "user_invoices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    payment_status = Column(String(20), default="pending") # pending, paid, failed
    payment_id = Column(String(100), nullable=True) # Razorpay payment ID
    order_id = Column(String(100), nullable=True) # Razorpay order ID
    signature = Column(String(255), nullable=True)
    
    billing_email = Column(String(100), nullable=True)
    billing_name = Column(String(100), nullable=True)
    
    invoice_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    plan = relationship("SubscriptionPlan")
