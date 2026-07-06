from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime

class ScreenerTemplateBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    filters: Dict[str, Any]
    is_public: bool = False

class ScreenerTemplateCreate(ScreenerTemplateBase):
    pass

class ScreenerTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    filters: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None

class ScreenerTemplateResponse(ScreenerTemplateBase):
    id: int
    user_id: int
    upvotes: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
