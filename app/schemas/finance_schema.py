from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class SavingsGoalBase(BaseModel):
    goal_name: str
    target_amount: float
    current_amount: Optional[float] = 0.0
    target_date: date
    category: Optional[str] = None

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalResponse(SavingsGoalBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class InsurancePolicyBase(BaseModel):
    provider_name: str
    policy_name: str
    policy_type: str
    coverage_amount: float
    premium_amount: float
    premium_frequency: str
    renewal_date: date
    claim_ratio: Optional[float] = None
    notes: Optional[str] = None

class InsurancePolicyCreate(InsurancePolicyBase):
    pass

class InsurancePolicyResponse(InsurancePolicyBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AssetLogBase(BaseModel):
    asset_name: str
    asset_type: str
    value: float
    description: Optional[str] = None

class AssetLogCreate(AssetLogBase):
    pass

class AssetLogResponse(AssetLogBase):
    id: int
    user_id: int
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class LiabilityLogBase(BaseModel):
    liability_name: str
    liability_type: str
    total_amount: float
    outstanding_amount: float
    monthly_payment: Optional[float] = 0.0
    description: Optional[str] = None

class LiabilityLogCreate(LiabilityLogBase):
    pass

class LiabilityLogResponse(LiabilityLogBase):
    id: int
    user_id: int
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class FireProfileBase(BaseModel):
    current_age: int
    retirement_age: int
    life_expectancy: int
    monthly_expenses_post_retirement: float
    pre_retirement_cagr: float
    post_retirement_cagr: float
    inflation_rate: float

class FireProfileCreate(FireProfileBase):
    pass

class FireProfileResponse(FireProfileBase):
    id: int
    user_id: int
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


