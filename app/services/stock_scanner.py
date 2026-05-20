import yfinance as yf
from app.data.nifty500 import nifty500


def _to_float(value):
    if hasattr(value, "iloc"):
        value = value.iloc[-1]

    if hasattr(value, "item"):
        try:
            value = value.item()
        except ValueError:
            pass

    if hasattr(value, "iloc"):
        value = value.iloc[-1]

    return float(value)


def scan_stocks():

    stocks = []

    for symbol in nifty500:

        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1y")

        if data.empty:
            continue

        price = data["Close"].tail(1)

        low52 = data["Low"].min()
        high52 = data["High"].max()

        stocks.append({
            "symbol": symbol,
            "price": _to_float(price),
            "week52_low": _to_float(low52),
            "week52_high": _to_float(high52),
            "history": data.reset_index().to_dict(orient="records")
        })

    return stocks
