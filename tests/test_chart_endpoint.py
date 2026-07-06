from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_stock_chart_endpoint():
    print("Testing /stocks/RELIANCE.NS/chart endpoint (1mo, 1d)...")
    response = client.get("/stocks/RELIANCE.NS/chart?period=1mo&interval=1d")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Data points count: {len(data['data'])}")
        if len(data['data']) > 0:
            print(f"First data point: {data['data'][0]}")

    print("\nTesting /stocks/RELIANCE.NS/chart endpoint (5d, 60m)...")
    response = client.get("/stocks/RELIANCE.NS/chart?period=5d&interval=60m")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Data points count: {len(data['data'])}")
        if len(data['data']) > 0:
            print(f"First data point: {data['data'][0]}")

if __name__ == "__main__":
    test_stock_chart_endpoint()
