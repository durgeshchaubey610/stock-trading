import pandas as pd

def scalar(v):
    try:
        return float(v.item())
    except:
        return float(v)

def compute_rsi(close):

    delta = close.diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    rs = gain.rolling(14).mean() / loss.rolling(14).mean()

    rsi = 100 - (100/(1+rs))

    return rsi


def calculate_indicators(df):

    close = df["Close"]
    high = df["High"]
    low = df["Low"]
    volume = df["Volume"]

    ma20 = close.rolling(20).mean()
    ma50 = close.rolling(50).mean()
    ma200 = close.rolling(200).mean()

    rsi = compute_rsi(close)

    ema12 = close.ewm(span=12).mean()
    ema26 = close.ewm(span=26).mean()

    macd = ema12 - ema26
    macd_signal = macd.ewm(span=9).mean()

    std = close.rolling(20).std()

    bb_lower = ma20 - 2 * std

    avg_volume = volume.rolling(20).mean()

    prev_high = high.iloc[-2]

    return {
        "price": scalar(close.iloc[-1]),
        "rsi": scalar(rsi.iloc[-1]),
        "ma20": scalar(ma20.iloc[-1]),
        "ma50": scalar(ma50.iloc[-1]),
        "ma200": scalar(ma200.iloc[-1]),
        "macd": scalar(macd.iloc[-1]),
        "macd_signal": scalar(macd_signal.iloc[-1]),
        "bb_lower": scalar(bb_lower.iloc[-1]),
        "avg_volume": scalar(avg_volume.iloc[-1]),
        "prev_high": scalar(prev_high),
        "volume": scalar(volume.iloc[-1])
    }