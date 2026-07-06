from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class StockSector(Base):
    __tablename__ = "stock_sectors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    parent_id = Column(Integer, ForeignKey("stock_sectors.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    parent = relationship("StockSector", remote_side=[id], backref="sub_sectors")
    stocks = relationship("Stock", back_populates="sector_rel")

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    symbol = Column(String(50), unique=True, index=True)
    sector_id = Column(Integer, ForeignKey("stock_sectors.id"), nullable=True)
    sector = Column(String(100))
    sub_sector = Column(String(100))
    market_cap = Column(Float)
    close_price = Column(Float)
    pe_ratio = Column(Float)
    forward_pe_ratio = Column(Float)
    volume = Column(Integer)
    rsi = Column(Float)
    mfi = Column(Float)
    forward_1y_growth = Column(Float)
    ebitda_growth = Column(Float)
    forward_1y_ebitda_growth = Column(Float)
    forward_1y_eps_growth = Column(Float)
    forward_1y_ocf_growth = Column(Float)
    eps_growth = Column(Float)
    is_fno = Column(Integer, default=0)
    
    # Technical Indicators
    sma20 = Column(Float)
    sma50 = Column(Float)
    sma100 = Column(Float)
    sma200 = Column(Float)
    ema20 = Column(Float)
    ema50 = Column(Float)
    ema100 = Column(Float)
    ema200 = Column(Float)
    atr14 = Column(Float)
    macd = Column(Float)
    macd_signal = Column(Float)
    adx = Column(Float)
    roc = Column(Float)
    stoch_rsi = Column(Float)
    supertrend = Column(Float)
    high_52_week = Column(Float)
    low_52_week = Column(Float)
    range_progress = Column(Float) # (Close - Low) / (High - Low) * 100
    delivery_percentage = Column(Float)
    oi_change = Column(Float)
    avg_volume_20d = Column(Float)
    signal = Column(String(20)) # buy, strong buy, normal, strong sale, sale
    
    # Fundamental Indicators
    debt_to_equity = Column(Float, default=0.0)
    roe = Column(Float, default=0.0)
    roce = Column(Float, default=0.0)
    
    # Valuation Metrics
    pb_ratio = Column(Float)
    peg_ratio = Column(Float)
    ev_to_ebitda = Column(Float)
    ev_to_sales = Column(Float)
    price_to_sales = Column(Float)
    dividend_yield = Column(Float)
    enterprise_value = Column(Float)
    earnings_yield = Column(Float)
    
    # Profitability Metrics
    roa = Column(Float)
    ebitda_margin = Column(Float)
    operating_margin = Column(Float)
    gross_margin = Column(Float)
    net_profit_margin = Column(Float)
    
    # Growth Metrics
    revenue_growth_3y = Column(Float)
    revenue_growth_5y = Column(Float)
    profit_growth_3y = Column(Float)
    profit_growth_5y = Column(Float)
    cagr_3y = Column(Float)
    
    # Financial Health
    current_ratio = Column(Float)
    quick_ratio = Column(Float)
    interest_coverage_ratio = Column(Float)
    total_debt = Column(Float)
    total_cash = Column(Float)
    
    # Analyst Ratings & Key Stats
    beta = Column(Float)
    vwap = Column(Float)
    target_price = Column(Float)
    upside_pct = Column(Float)
    recommendation_count = Column(Integer)
    recommendation_key = Column(String(50))
    shares_outstanding = Column(BigInteger) # Note: BIGINT in SQL
    face_value = Column(Float)
    book_value = Column(Float)
    
    # Performance Metrics
    return_1d = Column(Float)
    return_1w = Column(Float)
    return_1m = Column(Float)
    return_1y = Column(Float)
    ytd_return = Column(Float)
    volatility = Column(Float)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    alpha = Column(Float)
    
    # Additional Valuation & Quality
    fcf_yield = Column(Float)
    promoter_pledge_pct = Column(Float)
    
    # Stock holders (Holdings in %)
    promoter_holding = Column(Float)
    fii_holding = Column(Float)
    dii_holding = Column(Float)
    retail_holding = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sector_rel = relationship("StockSector", back_populates="stocks")
    baskets = relationship("BasketStock", back_populates="stock")

class StockBasket(Base):
    __tablename__ = "stock_baskets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    stocks = relationship("BasketStock", back_populates="basket")

class BasketStock(Base):
    __tablename__ = "basket_stocks"

    id = Column(Integer, primary_key=True, index=True)
    basket_id = Column(Integer, ForeignKey("stock_baskets.id"))
    stock_id = Column(Integer, ForeignKey("stocks.id"))

    basket = relationship("StockBasket", back_populates="stocks")
    stock = relationship("Stock", back_populates="baskets")

class StockPriceHistory(Base):
    __tablename__ = "stock_price_history"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    time = Column(DateTime, nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=False)
    period = Column(String(10), nullable=False)
    interval = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    stock = relationship("Stock", backref="history_prices")
