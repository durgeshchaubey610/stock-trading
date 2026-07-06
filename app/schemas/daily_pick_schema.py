from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DailyPickBase(BaseModel):
    stock_id: int
    position: str # "call", "put"
    entry: float
    target: float
    stop_loss: float

class DailyPickCreate(DailyPickBase):
    pass

class DailyPick(DailyPickBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
