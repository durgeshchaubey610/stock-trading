from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_NAME = "ProsusAI/finbert"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

labels = ["negative", "neutral", "positive"]


def analyze_sentiment(text):

    inputs = tokenizer(text, return_tensors="pt", truncation=True)

    outputs = model(**inputs)

    scores = torch.nn.functional.softmax(outputs.logits, dim=1)

    sentiment = labels[torch.argmax(scores)]

    confidence = float(torch.max(scores))

    return {
        "sentiment": sentiment,
        "confidence": confidence
    }