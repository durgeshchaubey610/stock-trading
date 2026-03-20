import yfinance as yf
from app.data.nifty500 import nifty500

def scan_stocks():

    stocks = []

    for symbol in nifty500:

        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1y")

        price = data["Close"].tail(1)

        low52 = data["Low"].min()
        high52 = data["High"].max()

        stocks.append({
            "symbol": symbol,
            "price": float(price.iloc[0]),
            "week52_low": float(low52),
            "week52_high": float(high52),
            "history": data.reset_index().to_dict(orient="records")
        })

    return stocks