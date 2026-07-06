from pydantic import BaseModel
from typing import Optional

class ProfileUpdate(BaseModel):
    is_public: bool
    profile_slug: Optional[str] = None

class PublicProfileResponse(BaseModel):
    username: str
    is_public: bool
    profile_slug: str

class PublicPortfolioResponse(BaseModel):
    username: str
    portfolio_data: dict
