import time
import logging
from app.services.scanner_engine import run_scanner
from app.data.nifty500 import nifty500

# Setup logging to see progress
logging.basicConfig(level=logging.INFO)

def test_scanner_performance():
    print("Starting scanner performance test...")
    start_time = time.time()
    
    # We'll use a smaller subset for the test to avoid long wait, 
    # but the optimized version should handle it fast.
    # Actually, let's run it on the full list to see if it meets the < 5s requirement or at least improves significantly.
    
    results = run_scanner()
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"Scanner completed in {duration:.2f} seconds.")
    print(f"Found {len(results)} stocks matching signals.")
    
    if results:
        print("Top 5 results:")
        for r in results[:5]:
            print(f"- {r['symbol']}: Score {r['score']}, Price {r['price']}")

if __name__ == "__main__":
    test_scanner_performance()
