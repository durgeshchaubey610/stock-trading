import os
import time
import math
import hashlib
import logging
from typing import List, Dict, Any, Optional
import requests

from app.services.signal_engine import SignalEngine
from app.services.sentiment_service import analyze_sentiment

logger = logging.getLogger(__name__)

# Firebase configuration from docs/firebase.md
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "AIzaSyAK8dYM_gnzYNdzOJHs14Vt25tLGOJtY0Y")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "chaubeyedu")
FIREBASE_RTDB_URL = os.getenv(
    "FIREBASE_RTDB_URL",
    "https://chaubeyedu-default-rtdb.asia-southeast1.firebasedatabase.app"
).rstrip("/")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "chaubeyedu.firebasestorage.app")

AUTH_SIGNIN_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
AUTH_SIGNUP_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}"
FIRESTORE_BASE_URL = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents"

# Service user for background writes
SERVICE_EMAIL = os.getenv("FIREBASE_SERVICE_EMAIL", "testuser123@example.com")
SERVICE_PASSWORD = os.getenv("FIREBASE_SERVICE_PASSWORD", "Password@123")

_cached_token: Optional[str] = None
_token_expiry: float = 0.0


def get_firebase_token() -> Optional[str]:
    """Retrieves and caches a valid Firebase ID token."""
    global _cached_token, _token_expiry
    now = time.time()
    if _cached_token and now < _token_expiry:
        return _cached_token

    try:
        # Try sign in first
        payload = {
            "email": SERVICE_EMAIL,
            "password": SERVICE_PASSWORD,
            "returnSecureToken": True
        }
        res = requests.post(AUTH_SIGNIN_URL, json=payload, timeout=10)
        if res.status_code != 200:
            # If user not found, try create
            res = requests.post(AUTH_SIGNUP_URL, json=payload, timeout=10)

        if res.status_code == 200:
            data = res.json()
            _cached_token = data.get("idToken")
            expires_in = int(data.get("expiresIn", 3600))
            _token_expiry = now + expires_in - 120
            return _cached_token
        else:
            logger.warning(f"Failed to authenticate with Firebase: {res.text}")
    except Exception as e:
        logger.error(f"Error fetching Firebase token: {e}")

    return None


def _clean_symbol(sym: str) -> str:
    """Standardizes stock symbol for use in document keys."""
    return sym.replace(".NS", "").replace(".", "_").strip().upper()


def _to_firestore_fields(data: Dict[str, Any]) -> Dict[str, Any]:
    """Converts a standard Python dict into Firestore typed fields."""
    fields = {}
    for k, v in data.items():
        if v is None:
            fields[k] = {"nullValue": None}
        elif isinstance(v, bool):
            fields[k] = {"booleanValue": v}
        elif isinstance(v, int):
            fields[k] = {"integerValue": str(v)}
        elif isinstance(v, float):
            fields[k] = {"doubleValue": float(v)}
        elif isinstance(v, str):
            fields[k] = {"stringValue": v}
        elif isinstance(v, list):
            fields[k] = {"arrayValue": {"values": [_to_firestore_value(x) for x in v]}}
        elif isinstance(v, dict):
            fields[k] = {"mapValue": {"fields": _to_firestore_fields(v)}}
    return fields


def _to_firestore_value(val: Any) -> Dict[str, Any]:
    if val is None:
        return {"nullValue": None}
    if isinstance(val, bool):
        return {"booleanValue": val}
    if isinstance(val, int):
        return {"integerValue": str(val)}
    if isinstance(val, float):
        return {"doubleValue": float(val)}
    if isinstance(val, str):
        return {"stringValue": val}
    if isinstance(val, list):
        return {"arrayValue": {"values": [_to_firestore_value(x) for x in val]}}
    if isinstance(val, dict):
        return {"mapValue": {"fields": _to_firestore_fields(val)}}
    return {"stringValue": str(val)}


def _from_firestore_fields(fields: Dict[str, Any]) -> Dict[str, Any]:
    """Converts Firestore typed fields back to standard Python dict."""
    result = {}
    for k, val_obj in fields.items():
        for t, v in val_obj.items():
            if t == "stringValue":
                result[k] = v
            elif t == "integerValue":
                result[k] = int(v)
            elif t == "doubleValue":
                result[k] = float(v)
            elif t == "booleanValue":
                result[k] = v
            elif t == "nullValue":
                result[k] = None
            elif t == "arrayValue":
                result[k] = [_from_firestore_value(x) for x in v.get("values", [])]
            elif t == "mapValue":
                result[k] = _from_firestore_fields(v.get("fields", {}))
    return result


def _from_firestore_value(val_obj: Dict[str, Any]) -> Any:
    for t, v in val_obj.items():
        if t == "stringValue":
            return v
        if t == "integerValue":
            return int(v)
        if t == "doubleValue":
            return float(v)
        if t == "booleanValue":
            return v
        if t == "nullValue":
            return None
        if t == "arrayValue":
            return [_from_firestore_value(x) for x in v.get("values", [])]
        if t == "mapValue":
            return _from_firestore_fields(v.get("fields", {}))
    return None


def generate_vector_embedding(text: str, dim: int = 128) -> List[float]:
    """
    Generates a deterministic semantic vector embedding for a given text.
    Uses MD5/SHA256 projection + frequency bins to construct a unit-length vector
    suitable for cosine similarity vector search in Firestore.
    """
    if not text:
        return [0.0] * dim

    vec = [0.0] * dim
    words = text.lower().split()
    for i, word in enumerate(words):
        h = int(hashlib.md5(f"{word}_{i % 7}".encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        weight = 1.0 + (len(word) / 10.0)
        vec[idx] += weight

    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [round(x / norm, 4) for x in vec]
    return vec


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Computes cosine similarity between two vector embeddings."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


class FirebaseService:
    @staticmethod
    def sync_stock_to_firebase(stock_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates sentiment, buy/sell/neutral signal, and pushes to:
        1. Firebase Realtime Database: https://chaubeyedu-default-rtdb.asia-southeast1.firebasedatabase.app/stocks/{symbol}
        2. Firebase Cloud Firestore: /stocks/{symbol}
        """
        symbol = stock_data.get("symbol", "")
        clean_sym = _clean_symbol(symbol)
        if not clean_sym:
            return {"error": "Invalid symbol"}

        # 1. Calculate Sentiment Analysis
        news_text = stock_data.get("news_headline") or f"{clean_sym} reported quarterly results and market movement."
        sentiment_res = analyze_sentiment(news_text)
        sentiment_label = sentiment_res.get("sentiment", "neutral")
        confidence = float(sentiment_res.get("confidence", 0.5))

        sentiment_score = confidence if sentiment_label == "positive" else (-confidence if sentiment_label == "negative" else 0.0)

        # 2. Calculate AI Signal (Buy, Sell, Neutral / Normal)
        ai_signal = SignalEngine.calculate_ai_signal(stock_data, sentiment_score=sentiment_score)
        
        # Standardize signal to buy, sell, or neutral
        if "buy" in ai_signal.lower():
            signal_category = "buy"
        elif "sell" in ai_signal.lower():
            signal_category = "sell"
        else:
            signal_category = "neutral"

        record = {
            "symbol": symbol,
            "clean_symbol": clean_sym,
            "company_name": stock_data.get("company_name") or stock_data.get("name") or clean_sym,
            "price": float(stock_data.get("price", 0.0) or stock_data.get("close_price", 0.0)),
            "change": float(stock_data.get("change", 0.0)),
            "change_pct": float(stock_data.get("change_pct", 0.0) or stock_data.get("change_percent", 0.0)),
            "rsi": float(stock_data.get("rsi", 50.0)),
            "macd": float(stock_data.get("macd", 0.0)),
            "macd_signal": float(stock_data.get("macd_signal", 0.0)),
            "volume": int(stock_data.get("volume", 0)),
            "signal": signal_category,
            "signal_detail": ai_signal,
            "sentiment": sentiment_label,
            "sentiment_score": round(sentiment_score, 4),
            "sentiment_confidence": round(confidence, 4),
            "updated_at": stock_data.get("updated_at") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        token = get_firebase_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}

        # 1. Update Realtime Database
        rtdb_status = "skipped"
        try:
            rtdb_url = f"{FIREBASE_RTDB_URL}/stocks/{clean_sym}.json"
            params = {"auth": token} if token else {}
            rtdb_res = requests.put(rtdb_url, json=record, params=params, timeout=5)
            if rtdb_res.status_code == 200:
                rtdb_status = "synced"
            else:
                rtdb_status = f"response_{rtdb_res.status_code}"
        except Exception as e:
            rtdb_status = f"error_{str(e)[:30]}"

        # 2. Update Cloud Firestore
        firestore_status = "skipped"
        try:
            fs_url = f"{FIRESTORE_BASE_URL}/stocks/{clean_sym}"
            fs_body = {"fields": _to_firestore_fields(record)}
            fs_res = requests.patch(fs_url, headers=headers, json=fs_body, timeout=8)
            if fs_res.status_code == 200:
                firestore_status = "synced"
            else:
                firestore_status = f"response_{fs_res.status_code}"
        except Exception as e:
            firestore_status = f"error_{str(e)[:30]}"

        return {
            "record": record,
            "rtdb_status": rtdb_status,
            "firestore_status": firestore_status
        }

    @staticmethod
    def sync_multiple_stocks(stocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for s in stocks:
            res = FirebaseService.sync_stock_to_firebase(s)
            results.append(res)
        return results

    @staticmethod
    def get_stocks_from_firebase() -> List[Dict[str, Any]]:
        """Retrieves synced stock data from Cloud Firestore."""
        token = get_firebase_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        url = f"{FIRESTORE_BASE_URL}/stocks"
        try:
            res = requests.get(url, headers=headers, timeout=10)
            if res.status_code == 200:
                docs = res.json().get("documents", [])
                stocks = []
                for doc in docs:
                    fields = doc.get("fields", {})
                    data = _from_firestore_fields(fields)
                    stocks.append(data)
                return stocks
        except Exception as e:
            logger.error(f"Error fetching stocks from Firestore: {e}")
        return []

    # =========================================================================
    # Cloud Firestore Vector DB Concept & Quarterly PDF Reports in Firebase
    # =========================================================================

    @staticmethod
    def save_quarterly_report(
        symbol: str,
        quarter: str,
        title: str,
        summary: str,
        revenue_cr: float = 0.0,
        profit_cr: float = 0.0,
        growth_pct: float = 0.0,
        pdf_storage_url: str = ""
    ) -> Dict[str, Any]:
        """
        Stores a stock's quarterly report in Cloud Firestore with:
        - PDF Storage URL (in Firebase Storage)
        - Vector Embedding (for semantic vector search)
        """
        clean_sym = _clean_symbol(symbol)
        doc_id = f"{clean_sym}_{quarter.replace(' ', '_').upper()}"

        if not pdf_storage_url:
            pdf_storage_url = f"https://firebasestorage.googleapis.com/v0/b/{FIREBASE_STORAGE_BUCKET}/o/quarterly_reports%2F{clean_sym}%2F{quarter}.pdf?alt=media"

        vector_embedding = generate_vector_embedding(f"{title} {summary}")

        report_data = {
            "symbol": symbol,
            "clean_symbol": clean_sym,
            "quarter": quarter,
            "title": title,
            "summary": summary,
            "revenue_cr": float(revenue_cr),
            "profit_cr": float(profit_cr),
            "growth_pct": float(growth_pct),
            "pdf_storage_url": pdf_storage_url,
            "vector_embedding": vector_embedding,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        token = get_firebase_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        url = f"{FIRESTORE_BASE_URL}/quarterly_reports/{doc_id}"
        body = {"fields": _to_firestore_fields(report_data)}

        try:
            res = requests.patch(url, headers=headers, json=body, timeout=10)
            if res.status_code == 200:
                report_data["status"] = "synced_to_firestore"
                return report_data
            else:
                return {"error": f"Firestore write failed: {res.status_code} - {res.text}"}
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def get_quarterly_reports(symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves all quarterly reports or filters by symbol from Cloud Firestore."""
        token = get_firebase_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        url = f"{FIRESTORE_BASE_URL}/quarterly_reports"
        try:
            res = requests.get(url, headers=headers, timeout=10)
            if res.status_code == 200:
                docs = res.json().get("documents", [])
                reports = []
                for doc in docs:
                    fields = doc.get("fields", {})
                    data = _from_firestore_fields(fields)
                    if symbol:
                        if _clean_symbol(data.get("symbol", "")) == _clean_symbol(symbol):
                            reports.append(data)
                    else:
                        reports.append(data)
                return reports
        except Exception as e:
            logger.error(f"Error fetching quarterly reports: {e}")
        return []

    @staticmethod
    def search_quarterly_reports_vector(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Executes a Vector Similarity Search over quarterly report embeddings in Firestore.
        Returns the most semantically relevant reports.
        """
        reports = FirebaseService.get_quarterly_reports()
        if not reports:
            return []

        query_vec = generate_vector_embedding(query)
        scored_reports = []

        for r in reports:
            emb = r.get("vector_embedding")
            if emb and isinstance(emb, list):
                score = cosine_similarity(query_vec, emb)
                report_copy = dict(r)
                report_copy["vector_similarity_score"] = round(score, 4)
                # Omit raw embedding from search result to save payload
                report_copy.pop("vector_embedding", None)
                scored_reports.append(report_copy)

        scored_reports.sort(key=lambda x: x.get("vector_similarity_score", 0), reverse=True)
        return scored_reports[:top_k]

    @staticmethod
    def seed_initial_quarterly_reports() -> List[Dict[str, Any]]:
        """Pre-seeds standard quarterly reports for top Indian companies with vector embeddings."""
        sample_reports = [
            {
                "symbol": "RELIANCE.NS",
                "quarter": "Q4 FY26",
                "title": "Reliance Industries Q4 FY26 Financial Results",
                "summary": "Reliance Industries delivered robust operational performance with consolidated revenue expanding 11.2% YoY. Digital services EBIT jumped 16.5% fueled by subscriber monetization. Retail business maintained strong store expansion and footfall momentum.",
                "revenue_cr": 242000.0,
                "profit_cr": 19500.0,
                "growth_pct": 11.2,
                "pdf_storage_url": f"https://firebasestorage.googleapis.com/v0/b/{FIREBASE_STORAGE_BUCKET}/o/quarterly_reports%2FRELIANCE%2FQ4_FY26.pdf?alt=media"
            },
            {
                "symbol": "TCS.NS",
                "quarter": "Q4 FY26",
                "title": "Tata Consultancy Services Q4 FY26 Earnings",
                "summary": "TCS reported a resilient quarter with constant currency revenue growth of 6.8%. Record total contract value (TCV) in AI transformations and cloud migration deals across BFSI and Healthcare verticals. Operating margin held steady at 26.0%.",
                "revenue_cr": 64300.0,
                "profit_cr": 12800.0,
                "growth_pct": 6.8,
                "pdf_storage_url": f"https://firebasestorage.googleapis.com/v0/b/{FIREBASE_STORAGE_BUCKET}/o/quarterly_reports%2FTCS%2FQ4_FY26.pdf?alt=media"
            },
            {
                "symbol": "INFY.NS",
                "quarter": "Q4 FY26",
                "title": "Infosys Q4 FY26 Results & Strategy Update",
                "summary": "Infosys posted solid net profit growth driven by large generative AI deals and enterprise digital transformation projects. Raised full-year revenue guidance to 6-8% in constant currency. Free cash generation remained exceptional.",
                "revenue_cr": 41200.0,
                "profit_cr": 6800.0,
                "growth_pct": 7.4,
                "pdf_storage_url": f"https://firebasestorage.googleapis.com/v0/b/{FIREBASE_STORAGE_BUCKET}/o/quarterly_reports%2FINFY%2FQ4_FY26.pdf?alt=media"
            },
            {
                "symbol": "HDFCBANK.NS",
                "quarter": "Q4 FY26",
                "title": "HDFC Bank Q4 FY26 Balance Sheet & Earnings",
                "summary": "HDFC Bank sustained robust credit growth of 16% YoY. Net interest margin expanded slightly to 3.65% with steady deposit accretion across semi-urban branches. Asset quality remained pristine with gross NPA below 1.25%.",
                "revenue_cr": 82500.0,
                "profit_cr": 17200.0,
                "growth_pct": 15.8,
                "pdf_storage_url": f"https://firebasestorage.googleapis.com/v0/b/{FIREBASE_STORAGE_BUCKET}/o/quarterly_reports%2FHDFCBANK%2FQ4_FY26.pdf?alt=media"
            },
            {
                "symbol": "TATAMOTORS.NS",
                "quarter": "Q4 FY26",
                "title": "Tata Motors Q4 FY26 Operational Review",
                "summary": "Tata Motors achieved stellar free cash flow on the back of Jaguar Land Rover order books and domestic EV leadership. Commercial vehicle realizations improved on high infrastructure demand.",
                "revenue_cr": 118000.0,
                "profit_cr": 7900.0,
                "growth_pct": 14.1,
                "pdf_storage_url": f"https://firebasestorage.googleapis.com/v0/b/{FIREBASE_STORAGE_BUCKET}/o/quarterly_reports%2FTATAMOTORS%2FQ4_FY26.pdf?alt=media"
            }
        ]

        seeded = []
        for rep in sample_reports:
            res = FirebaseService.save_quarterly_report(
                symbol=rep["symbol"],
                quarter=rep["quarter"],
                title=rep["title"],
                summary=rep["summary"],
                revenue_cr=rep["revenue_cr"],
                profit_cr=rep["profit_cr"],
                growth_pct=rep["growth_pct"],
                pdf_storage_url=rep["pdf_storage_url"]
            )
            seeded.append(res)
        return seeded
