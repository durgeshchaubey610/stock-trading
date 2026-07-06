import logging

logger = logging.getLogger(__name__)

class SignalEngine:
    @staticmethod
    def calculate_ai_signal(stock_data, sentiment_score=0):
        try:
            # Technical Indicators
            rsi = float(stock_data.get("rsi", 50) or 50)
            mfi = float(stock_data.get("mfi", 50) or 50)

            macd = float(stock_data.get("macd", 0) or 0)
            macd_signal = float(stock_data.get("macd_signal", 0) or 0)

            adx = float(stock_data.get("adx", 20) or 20)

            close_price = float(stock_data.get("close_price", 0) or 0)

            sma20 = float(stock_data.get("sma20", 0) or 0)
            sma50 = float(stock_data.get("sma50", 0) or 0)
            sma200 = float(stock_data.get("sma200", 0) or 0)

            volume = float(stock_data.get("volume", 0) or 0)
            avg_volume_20d = float(stock_data.get("avg_volume_20d", 1) or 1)

            roe = float(stock_data.get("roe", 0) or 0)
            debt_to_equity = float(stock_data.get("debt_to_equity", 999) or 999)

            # Relative Volume
            rvol = volume / avg_volume_20d if avg_volume_20d > 0 else 1

            score = 0

            # --------------------------------------------------
            # RSI (Weight: 2)
            # --------------------------------------------------
            if 55 <= rsi <= 70:
                score += 2
            elif 45 <= rsi < 55:
                score += 1
            elif rsi > 80:
                score -= 2
            elif rsi < 35:
                score -= 2

            # --------------------------------------------------
            # MFI (Weight: 2)
            # --------------------------------------------------
            if 60 <= mfi <= 80:
                score += 2
            elif 50 <= mfi < 60:
                score += 1
            elif mfi > 85:
                score -= 2
            elif mfi < 35:
                score -= 2

            # --------------------------------------------------
            # MACD (Weight: 3)
            # --------------------------------------------------
            if macd > macd_signal:
                score += 3
            elif macd < macd_signal:
                score -= 3

            # --------------------------------------------------
            # Trend Structure (Weight: 4)
            # --------------------------------------------------
            if close_price > sma20 > sma50 > sma200:
                score += 4
            elif close_price > sma20 > sma50:
                score += 2
            elif close_price < sma20 < sma50 < sma200:
                score -= 4
            elif close_price < sma20 < sma50:
                score -= 2

            # --------------------------------------------------
            # ADX Trend Strength (Weight: 3)
            # --------------------------------------------------
            if adx > 35:
                score += 3
            elif adx > 25:
                score += 2
            elif adx < 15:
                score -= 1

            # --------------------------------------------------
            # Relative Volume (Weight: 3)
            # --------------------------------------------------
            if rvol > 2:
                score += 3
            elif rvol > 1.5:
                score += 2
            elif rvol < 0.7:
                score -= 1

            # --------------------------------------------------
            # Fundamentals (Weight: 2)
            # --------------------------------------------------
            if roe > 20:
                score += 1

            if debt_to_equity < 0.5:
                score += 1
            elif debt_to_equity > 1.5:
                score -= 1

            # --------------------------------------------------
            # Sentiment (Weight: 4)
            # --------------------------------------------------
            if sentiment_score > 0.7:
                score += 4
            elif sentiment_score > 0.3:
                score += 2
            elif sentiment_score < -0.7:
                score -= 4
            elif sentiment_score < -0.3:
                score -= 2

            # --------------------------------------------------
            # Final Signal
            # --------------------------------------------------
            if score >= 12:
                return "strong buy"

            elif score >= 6:
                return "buy"

            elif score <= -12:
                return "strong sell"

            elif score <= -6:
                return "sell"

            return "normal"

        except Exception as e:
            logger.error(f"Error calculating AI signal: {e}")
            return "normal"
        

# Keep original functions for backward compatibility if any
def _support_level(ind):
    return max(ind.get("ma20", 0), ind.get("ma50", 0), ind.get("bb_lower", 0))

def _resistance_level(ind):
    return ind.get("prev_high", 0)

def generate_signals(ind):
    support = _support_level(ind)
    resistance = _resistance_level(ind)

    strong_buy = (
        ind.get("rsi", 50) > 50 and
        ind.get("macd", 0) > ind.get("macd_signal", 0) and
        ind.get("price", 0) > ind.get("ma20", 0)
    )

    breakout = (
        ind.get("price", 0) > resistance and
        ind.get("volume", 0) > ind.get("avg_volume", 1) * 1.5
    )

    swing_trade = (
        ind.get("price", 0) > ind.get("ma50", 0) and
        40 < ind.get("rsi", 50) < 55
    )

    volume_spike = (
        ind.get("volume", 0) > ind.get("avg_volume", 1) * 2
    )

    price_action_bullish = (
        ind.get("price", 0) > ind.get("ma20", 0) > ind.get("ma50", 0) and
        ind.get("macd", 0) > ind.get("macd_signal", 0) and
        ind.get("rsi", 50) >= 55
    )

    near_support = (
        support > 0 and
        ind.get("price", 0) >= support and
        ((ind.get("price", 0) - support) / support) <= 0.03
    )

    resistance_breakout = (
        resistance > 0 and
        ind.get("price", 0) > resistance and
        ind.get("volume", 0) > ind.get("avg_volume", 1)
    )

    risk_managed_setup = False
    if support > 0 and resistance > ind.get("price", 0) and ind.get("price", 0) > support:
        risk = ind.get("price", 0) - support
        reward = resistance - ind.get("price", 0)
        risk_managed_setup = risk > 0 and (reward / risk) >= 1.5

    return {
        "strong_buy": bool(strong_buy),
        "breakout": bool(breakout),
        "swing_trade": bool(swing_trade),
        "volume_spike": bool(volume_spike),
        "price_action_bullish": bool(price_action_bullish),
        "near_support": bool(near_support),
        "resistance_breakout": bool(resistance_breakout),
        "risk_managed_setup": bool(risk_managed_setup)
    }
