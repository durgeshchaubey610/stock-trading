import asyncio
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.alert import Alert
from app.schemas.alert_schema import AlertCreate
from app.services.alert_service import AlertService

# Setup logging
logging.basicConfig(level=logging.INFO)

# In-memory DB for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

import pytest

@pytest.mark.asyncio
async def test_alert_system():
    db = SessionLocal()
    user_id = 1
    
    print("1. Creating alerts...")
    # Price alert (RELIANCE is > 2000, so 1000 should trigger immediately)
    alert1 = AlertService.create_alert(db, user_id, AlertCreate(
        symbol="RELIANCE.NS",
        alert_type="PRICE_ABOVE",
        threshold_value=1000.0,
        notify_email=True
    ))
    
    # Sentiment alert
    alert2 = AlertService.create_alert(db, user_id, AlertCreate(
        symbol="HDFCBANK.NS",
        alert_type="SENTIMENT_BULLISH"
    ))
    
    # RSI alert (High threshold so it probably won't trigger, proving it works)
    alert3 = AlertService.create_alert(db, user_id, AlertCreate(
        symbol="TCS.NS",
        alert_type="RSI_ABOVE",
        threshold_value=99.0 
    ))

    alerts = AlertService.get_user_alerts(db, user_id)
    print(f"Total active alerts created: {len(alerts)}")
    
    print("\n2. Evaluating alerts...")
    await AlertService.evaluate_alerts(db)
    
    print("\n3. Checking alert status post-evaluation...")
    # Refresh from DB
    a1 = db.query(Alert).filter(Alert.id == alert1.id).first()
    a2 = db.query(Alert).filter(Alert.id == alert2.id).first()
    a3 = db.query(Alert).filter(Alert.id == alert3.id).first()
    
    print(f"Alert 1 (PRICE_ABOVE 1000) Active: {a1.is_active}")
    print(f"Alert 2 (SENTIMENT_BULLISH) Active: {a2.is_active}")
    print(f"Alert 3 (RSI_ABOVE 99) Active: {a3.is_active}")
    
    assert a1.is_active == False, "Alert 1 should have triggered"
    assert a3.is_active == True, "Alert 3 should NOT have triggered"
    
    print("\nAlert System Test Passed!")
    db.close()

if __name__ == "__main__":
    asyncio.run(test_alert_system())
