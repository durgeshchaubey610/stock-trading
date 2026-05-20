import re
from app.data.nifty500 import nifty500

def detect_tickers(text):

    found = []

    for ticker in nifty500:
        escaped_ticker = re.escape(ticker)
        base_symbol = re.escape(ticker.replace(".NS", ""))

        if re.search(r"\b" + escaped_ticker + r"\b", text, flags=re.IGNORECASE):
            found.append(ticker)
            continue

        if re.search(r"\b" + base_symbol + r"\b", text, flags=re.IGNORECASE):
            found.append(ticker)

    return found
