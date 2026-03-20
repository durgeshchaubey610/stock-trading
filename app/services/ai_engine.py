import pandas as pd
from xgboost import XGBClassifier


model = None


def create_features(df):

    df["return"] = df["Close"].pct_change()

    df["ma20"] = df["Close"].rolling(20).mean()

    df["ma50"] = df["Close"].rolling(50).mean()

    df["target"] = (df["Close"].shift(-5) > df["Close"]).astype(int)

    return df.dropna()


def train_model(df):

    global model

    data = create_features(df)

    X = data[["return","ma20","ma50"]]

    y = data["target"]

    model = XGBClassifier()

    model.fit(X,y)


def predict_probability(df):

    global model

    if model is None:
        return 0.5

    df = create_features(df)

    X = df[["return","ma20","ma50"]].iloc[-1:]

    prob = model.predict_proba(X)[0][1]

    return float(prob)


def calculate_score(ind, signals):

    score = 0

    if signals["strong_buy"]:
        score += 3

    if signals["breakout"]:
        score += 3

    if signals["swing_trade"]:
        score += 2

    if signals["volume_spike"]:
        score += 2

    return score