import yfinance as yf
import logging
from typing import List, Dict, Optional
from datetime import datetime
import pandas as pd

logger = logging.getLogger(__name__)

class PriceService:
    """
    Service for fetching real-time stock prices.
    Designed to be extensible for multiple providers.
    """
    
    @staticmethod
    def get_latest_prices(symbols: List[str]) -> Dict[str, float]:
        """
        Fetches the latest closing price for a list of symbols.
        Uses Yahoo Finance for now.
        """
        if not symbols:
            return {}
            
        try:
            # Fetching only 1 day of data is much faster than 1 year
            data = yf.download(
                symbols,
                period="1d",
                interval="1m", # 1 minute interval for more precision if available
                progress=False,
                threads=True
            )
            
            prices = {}
            
            # Handle multi-index if multiple symbols, or single DataFrame if one symbol
            if len(symbols) == 1:
                symbol = symbols[0]
                if not data.empty:
                    val = data["Close"].iloc[-1]
                    if hasattr(val, "item"):
                        prices[symbol] = float(val.item())
                    else:
                        prices[symbol] = float(val)
                return prices
                
            for symbol in symbols:
                if symbol in data["Close"].columns:
                    ticker_data = data["Close"][symbol].dropna()
                    if not ticker_data.empty:
                        val = ticker_data.iloc[-1]
                        if hasattr(val, "item"):
                            prices[symbol] = float(val.item())
                        else:
                            prices[symbol] = float(val)
                        
            return prices
            
        except Exception as e:
            logger.error(f"Failed to fetch latest prices: {e}")
            return {}

    @staticmethod
    def get_index_performance(index_symbol: str, start_date: datetime) -> float:
        """
        Calculates the percentage return of an index since a specific start date.
        """
        try:
            # Format start_date as YYYY-MM-DD string to avoid yfinance parsing issues with time
            start_str = start_date.strftime("%Y-%m-%d")
            data = yf.download(index_symbol, start=start_str, progress=False)
            if data.empty:
                print(f"DEBUG: Index data empty for {index_symbol} since {start_str}")
                return 0.0
            
            print(f"DEBUG: Index data rows: {len(data)}")
            
            # Flatten if multi-index
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = data.columns.get_level_values(0)
                
            first_price = float(data["Close"].iloc[0])
            last_price = float(data["Close"].iloc[-1])
            
            return ((last_price - first_price) / first_price) * 100
        except Exception:
            return 0.0

    @staticmethod
    def get_batch_fundamentals(symbols: List[str]) -> Dict[str, dict]:
        """
        Fetches fundamental data for a list of symbols in parallel.
        Returns a dictionary mapping symbol to its fundamental metrics.
        """
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        def fetch_info(symbol):
            try:
                t = yf.Ticker(symbol)
                # We only need a few keys to keep it fast
                info = t.info
                return symbol, {
                    "market_cap": info.get("marketCap"),
                    "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
                    "dividend_yield": info.get("dividendYield", 0) * 100 if info.get("dividendYield") else 0,
                    "sector": info.get("sector"),
                    "industry": info.get("industry")
                }
            except Exception:
                return symbol, None

        fundamentals = {}
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_symbol = {executor.submit(fetch_info, s): s for s in symbols}
            for future in as_completed(future_to_symbol):
                symbol, data = future.result()
                if data:
                    fundamentals[symbol] = data
        return fundamentals

    @staticmethod
    def get_quote(symbol: str) -> Optional[dict]:
        """
        Fetches a detailed quote for a single symbol.
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            return {
                "symbol": symbol,
                "price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "open": info.get("open"),
                "high": info.get("dayHigh"),
                "low": info.get("dayLow"),
                "volume": info.get("volume"),
                "prev_close": info.get("previousClose"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
            }
        except Exception:
            return None
