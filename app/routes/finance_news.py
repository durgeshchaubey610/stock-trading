from fastapi import APIRouter
from app.services.news_service import get_news
from app.services.sentiment_service import analyze_sentiment
from app.services.ticker_service import detect_tickers
from app.services.impact_service import calculate_stock_impact

router = APIRouter()

@router.get("/ai/finance-news")

def finance_news():

    news = get_news()

    results = []

    bullish = 0
    bearish = 0

    for item in news:

        text = item["title"] + " " + item["summary"]

        sentiment = analyze_sentiment(text)

        tickers = detect_tickers(text)

        if sentiment["sentiment"] == "positive":
            bullish += 1
        elif sentiment["sentiment"] == "negative":
            bearish += 1

        results.append({
            "title": item["title"],
            "link": item["link"],
            "sentiment": sentiment,
            "tickers": tickers
        })

    market_sentiment = "neutral"

    if bullish > bearish:
        market_sentiment = "bullish"

    if bearish > bullish:
        market_sentiment = "bearish"

    return {
        "market_sentiment": market_sentiment,
        "bullish_news": bullish,
        "bearish_news": bearish,
        "news": results
    }

@router.get("/ai/stock-impact")

def stock_news_impact():

    news = get_news()

    results = []

    for item in news:

        text = item["title"] + " " + item["summary"]

        sentiment = analyze_sentiment(text)

        tickers = detect_tickers(text)

        for ticker in tickers:

            impact = calculate_stock_impact(
                sentiment["sentiment"],
                sentiment["confidence"]
            )

            results.append({
                "ticker": ticker,
                "title": item["title"],
                "sentiment": sentiment["sentiment"],
                "confidence": sentiment["confidence"],
                "impact": impact,
                "link": item["link"]
            })

    return {
        "total_signals": len(results),
        "signals": results
    }