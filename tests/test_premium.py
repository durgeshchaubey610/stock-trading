import os
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models.user import User

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_premium.db"

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

def test_premium_gating():
    # Clear overrides to avoid pollution
    app.dependency_overrides.clear()
    app.dependency_overrides[get_db] = override_get_db
    
    if os.path.exists("./test_premium.db"):
        os.remove("./test_premium.db")
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    unique_user = f"user_{uuid.uuid4().hex[:6]}"
    # Create user (Free by default)
    user = User(username=unique_user, email=f"{unique_user}@user.com", password="pwd")
    db.add(user)
    db.commit()
    db.refresh(user)
    user_id = user.id
    user_username = user.username
    db.close() 

    # Mock auth
    from app.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"user_id": user_id, "username": user_username}

    client = TestClient(app)
    
    print(f"1. Testing gated endpoint as Free user ({user_username})...")
    # Sentiment is premium
    response = client.get("/stocks/RELIANCE.NS/sentiment")
    print(f"Free User Response: {response.status_code} - {response.json().get('detail', '')}")
    assert response.status_code == 403
    
    print("\n2. Upgrading to Premium...")
    # Use the /profile/upgrade endpoint
    upgrade_res = client.post(f"/profile/upgrade?tier=premium")
    assert upgrade_res.status_code == 200
    
    print("\n3. Testing gated endpoint as Premium user...")
    response2 = client.get("/stocks/RELIANCE.NS/sentiment")
    print(f"Premium User Response Status: {response2.status_code}")
    # Should NOT be 403. Might be 200 or 404 if news not found, but NOT 403.
    assert response2.status_code != 403
    
    print("\nPremium Gating Test Passed!")
    app.dependency_overrides.clear()
    engine.dispose()

if __name__ == "__main__":
    test_premium_gating()
