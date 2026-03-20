from concurrent.futures import ThreadPoolExecutor

from app.data.nifty500 import nifty500
from app.services.data_engine import get_stock_data
from app.services.indicator_engine import calculate_indicators
from app.services.signal_engine import generate_signals
from app.services.ai_engine import calculate_score, predict_probability


def scan_stock(symbol):

    try:

        df = get_stock_data(symbol)

        if df is None or len(df) < 200:
            return None

        indicators = calculate_indicators(df)

        signals = generate_signals(indicators)

        probability = predict_probability(df)

        score = calculate_score(indicators, signals)

        return {
            "symbol": symbol,
            "price": indicators["price"],
            "rsi": indicators["rsi"],
            "probability_up": probability,
            "signals": signals,
            "score": score
        }

    except Exception as e:

        print(symbol, e)

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