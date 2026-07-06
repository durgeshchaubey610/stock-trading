from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import json

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.basket import InvestmentBasket

# IMPORT ALL MODELS to register with Base
from app.models.screener_template import ScreenerTemplate
from app.models.alert import Alert

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_baskets.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_investment_baskets():
    if os.path.exists("./test_baskets.db"):
        os.remove("./test_baskets.db")
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    # Create user
    user = User(username="expert_user", email="expert@test.com", password="pwd")
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Mock auth
    from app.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"user_id": user.id, "username": user.username}

    print("1. Creating an investment basket...")
    payload = {
        "name": "Top Bluechips",
        "description": "A collection of 3 largest Indian stocks",
        "category": "Thematic",
        "constituents": [
            {"symbol": "RELIANCE.NS", "weight": 40.0},
            {"symbol": "TCS.NS", "weight": 30.0},
            {"symbol": "HDFCBANK.NS", "weight": 30.0}
        ],
        "risk_level": "Low",
        "min_investment": 50000.0
    }
    response = client.post("/baskets", json=payload)
    if response.status_code != 200:
        print(f"Error: {response.text}")
        assert False
        
    basket_data = response.json()
    print(f"Created Basket: {basket_data['name']}, ID: {basket_data['id']}")
    
    print("\n2. Listing baskets...")
    list_res = client.get("/baskets")
    assert list_res.status_code == 200
    print(f"Baskets found: {len(list_res.json())}")
    
    print("\n3. Fetching basket details with live prices...")
    detail_res = client.get(f"/baskets/{basket_data['id']}")
    assert detail_res.status_code == 200
    details = detail_res.json()
    print(f"Basket Details: {details['name']}")
    for c in details["constituents"]:
        print(f"- {c['symbol']}: Weight {c['weight']}%, Current Price: {c['current_price']}")

    print("\nInvestment Baskets Test Passed!")
    db.close()
    engine.dispose()

if __name__ == "__main__":
    test_investment_baskets()
