import yfinance as yf

def get_stock_data(symbol):

    df = yf.download(
        symbol,
        period="1y",
        interval="1d",
        progress=False,
        auto_adjust=True
    )

    return df

def get_stock_data_low(symbol):

    df = yf.download(
        symbol,
        period="1y",
        interval="1d",
        progress=False,
        auto_adjust=True
    )

    if df.empty:
        return None

    price = float(df["Close"].iloc[-1].item())
    low52 = float(df["Low"].min().item())

    return {
        "symbol": symbol,
        "price": price,
        "week52_low": low52
    }