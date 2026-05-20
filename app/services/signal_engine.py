def _support_level(ind):
    return max(ind["ma20"], ind["ma50"], ind["bb_lower"])


def _resistance_level(ind):
    return ind["prev_high"]


def generate_signals(ind):

    support = _support_level(ind)
    resistance = _resistance_level(ind)

    strong_buy = (
        ind["rsi"] > 50 and
        ind["macd"] > ind["macd_signal"] and
        ind["price"] > ind["ma20"]
    )

    breakout = (
        ind["price"] > resistance and
        ind["volume"] > ind["avg_volume"] * 1.5
    )

    swing_trade = (
        ind["price"] > ind["ma50"] and
        40 < ind["rsi"] < 55
    )

    volume_spike = (
        ind["volume"] > ind["avg_volume"] * 2
    )

    price_action_bullish = (
        ind["price"] > ind["ma20"] > ind["ma50"] and
        ind["macd"] > ind["macd_signal"] and
        ind["rsi"] >= 55
    )

    near_support = (
        support > 0 and
        ind["price"] >= support and
        ((ind["price"] - support) / support) <= 0.03
    )

    resistance_breakout = (
        resistance > 0 and
        ind["price"] > resistance and
        ind["volume"] > ind["avg_volume"]
    )

    risk_managed_setup = False
    if support > 0 and resistance > ind["price"] and ind["price"] > support:
        risk = ind["price"] - support
        reward = resistance - ind["price"]
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
