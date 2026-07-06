import feedparser
import urllib.parse
from app.services.sentiment_service import analyze_sentiment
from typing import List, Dict

RSS_FEEDS = [
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=IN&lang=en-IN",
    "https://news.google.com/rss/search?q={symbol}+stock+news&hl=en-IN&gl=IN&ceid=IN:en"
]

def get_news_for_symbol(symbol: str) -> Dict:
    """
    Fetches latest news for a specific ticker symbol and analyzes sentiment.
    """
    news_items = []

    # Strip .NS or .BO for yahoo finance search sometimes, but Yahoo handles .NS well.
    formatted_symbol = urllib.parse.quote(symbol)

    for url_template in RSS_FEEDS:
        url = url_template.format(symbol=formatted_symbol)
        try:
            feed = feedparser.parse(url)

            for entry in feed.entries[:10]: # Get top 10 news items
                title = entry.title
                summary = entry.get("summary", "")

                # Analyze sentiment of the title (often more condensed signal than summary)
                sentiment_result = analyze_sentiment(title)

                news_items.append({
                    "title": title,
                    "link": entry.link,
                    "published": entry.get("published", ""),
                    "sentiment": sentiment_result["sentiment"],
                    "confidence": sentiment_result["confidence"],
                    "model_used": sentiment_result["model"]
                })
        except Exception as e:
            import logging
            logging.error(f"Error fetching news for {symbol}: {e}")

    # Aggregate Sentiment Calculation
    sentiment_score = 0
    total_weight = 0
    for item in news_items:
        weight = item["confidence"]
        if item["sentiment"] == "positive":
            sentiment_score += weight
        elif item["sentiment"] == "negative":
            sentiment_score -= weight
        total_weight += weight

    aggregate_sentiment = "neutral"
    normalized_score = 0.0

    if total_weight > 0:
        normalized_score = sentiment_score / total_weight
        if normalized_score > 0.2:
            aggregate_sentiment = "bullish"
        elif normalized_score < -0.2:
            aggregate_sentiment = "bearish"

    return {
        "symbol": symbol,
        "aggregate_sentiment": aggregate_sentiment,
        "sentiment_score": round(normalized_score, 2),
        "article_count": len(news_items),
        "articles": news_items
    }

# Keep original for backward compatibility if needed
def get_news():
    news = []
    for url in ["https://feeds.finance.yahoo.com/rss/2.0/headline?s=^NSEI"]:
        feed = feedparser.parse(url)
        for entry in feed.entries[:10]:
            news.append({
                "title": entry.title,
                "summary": entry.summary if "summary" in entry else "",
                "link": entry.link,
                "published": entry.published if "published" in entry else ""
            })
    return news