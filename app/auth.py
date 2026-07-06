from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, ExpiredSignatureError, jwt
from sqlalchemy.orm import Session

from app.config import SECRET_KEY
from app.database import get_db
from app.models.user import User

ALGORITHM = "HS256"
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        email = payload.get("email")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {"user_id": user_id, "email": email}

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

from datetime import datetime

def get_db_user(user_token=Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches the full User model from database."""
    user = db.query(User).filter(User.id == user_token["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check subscription expiration
    if user.is_premium and user.subscription_expiry and user.subscription_expiry < datetime.utcnow():
        user.is_premium = False
        user.subscription_tier = "free"
        db.commit()
        
    return user

def require_pro(user: User = Depends(get_db_user)):
    """Dependency to gate features behind a pro or premium subscription."""
    if not user.is_premium or user.subscription_tier not in ["pro", "premium"]:
        raise HTTPException(status_code=403, detail="Pro or Premium subscription required")
    return user

def require_premium(user: User = Depends(get_db_user)):
    """Dependency to gate features strictly behind a premium subscription."""
    if not user.is_premium or user.subscription_tier != "premium":
        raise HTTPException(status_code=403, detail="Premium subscription required")
    return user

