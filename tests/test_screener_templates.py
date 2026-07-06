import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import json

# IMPORT MODELS FIRST to register with Base
from app.database import Base, get_db
from app.models.user import User
from app.models.screener_template import ScreenerTemplate
from app.models.alert import Alert

from app.main import app

# Use a separate test database file
TEST_DB = "./test_trading.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Ensure models are known and table created
if os.path.exists(TEST_DB):
    os.remove(TEST_DB)
Base.metadata.create_all(bind=engine)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_screener_templates():
    db = TestingSessionLocal()
    # Create user
    user = User(username="template_user", email="temp@user.com", password="pwd")
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Mock authentication
    from app.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"user_id": user.id, "username": user.username}

    print("1. Creating personal template...")
    payload = {
        "name": "High Growth Low PE",
        "description": "Looking for undervalued growth stocks",
        "filters": {"pe_ratio": {"max": 20}, "market_cap": {"min": 5000}},
        "is_public": False
    }
    response = client.post("/templates", json=payload)
    if response.status_code != 200:
        print(f"Error creating template: {response.text}")
        assert False
        
    template_data = response.json()
    print(f"Created Template ID: {template_data['id']}, Name: {template_data['name']}")
    
    print("\n2. Making template public and upvoting...")
    # Update to public
    update_res = client.put(f"/templates/{template_data['id']}", json={"is_public": True})
    assert update_res.status_code == 200
    
    # Upvote
    upvote_res = client.post(f"/templates/{template_data['id']}/upvote")
    assert upvote_res.status_code == 200
    print(f"Upvoted. Current votes: {upvote_res.json()['upvotes']}")
    
    print("\n3. Fetching community templates...")
    community_res = client.get("/templates/community?sort_by=upvotes")
    assert community_res.status_code == 200
    community_data = community_res.json()
    print(f"Community templates found: {len(community_data)}")
    assert len(community_data) > 0
    assert community_data[0]["name"] == "High Growth Low PE"
    
    print("\nScreener Templates Test Passed!")
    db.close()
    engine.dispose()

if __name__ == "__main__":
    test_screener_templates()
