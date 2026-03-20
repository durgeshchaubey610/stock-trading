from fastapi import APIRouter, HTTPException
from app.database import SessionLocal
from app.models.user import User
from app.utils.jwt_handler import create_token
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Hash password
def hash_password(password: str):
    password = password[:72]   # truncate
    return pwd_context.hash(password)


# Verify password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password[:72], hashed_password)


# -----------------------------
# REGISTER
# -----------------------------

@router.post("/register")
def register(data: dict):

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        raise HTTPException(status_code=400, detail="Missing fields")

    db = SessionLocal()

    # check if user exists
    user = db.query(User).filter(User.email == email).first()

    if user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(password)

    new_user = User(
        username=username,
        email=email,
        password=hashed_password
    )
    print(new_user)

    db.add(new_user)
    db.commit()

    return {
        "status": "success",
        "message": "User registered successfully"
    }


# -----------------------------
# LOGIN
# -----------------------------

@router.post("/login")
def login(data: dict):

    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing credentials")

    db = SessionLocal()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email")

    if not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_token({
        "user_id": user.id,
        "email": user.email
    })

    return {
        "status": "success",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }