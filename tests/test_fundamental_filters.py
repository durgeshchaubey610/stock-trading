import time
import logging
from app.services.scanner_engine import run_scanner

# Setup logging
logging.basicConfig(level=logging.INFO)

def test_fundamental_filters():
    print("Starting scanner with fundamental data filters test...")
    start_time = time.time()
    
    # Run scanner for a smaller set for verification if needed, 
    # but let's test the full capability on a subset of Nifty 500 first to be fast.
    from app.data.nifty500 import nifty500
    
    # Overriding nifty500 for a quick test
    import app.services.scanner_engine
    original_nifty = app.services.scanner_engine.nifty500
    app.services.scanner_engine.nifty500 = original_nifty[:20]
    
    try:
        results = run_scanner(fetch_fundamentals=True)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Scanner completed in {duration:.2f} seconds for 20 stocks.")
        print(f"Found {len(results)} stocks matching technical signals.")
        
        if results:
            print("Results with Fundamentals:")
            for r in results:
                print(f"- {r['symbol']}: Score {r['score']}")
                print(f"  PE: {r.get('pe_ratio')}, Market Cap: {r.get('market_cap')}, Div Yield: {r.get('dividend_yield')}%")
                print(f"  Sector: {r.get('sector')}, Industry: {r.get('industry')}")
    finally:
        # Restore original list
        app.services.scanner_engine.nifty500 = original_nifty

if __name__ == "__main__":
    test_fundamental_filters()
