
import logging
import os
from typing import Dict, Union

# Flag to manually disable FinBERT if the environment is known to be problematic (e.g., missing DLLs on Windows)
DISABLE_FINBERT = os.getenv("DISABLE_AI_SENTIMENT", "false").lower() == "true"

# Attempt to load Hugging Face Transformers for FinBERT
HAS_FINBERT = False
finbert_pipeline = None

if not DISABLE_FINBERT:
    try:
        from transformers import pipeline
        # We use a specific model trained on financial text for much higher accuracy
        finbert_pipeline = pipeline("sentiment-analysis", model="ProsusAI/finbert")
        HAS_FINBERT = True
    except ImportError:
        logging.info("Transformers library not installed. Falling back to TextBlob for sentiment.")
    except Exception as e:
        # Check specifically for the common Windows DLL error to provide a cleaner message
        if "WinError 1114" in str(e) or "c10.dll" in str(e):
            logging.warning("FinBERT (AI Sentiment) is unavailable due to missing system DLLs (Common on Windows). Using TextBlob fallback.")
        else:
            logging.error(f"Error loading FinBERT: {e}. Falling back to TextBlob.")
else:
    logging.info("FinBERT intentionally disabled via environment variable.")

from textblob import TextBlob

logger = logging.getLogger(__name__)

def analyze_sentiment(text: str) -> Dict[str, Union[str, float]]:
    """
    Analyzes the sentiment of a given financial text.
    Prefers FinBERT (AI/ML) but falls back to TextBlob if unavailable.
    """
    if not text or not text.strip():
        return {"sentiment": "neutral", "confidence": 0.0, "model": "none"}

    if HAS_FINBERT:
        try:
            # FinBERT returns labels like 'positive', 'negative', 'neutral'
            result = finbert_pipeline(text)[0]
            label = result['label'].lower()
            score = result['score']
            
            return {
                "sentiment": label,
                "confidence": round(score, 4),
                "model": "finbert"
            }
        except Exception as e:
            logger.error(f"FinBERT analysis failed: {e}")
            # Fall through to TextBlob

    # Fallback: TextBlob logic
    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity
    subjectivity = analysis.sentiment.subjectivity

    # Adjusted rules for financial context where neutral facts are common
    if polarity > 0.1:
        sentiment = "positive"
    elif polarity < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    return {
        "sentiment": sentiment,
        "confidence": round(abs(polarity), 4),
        "model": "textblob_fallback",
        "subjectivity": round(subjectivity, 4)
    }
