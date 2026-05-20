
from textblob import TextBlob

def analyze_sentiment(text):

    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity
    subjectivity = analysis.sentiment.subjectivity

    if polarity > 0 and subjectivity < 0.4:
        sentiment = "positive"
    elif polarity < 0 and subjectivity > 0.7:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    return {
        "sentiment": sentiment,
        "confidence": abs(polarity)
    }
