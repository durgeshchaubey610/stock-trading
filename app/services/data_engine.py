import yfinance as yf
import pandas as pd
from typing import List, Dict, Optional

def get_stock_data(symbol: str) -> Optional[pd.DataFrame]:
    """Fetches 1 year of daily data for a single symbol."""
    try:
        df = yf.download(
            symbol,
            period="1y",
            interval="1d",
            progress=False,
            auto_adjust=True
        )
        return df
    except Exception:
        return None

def get_batch_stock_data(symbols: List[str]) -> Dict[str, pd.DataFrame]:
    """
    Fetches 1 year of daily data for a list of symbols in a single batch call.
    Returns a dictionary mapping symbol to its DataFrame.
    """
    if not symbols:
        return {}
        
    try:
        data = yf.download(
            symbols,
            period="1y",
            interval="1d",
            progress=False,
            auto_adjust=True,
            group_by='ticker',
            threads=True
        )
        
        result = {}
        # If only one symbol is passed, yfinance might not return a multi-index by ticker
        if len(symbols) == 1:
            result[symbols[0]] = data
            return result
            
        for symbol in symbols:
            if symbol in data.columns.levels[0]:
                ticker_df = data[symbol].dropna(how='all')
                if not ticker_df.empty:
                    result[symbol] = ticker_df
                    
        return result
    except Exception:
        return {}

def get_stock_data_low(symbol: str) -> Optional[dict]:
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

def get_historical_ohlcv(symbol: str, period: str = "1y", interval: str = "1d") -> Optional[pd.DataFrame]:
    """
    Fetches historical OHLCV data for a single symbol.

    Args:
        symbol: Ticker symbol (e.g., 'RELIANCE.NS')
        period: Data period (e.g., '1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max')
        interval: Data interval (e.g., '1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo')
    """
    try:
        df = yf.download(
            symbol,
            period=period,
            interval=interval,
            progress=False,
            auto_adjust=True
        )
        return df
    except Exception:
        return None