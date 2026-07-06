from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    goal_name = Column(String(200), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(Date, nullable=False)
    category = Column(String(100), nullable=True) # e.g., Retirement, House, Car
    
    created_at = Column(DateTime, default=datetime.utcnow)

class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    provider_name = Column(String(200), nullable=False)
    policy_name = Column(String(200), nullable=False)
    policy_type = Column(String(100), nullable=False) # e.g., Health, Life, Term
    coverage_amount = Column(Float, nullable=False)
    premium_amount = Column(Float, nullable=False)
    premium_frequency = Column(String(50), nullable=False) # e.g., Monthly, Yearly
    renewal_date = Column(Date, nullable=False)
    claim_ratio = Column(Float, nullable=True) # Industry metric for comparison
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AssetLog(Base):
    __tablename__ = "asset_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    asset_name = Column(String(200), nullable=False)
    asset_type = Column(String(100), nullable=False) # e.g., Mutual Funds, Gold, Real Estate, Cash, Pension Funds (EPF/PPF/NPS), Stocks
    value = Column(Float, nullable=False)
    description = Column(String(500), nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class LiabilityLog(Base):
    __tablename__ = "liability_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    liability_name = Column(String(200), nullable=False)
    liability_type = Column(String(100), nullable=False) # e.g., Home Loan, Car Loan, Personal Loan, Credit Card
    total_amount = Column(Float, nullable=False)
    outstanding_amount = Column(Float, nullable=False)
    monthly_payment = Column(Float, default=0.0) # EMIs
    description = Column(String(500), nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class FireProfile(Base):
    __tablename__ = "fire_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    current_age = Column(Integer, default=30)
    retirement_age = Column(Integer, default=55)
    life_expectancy = Column(Integer, default=85)
    
    monthly_expenses_post_retirement = Column(Float, default=40000.0) # in today's currency values
    pre_retirement_cagr = Column(Float, default=12.0)
    post_retirement_cagr = Column(Float, default=7.0)
    inflation_rate = Column(Float, default=6.0)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


