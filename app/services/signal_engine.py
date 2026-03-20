def generate_signals(ind):

    strong_buy = (
        ind["rsi"] > 50 and
        ind["macd"] > ind["macd_signal"] and
        ind["price"] > ind["ma20"]
    )

    breakout = (
        ind["price"] > ind["prev_high"] and
        ind["volume"] > ind["avg_volume"] * 1.5
    )

    swing_trade = (
        ind["price"] > ind["ma50"] and
        ind["rsi"] > 40 and
        ind["rsi"] < 55
    )

    volume_spike = (
        ind["volume"] > ind["avg_volume"] * 2
    )

    return {
        "strong_buy": bool(strong_buy),
        "breakout": bool(breakout),
        "swing_trade": bool(swing_trade),
        "volume_spike": bool(volume_spike)
    }