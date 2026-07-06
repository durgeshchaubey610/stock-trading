from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.alert import Alert
from app.services.paper_trading_service import PaperTradingService

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def setup_test_data():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Create a test user
    slug = str(uuid.uuid4())[:8]
    user = User(username="test_public", email="test@public.com", password="pwd", is_public=True, profile_slug=slug)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create private user
    private_user = User(username="test_private", email="private@test.com", password="pwd", is_public=False, profile_slug="private_slug")
    db.add(private_user)
    db.commit()
    db.refresh(private_user)

    # Add portfolio data via Paper Trading Service
    PaperTradingService.place_order(
        db, user.id, "RELIANCE.NS", 10, 2500.0, "Market", "BUY"
    )
    db.close()
    return slug

def test_public_portfolio_access():
    slug = setup_test_data()
    print(f"Testing access to public profile: {slug}")
    
    # 1. Test public access
    from app.routes.profile_routes import get_public_portfolio
    db = TestingSessionLocal()
    
    data = get_public_portfolio(slug, db)
    print(f"Response: {data['username']} - Portfolio Value: {data['portfolio_data']['summary']['current_value']}")
    assert data["username"] == "test_public"
    assert "RELIANCE.NS" in str(data["portfolio_data"])
    
    # 2. Test private access denied
    print("Testing access to private profile...")
    try:
        get_public_portfolio("private_slug", db)
        assert False, "Should have raised exception"
    except Exception as e:
        assert "private" in str(e).lower()
        print(f"Response correctly denied: {e}")
        
    db.close()
    
    print("\nPublic Portfolio Tracking Test Passed!")

if __name__ == "__main__":
    test_public_portfolio_access()
