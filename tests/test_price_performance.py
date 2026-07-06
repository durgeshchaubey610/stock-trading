import time
import logging
from app.services.price_service import PriceService
from app.data.nifty500 import nifty500

# Setup logging
logging.basicConfig(level=logging.INFO)

def test_price_service_performance():
    print("Starting PriceService performance test (latest prices only)...")
    start_time = time.time()
    
    # Test with all 500 stocks
    prices = PriceService.get_latest_prices(nifty500)
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"Fetched {len(prices)} prices in {duration:.2f} seconds.")
    
    if prices:
        print("First 5 prices:")
        for symbol in list(prices.keys())[:5]:
            print(f"- {symbol}: {prices[symbol]}")

if __name__ == "__main__":
    test_price_service_performance()
