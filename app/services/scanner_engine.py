from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
from typing import List, Dict, Optional
import pandas as pd
import time

from app.data.nifty500 import nifty500
from app.services.data_engine import get_stock_data, get_batch_stock_data
from app.services.indicator_engine import calculate_indicators
from app.services.signal_engine import generate_signals

logger = logging.getLogger(__name__)


def _qualifies(signals):
    true_count = sum(1 for value in signals.values() if value)
    return true_count >= 3


def _calculate_score(signals):
    score = 0
    if signals["strong_buy"]:
        score += 3
    if signals["breakout"]:
        score += 3
    if signals["swing_trade"]:
        score += 2
    if signals["volume_spike"]:
        score += 2
    return score


from app.services.price_service import PriceService

def scan_stock(symbol: str, df: Optional[pd.DataFrame] = None, fundamental_data: Optional[dict] = None):
    """
    Scans a single stock for signals.
    Optionally accepts pre-fetched technical and fundamental data.
    """
    try:
        if df is None:
            df = get_stock_data(symbol)

        if df is None or len(df) < 200:
            return None

        indicators = calculate_indicators(df)
        signals = generate_signals(indicators)

        if not _qualifies(signals):
            return None

        score = _calculate_score(signals)

        result = {
            "symbol": symbol,
            "price": indicators["price"],
            "rsi": indicators["rsi"],
            "atr": indicators["atr"],
            "adx": indicators["adx"],
            "stoch": indicators["stoch"],
            "signals": signals,
            "score": score
        }

        if fundamental_data:
            result.update({
                "market_cap": fundamental_data.get("market_cap"),
                "pe_ratio": fundamental_data.get("pe_ratio"),
                "dividend_yield": fundamental_data.get("dividend_yield"),
                "sector": fundamental_data.get("sector"),
                "industry": fundamental_data.get("industry")
            })

        return result

    except Exception:
        # Use info instead of exception to keep logs clean during high-volume scanning
        logger.debug("Scanner failed for symbol=%s", symbol)
        return None


def run_scanner(fetch_fundamentals: bool = True):
    """
    Runs the scanner for all Nifty 500 stocks.
    Uses parallel batch data fetching and parallel processing.
    """
    start_time = time.time()
    results = []
    chunk_size = 250
    symbols = nifty500
    
    all_batch_data = {}
    all_fundamentals = {}
    
    # 1. Fetch data in parallel chunks
    logger.info("Starting parallel data fetching...")
    with ThreadPoolExecutor(max_workers=2) as download_executor:
        future_to_chunk = {
            download_executor.submit(get_batch_stock_data, symbols[i : i + chunk_size]): i 
            for i in range(0, len(symbols), chunk_size)
        }
        for future in as_completed(future_to_chunk):
            all_batch_data.update(future.result())
            
    if fetch_fundamentals:
        # Fetching fundamentals for all 500 is slow. 
        # For this task, we'll fetch them in parallel chunks.
        logger.info("Starting parallel fundamental data fetching...")
        fund_chunk_size = 50
        with ThreadPoolExecutor(max_workers=5) as fund_executor:
            future_to_fund = {
                fund_executor.submit(PriceService.get_batch_fundamentals, symbols[i : i + fund_chunk_size]): i
                for i in range(0, len(symbols), fund_chunk_size)
            }
            for future in as_completed(future_to_fund):
                all_fundamentals.update(future.result())

    fetch_time = time.time() - start_time
    logger.info(f"Data fetching (technical + fundamental) completed in {fetch_time:.2f}s")
    
    # 2. Process stocks in parallel
    logger.info("Starting parallel processing...")
    with ThreadPoolExecutor(max_workers=20) as process_executor:
        future_to_stock = {
            process_executor.submit(scan_stock, symbol, all_batch_data.get(symbol), all_fundamentals.get(symbol)): symbol 
            for symbol in symbols
        }
        for future in as_completed(future_to_stock):
            res = future.result()
            if res:
                results.append(res)

    results.sort(key=lambda x: x["score"], reverse=True)
    total_time = time.time() - start_time
    logger.info(f"Scanner total execution: {total_time:.2f}s")
    
    return results
