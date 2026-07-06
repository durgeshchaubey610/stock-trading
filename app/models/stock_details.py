from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class StockFinancials(Base):
    __tablename__ = "stock_financials"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), unique=True)
    
    roe = Column(Float)
    roce = Column(Float)
    roa = Column(Float)
    ebitda_margin = Column(Float)
    operating_margin = Column(Float)
    gross_margin = Column(Float)
    net_profit_margin = Column(Float)
    debt_to_equity = Column(Float)
    interest_coverage_ratio = Column(Float)
    current_ratio = Column(Float)
    quick_ratio = Column(Float)
    total_debt = Column(Float)
    total_cash = Column(Float)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    stock = relationship("Stock", backref="financials")

class StockGrowth(Base):
    __tablename__ = "stock_growth"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), unique=True)
    
    revenue_growth_3y = Column(Float)
    revenue_growth_5y = Column(Float)
    ebitda_growth_3y = Column(Float)
    ebitda_growth_5y = Column(Float)
    eps_growth_3y = Column(Float)
    eps_growth_5y = Column(Float)
    profit_growth_3y = Column(Float)
    profit_growth_5y = Column(Float)
    forward_1y_revenue_growth = Column(Float)
    forward_1y_ebitda_growth = Column(Float)
    forward_1y_eps_growth = Column(Float)
    forward_1y_ocf_growth = Column(Float)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    stock = relationship("Stock", backref="growth")

class StockValuation(Base):
    __tablename__ = "stock_valuation"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), unique=True)
    
    pe_ratio = Column(Float)
    forward_pe_ratio = Column(Float)
    pb_ratio = Column(Float)
    peg_ratio = Column(Float)
    ev_to_ebitda = Column(Float)
    ev_to_sales = Column(Float)
    price_to_sales = Column(Float)
    dividend_yield = Column(Float)
    enterprise_value = Column(Float)
    intrinsic_value = Column(Float)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    stock = relationship("Stock", backref="valuation")

class StockOwnership(Base):
    __tablename__ = "stock_ownership"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    
    promoter_holding = Column(Float)
    fii_holding = Column(Float)
    dii_holding = Column(Float)
    mf_holding = Column(Float)
    retail_holding = Column(Float)
    public_holding = Column(Float)
    
    # Historical tracking
    period = Column(String(50)) # e.g., "Mar 2026"
    promoter_change_3m = Column(Float)
    promoter_change_6m = Column(Float)
    promoter_change_1y = Column(Float)
    
    updated_at = Column(DateTime, default=datetime.utcnow)
    stock = relationship("Stock", backref="ownership")

class StockTechnicals(Base):
    __tablename__ = "stock_technicals"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), unique=True)
    
    rsi = Column(Float)
    mfi = Column(Float)
    macd = Column(Float)
    macd_signal = Column(Float)
    vwap = Column(Float)
    obv = Column(Float)
    atr = Column(Float)
    beta = Column(Float)
    adx = Column(Float)
    williams_r = Column(Float)
    stochastic_k = Column(Float)
    stochastic_d = Column(Float)
    bollinger_high = Column(Float)
    bollinger_low = Column(Float)
    
    # Moving Averages
    sma20 = Column(Float)
    sma50 = Column(Float)
    sma100 = Column(Float)
    sma200 = Column(Float)
    ema20 = Column(Float)
    ema50 = Column(Float)
    ema100 = Column(Float)
    ema200 = Column(Float)
    
    signal = Column(String(50)) # Strong Buy, Buy, etc.
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    stock = relationship("Stock", backref="technicals")

class StockScores(Base):
    __tablename__ = "stock_scores"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), unique=True)
    
    fundamental_score = Column(Integer)
    growth_score = Column(Integer)
    value_score = Column(Integer)
    quality_score = Column(Integer)
    momentum_score = Column(Integer)
    risk_score = Column(Integer)
    ownership_score = Column(Integer)
    intrinsic_value_score = Column(Integer)
    
    overall_score = Column(Integer)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    stock = relationship("Stock", backref="scores")

class StockForecasts(Base):
    __tablename__ = "stock_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), unique=True)
    
    buy_pct = Column(Float)
    hold_pct = Column(Float)
    sell_pct = Column(Float)
    analyst_count = Column(Integer)
    consensus_rating = Column(String(100))
    target_mean = Column(Float)
    target_high = Column(Float)
    target_low = Column(Float)
    upside_pct = Column(Float)
    
    # Estimates
    rev_estimate = Column(BigInteger)
    ebitda_estimate = Column(BigInteger)
    eps_estimate = Column(Float)
    profit_estimate = Column(BigInteger)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    stock = relationship("Stock", backref="forecasts")

class StockNews(Base):
    __tablename__ = "stock_news"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    
    title = Column(String(500))
    summary = Column(Text)
    source = Column(String(100))
    url = Column(String(1000))
    sentiment = Column(String(20)) # bullish, bearish, neutral
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    stock = relationship("Stock", backref="news")

class StockEvents(Base):
    __tablename__ = "stock_events"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    
    event_type = Column(String(100)) # Earnings, Dividend, Split, Bonus, AGM
    title = Column(String(500))
    event_date = Column(DateTime)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    stock = relationship("Stock", backref="events")
