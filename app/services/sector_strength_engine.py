import yfinance as yf

def sector_strength(sectors):
    strength = {}

    for sector, stocks in sectors.items():
        stock_returns = []

        for symbol in stocks:
            data = yf.Ticker(symbol).history(period="3mo")

            if len(data) < 2:
                continue

            ret = (data["Close"].iloc[-1] - data["Close"].iloc[0]) / data["Close"].iloc[0]
            stock_returns.append(float(ret))  # ✅ FIX

        if stock_returns:
            strength[sector] = sum(stock_returns) / len(stock_returns)  # already float

    sorted_sectors = sorted(strength, key=strength.get, reverse=True)

    return sorted_sectors