from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_sector_benchmarks():
    print("Testing /stocks/benchmarks endpoint (limit=10)...")
    response = client.get("/stocks/benchmarks?limit=10")
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Stocks scanned: {data['stocks_scanned']}")
        print(f"Sectors found: {list(data['benchmarks'].keys())}")
        for sector, bench in data['benchmarks'].items():
            print(f"- {sector}: Avg PE: {bench['avg_pe']}, Stock Count: {bench['stock_count']}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_sector_benchmarks()
