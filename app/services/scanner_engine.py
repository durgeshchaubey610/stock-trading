from concurrent.futures import ThreadPoolExecutor
import logging

from app.data.nifty500 import nifty500
from app.services.data_engine import get_stock_data
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


def scan_stock(symbol):

    try:

        df = get_stock_data(symbol)

        if df is None or len(df) < 200:
            return None

        indicators = calculate_indicators(df)

        signals = generate_signals(indicators)

        if not _qualifies(signals):
            return None

        score = _calculate_score(signals)

        return {
            "symbol": symbol,
            "price": indicators["price"],
            "rsi": indicators["rsi"],
            "atr": indicators["atr"],
            "adx": indicators["adx"],
            "stoch": indicators["stoch"],
            "signals": signals,
            "score": score
        }

    except Exception:
        logger.exception("Scanner failed for symbol=%s", symbol)
        return None


def run_scanner():

    results = []

    with ThreadPoolExecutor(max_workers=20) as executor:

        data = executor.map(scan_stock, nifty500)

    for stock in data:

        if stock:
            results.append(stock)

    results.sort(key=lambda x: x["score"], reverse=True)

    return results
