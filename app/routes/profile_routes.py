from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta

from app.database import get_db
from app.auth import get_current_user, get_db_user
from app.models.user import User
from app.services.paper_trading_service import PaperTradingService
from app.schemas.profile_schema import ProfileUpdate, PublicProfileResponse, PublicPortfolioResponse

router = APIRouter(prefix="/profile", tags=["Profile & Social"])

@router.post("/upgrade")
def upgrade_to_premium(
    tier: str = Query("pro", description="Subscription tier: basic, pro"),
    user: User = Depends(get_db_user),
    db: Session = Depends(get_db)
):
    """
    Simulate a payment success callback to upgrade a user to premium.
    """
    user.is_premium = True
    user.subscription_tier = tier
    user.subscription_expiry = datetime.utcnow() + timedelta(days=365) # 1 year
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"Successfully upgraded to {tier} tier",
        "expiry": user.subscription_expiry
    }

@router.put("/settings", response_model=PublicProfileResponse)
def update_profile_settings(
    settings: ProfileUpdate,
    user_token=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update privacy settings and profile slug.
    """
    user = db.query(User).filter(User.id == user_token["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_public = settings.is_public
    
    if settings.profile_slug:
        # Check uniqueness
        existing = db.query(User).filter(User.profile_slug == settings.profile_slug, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Profile slug already taken")
        user.profile_slug = settings.profile_slug
        
    db.commit()
    db.refresh(user)
    
    return {
        "username": user.username,
        "is_public": user.is_public,
        "profile_slug": user.profile_slug
    }

@router.get("/public/{slug}", response_model=PublicPortfolioResponse)
def get_public_portfolio(
    slug: str,
    db: Session = Depends(get_db)
):
    """
    Fetch a public portfolio snapshot by user slug. 
    Does not require authentication.
    """
    user = db.query(User).filter(User.profile_slug == slug).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    if not user.is_public:
        raise HTTPException(status_code=403, detail="This profile is private")
        
    from app.schemas.profile_schema import ProfileUpdate, PublicProfileResponse, PublicPortfolioResponse
    portfolio_data = PaperTradingService.get_portfolio_analytics(db, user.id)
    
    return {
        "username": user.username,
        "portfolio_data": portfolio_data
    }
