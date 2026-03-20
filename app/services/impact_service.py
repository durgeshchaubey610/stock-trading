def calculate_stock_impact(sentiment, confidence):

    if sentiment == "positive" and confidence > 0.3:
        impact = "bullish"

    elif sentiment == "negative" and confidence > 0.3:
        impact = "bearish"

    else:
        impact = "neutral"

    return impact