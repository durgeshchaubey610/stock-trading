import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.daily_pick import DailyPick
from app.models.stock import Stock
from datetime import datetime

# Setup SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_daily_pick_model(db):
    # 1. Create a stock first
    stock = Stock(symbol="RELIANCE.NS", name="Reliance Industries", close_price=2500.0)
    db.add(stock)
    db.commit()
    db.refresh(stock)

    # 2. Create a daily pick
    pick = DailyPick(
        stock_id=stock.id,
        position="call",
        entry=2500.0,
        target=2600.0,
        stop_loss=2450.0
    )
    db.add(pick)
    db.commit()
    db.refresh(pick)

    # 3. Verify
    assert pick.id is not None
    assert pick.stock_id == stock.id
    assert pick.position == "call"
    assert pick.entry == 2500.0
    assert pick.target == 2600.0
    assert pick.stop_loss == 2450.0
    assert pick.stock.symbol == "RELIANCE.NS"

def test_daily_picks_endpoint_logic(db):
    # Mock some data
    stock1 = Stock(symbol="SBIN.NS", name="State Bank of India", close_price=600.0)
    stock2 = Stock(symbol="TCS.NS", name="TCS", close_price=3500.0)
    db.add_all([stock1, stock2])
    db.commit()

    pick1 = DailyPick(stock_id=stock1.id, position="call", entry=600.0, target=620.0, stop_loss=590.0)
    pick2 = DailyPick(stock_id=stock2.id, position="put", entry=3500.0, target=3400.0, stop_loss=3550.0)
    db.add_all([pick1, pick2])
    db.commit()

    # Verify retrieval
    picks = db.query(DailyPick).all()
    assert len(picks) == 2
    symbols = [p.stock.symbol for p in picks]
    assert "SBIN.NS" in symbols
    assert "TCS.NS" in symbols
