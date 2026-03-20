from jose import jwt
from datetime import datetime, timedelta
from app.config import SECRET_KEY

ALGORITHM = "HS256"


def create_token(data: dict):

    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=10)

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token