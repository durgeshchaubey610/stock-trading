from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class PaperPortfolio(Base):
    __tablename__ = "paper_portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)
    
    available_cash = Column(Float, default=1000000.0) # Default ₹10L
    invested_amount = Column(Float, default=0.0)
    realized_profit = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PaperPosition(Base):
    __tablename__ = "paper_positions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    stock_symbol = Column(String(50), index=True)
    
    quantity = Column(Integer)
    avg_buy_price = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PaperOrder(Base):
    __tablename__ = "paper_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    stock_symbol = Column(String(50))
    
    quantity = Column(Integer)
    price = Column(Float) # Execution price or target price
    order_type = Column(String(20)) # Market, Limit, Stop Loss, Stop Limit
    action = Column(String(10)) # BUY, SELL
    status = Column(String(20)) # OPEN, COMPLETED, CANCELLED, REJECTED
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PaperTrade(Base):
    __tablename__ = "paper_trades"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("paper_orders.id"))
    user_id = Column(Integer, index=True)
    stock_symbol = Column(String(50))
    
    quantity = Column(Integer)
    execution_price = Column(Float)
    action = Column(String(10)) # BUY, SELL
    
    transaction_date = Column(DateTime, default=datetime.utcnow)

class PaperJournal(Base):
    __tablename__ = "paper_journal"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    stock_symbol = Column(String(50), nullable=True)
    trade_id = Column(Integer, ForeignKey("paper_trades.id"), nullable=True)
    
    notes = Column(Text)
    lessons_learned = Column(Text)
    reasoning = Column(Text) # Why Bought / Why Sold
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
