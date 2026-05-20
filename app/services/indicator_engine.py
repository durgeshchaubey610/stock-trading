import pandas as pd
import ta

def scalar(v):
    try:
        if hasattr(v, 'item'):
            return float(v.item())
        return float(v)
    except:
        return 0.0

def calculate_indicators(df):

    close = df["Close"]
    high = df["High"]
    low = df["Low"]
    volume = df["Volume"]

    # Momentum
    rsi = ta.momentum.RSIIndicator(close=close, window=14).rsi()
    stoch = ta.momentum.StochasticOscillator(high=high, low=low, close=close, window=14, smooth_window=3).stoch()

    # Trend
    macd_obj = ta.trend.MACD(close=close)
    macd = macd_obj.macd()
    macd_signal = macd_obj.macd_signal()
    
    ma20 = ta.trend.SMAIndicator(close=close, window=20).sma_indicator()
    ma50 = ta.trend.SMAIndicator(close=close, window=50).sma_indicator()
    ma200 = ta.trend.SMAIndicator(close=close, window=200).sma_indicator()
    
    adx = ta.trend.ADXIndicator(high=high, low=low, close=close, window=14).adx()

    # Volatility
    bb = ta.volatility.BollingerBands(close=close, window=20, window_dev=2)
    bb_lower = bb.bollinger_lband()
    atr = ta.volatility.AverageTrueRange(high=high, low=low, close=close, window=14).average_true_range()

    # Volume
    avg_volume = volume.rolling(20).mean()

    prev_high = high.iloc[-2]

    return {
        "price": scalar(close.iloc[-1]),
        "rsi": scalar(rsi.iloc[-1]),
        "atr": scalar(atr.iloc[-1]),
        "adx": scalar(adx.iloc[-1]),
        "stoch": scalar(stoch.iloc[-1]),
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