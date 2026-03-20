import re
from app.data.nifty500 import nifty500

def detect_tickers(text):

    found = []

    for ticker in nifty500:

        if re.search(r'\b' + ticker + r'\b', text):
            found.append(ticker)

    return found