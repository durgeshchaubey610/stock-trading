from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth_schema import LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest
from app.utils.jwt_handler import create_token
from app.auth import get_current_user
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
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    # check if user exists
    user = db.query(User).filter(User.email == data.email).first()

    if user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(data.password)

    from datetime import datetime, timedelta
    expiry_date = datetime.utcnow() + timedelta(days=30)

    new_user = User(
        username=data.username,
        email=data.email,
        password=hashed_password,
        is_premium=True,
        subscription_tier="premium",
        subscription_expiry=expiry_date
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "success",
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "is_premium": new_user.is_premium,
            "subscription_tier": new_user.subscription_tier,
            "subscription_expiry": new_user.subscription_expiry.isoformat() if new_user.subscription_expiry else None
        }
    }


# -----------------------------
# LOGIN
# -----------------------------

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

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
            "email": user.email,
            "is_premium": user.is_premium,
            "subscription_tier": user.subscription_tier,
            "subscription_expiry": user.subscription_expiry.isoformat() if user.subscription_expiry else None
        }
    }


# In-memory OTP storage for simulated reset
reset_otps = {}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    import random
    otp = "".join(random.choices("0123456789", k=6))
    reset_otps[data.email] = otp

    print(f"\n==========================================")
    print(f"RESET OTP FOR {data.email}: {otp}")
    print(f"==========================================\n")

    return {
        "status": "success",
        "message": "Password reset OTP sent successfully to your email."
    }


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    expected_otp = reset_otps.get(data.email)
    if not expected_otp or expected_otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Valid OTP, update password
    user.password = hash_password(data.new_password)
    db.commit()

    # Clean up OTP
    reset_otps.pop(data.email, None)

    return {
        "status": "success",
        "message": "Password reset successfully. You can now login with your new password."
    }


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    user_token=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_token["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.current_password, user.password):
        raise HTTPException(status_code=400, detail="Invalid current password")

    user.password = hash_password(data.new_password)
    db.commit()

    return {
        "status": "success",
        "message": "Password changed successfully."
    }

