import os
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models.user import User

# Use a separate test database file
TEST_DB = "./test_auth.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB}"

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

def test_registration_and_login():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    Base.metadata.create_all(bind=engine)

    unique_suffix = str(uuid.uuid4())[:8]
    test_user = {
        "username": f"testuser_{unique_suffix}",
        "email": f"test_{unique_suffix}@example.com",
        "password": "strongpassword123"
    }

    print(f"\n1. Testing Registration for {test_user['email']}...")
    reg_res = client.post("/auth/register", json=test_user)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["status"] == "success"
    # New user should have premium trial
    assert reg_data["user"]["is_premium"] is True
    assert reg_data["user"]["subscription_tier"] == "premium"
    assert reg_data["user"]["subscription_expiry"] is not None

    print("\n2. Testing Login...")
    login_payload = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    login_res = client.post("/auth/login", json=login_payload)
    assert login_res.status_code == 200
    
    login_data = login_res.json()
    assert login_data["status"] == "success"
    assert "token" in login_data
    
    user_info = login_data["user"]
    print(f"Login Response User Info: {user_info}")
    
    assert user_info["email"] == test_user["email"]
    assert user_info["is_premium"] is True
    assert user_info["subscription_tier"] == "premium"
    assert "subscription_expiry" in user_info

    print("\n3. Testing Login with WRONG password...")
    wrong_payload = {
        "email": test_user["email"],
        "password": "wrongpassword"
    }
    wrong_res = client.post("/auth/login", json=wrong_payload)
    assert wrong_res.status_code == 401
    assert wrong_res.json()["detail"] == "Invalid credentials"

    print("\nAuth API Tests Passed Successfully!")
    engine.dispose()

if __name__ == "__main__":
    test_registration_and_login()
