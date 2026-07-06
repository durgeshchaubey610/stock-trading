import yfinance as yf
import json

def check_info(symbol):
    ticker = yf.Ticker(symbol)
    info = ticker.info
    print(json.dumps(info, indent=2))

if __name__ == "__main__":
    check_info("RELIANCE.NS")
