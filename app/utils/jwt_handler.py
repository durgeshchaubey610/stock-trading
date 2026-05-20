from datetime import datetime, timedelta, timezone

from jose import jwt

from app.config import ACCESS_TOKEN_EXPIRE_HOURS, SECRET_KEY

ALGORITHM = "HS256"


def create_token(data: dict):

    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token
