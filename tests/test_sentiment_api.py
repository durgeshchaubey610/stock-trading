import time
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.auth import require_premium

# Use a separate test database file
TEST_DB = "./test_sentiment.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Ensure tables are created
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
# Mock require_premium to return a dummy user so DB authentication query is bypassed
app.dependency_overrides[require_premium] = lambda: {"user_id": 1, "username": "sentiment_user", "is_premium": True, "subscription_tier": "premium"}

client = TestClient(app)

def test_stock_sentiment():
    print("Testing /stocks/RELIANCE.NS/sentiment endpoint...")
    start_time = time.time()
    
    response = client.get("/stocks/RELIANCE.NS/sentiment")
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Request completed in {duration:.2f} seconds.")
        print(f"Symbol: {data['symbol']}")
        print(f"Aggregate Sentiment: {data['aggregate_sentiment']} (Score: {data['sentiment_score']})")
        print(f"Article Count: {data['article_count']}")
        
        if data['articles']:
            print("\nTop 3 Articles:")
            for article in data['articles'][:3]:
                print(f"- [{article['sentiment'].upper()}] (Conf: {article['confidence']}) {article['title']}")
                print(f"  Model: {article['model_used']}")
    else:
        print(f"Error: {response.text}")

    engine.dispose()
    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except Exception:
            pass

if __name__ == "__main__":
    test_stock_sentiment()
