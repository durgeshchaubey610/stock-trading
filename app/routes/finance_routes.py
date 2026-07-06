from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.database import get_db
from app.auth import get_current_user, require_premium
from app.models.user import User
from app.models.finance import SavingsGoal, InsurancePolicy, AssetLog, LiabilityLog, FireProfile
from app.schemas.finance_schema import (
    SavingsGoalCreate, SavingsGoalResponse,
    InsurancePolicyCreate, InsurancePolicyResponse,
    AssetLogCreate, AssetLogResponse,
    LiabilityLogCreate, LiabilityLogResponse,
    FireProfileCreate, FireProfileResponse
)

router = APIRouter(prefix="/finance", tags=["Finance"])

# -----------------------------
# SAVINGS GOALS
# -----------------------------

@router.get("/goals", response_model=List[SavingsGoalResponse])
def get_savings_goals(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user["user_id"]).all()

@router.post("/goals", response_model=SavingsGoalResponse)
def create_savings_goal(data: SavingsGoalCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    new_goal = SavingsGoal(user_id=current_user["user_id"], **data.dict())
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@router.put("/goals/{goal_id}/add-funds", response_model=SavingsGoalResponse)
def add_funds_to_goal(goal_id: int, amount: float, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user["user_id"]).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.current_amount += amount
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/goals/{goal_id}")
def delete_savings_goal(goal_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user["user_id"]).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Savings goal deleted"}

# -----------------------------
# INSURANCE POLICIES
# -----------------------------

@router.get("/insurance", response_model=List[InsurancePolicyResponse])
def get_insurance_policies(user: User = Depends(require_premium), db: Session = Depends(get_db)):
    return db.query(InsurancePolicy).filter(InsurancePolicy.user_id == user.id).all()

@router.post("/insurance", response_model=InsurancePolicyResponse)
def add_insurance_policy(data: InsurancePolicyCreate, user: User = Depends(require_premium), db: Session = Depends(get_db)):
    new_policy = InsurancePolicy(user_id=user.id, **data.dict())
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy

@router.delete("/insurance/{policy_id}")
def delete_insurance_policy(policy_id: int, user: User = Depends(require_premium), db: Session = Depends(get_db)):
    policy = db.query(InsurancePolicy).filter(InsurancePolicy.id == policy_id, InsurancePolicy.user_id == user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(policy)
    db.commit()
    return {"message": "Insurance policy deleted"}

# -----------------------------
# ASSETS
# -----------------------------

@router.get("/assets", response_model=List[AssetLogResponse])
def get_assets(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(AssetLog).filter(AssetLog.user_id == current_user["user_id"]).all()

@router.post("/assets", response_model=AssetLogResponse)
def add_asset(data: AssetLogCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    new_asset = AssetLog(user_id=current_user["user_id"], **data.dict())
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset

@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    asset = db.query(AssetLog).filter(AssetLog.id == asset_id, AssetLog.user_id == current_user["user_id"]).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted"}

# -----------------------------
# LIABILITIES
# -----------------------------

@router.get("/liabilities", response_model=List[LiabilityLogResponse])
def get_liabilities(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(LiabilityLog).filter(LiabilityLog.user_id == current_user["user_id"]).all()

@router.post("/liabilities", response_model=LiabilityLogResponse)
def add_liability(data: LiabilityLogCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    new_liability = LiabilityLog(user_id=current_user["user_id"], **data.dict())
    db.add(new_liability)
    db.commit()
    db.refresh(new_liability)
    return new_liability

@router.delete("/liabilities/{liability_id}")
def delete_liability(liability_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    liability = db.query(LiabilityLog).filter(LiabilityLog.id == liability_id, LiabilityLog.user_id == current_user["user_id"]).first()
    if not liability:
        raise HTTPException(status_code=404, detail="Liability not found")
    db.delete(liability)
    db.commit()
    return {"message": "Liability deleted"}

# -----------------------------
# NET WORTH (Phase 10: /finance/networth)
# -----------------------------

@router.get("/networth", response_model=Dict[str, Any])
def get_net_worth_details(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["user_id"]
    
    # 1. Fetch customized assets and liabilities
    asset_logs = db.query(AssetLog).filter(AssetLog.user_id == user_id).all()
    liability_logs = db.query(LiabilityLog).filter(LiabilityLog.user_id == user_id).all()
    
    # 2. Fetch paper trading portfolio parameters (Holdings & Cash)
    from app.models.paper_trading import PaperPortfolio, PaperPosition
    portfolio = db.query(PaperPortfolio).filter(PaperPortfolio.user_id == user_id).first()
    portfolio_cash = portfolio.cash if portfolio else 100000.0 # fallback
    
    positions_value = 0.0
    if portfolio:
        positions = db.query(PaperPosition).filter(PaperPosition.portfolio_id == portfolio.id).all()
        from app.services.price_service import get_cached_price
        for pos in positions:
            current_price = get_cached_price(pos.stock_symbol) or pos.average_price
            positions_value += pos.quantity * current_price

    # 3. Fetch savings goals
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
    total_savings_goals = sum(g.current_amount for g in goals)

    # 4. Synthesize consolidated assets object
    consolidated_assets = {
        "portfolio_cash": portfolio_cash,
        "portfolio_holdings": positions_value,
        "savings_goals": total_savings_goals,
        "manual_assets": [{"id": a.id, "name": a.asset_name, "type": a.asset_type, "value": a.value} for a in asset_logs]
    }
    
    total_assets_val = portfolio_cash + positions_value + total_savings_goals + sum(a.value for a in asset_logs)

    # 5. Synthesize liabilities object
    consolidated_liabilities = {
        "manual_liabilities": [{"id": l.id, "name": l.liability_name, "type": l.liability_type, "outstanding": l.outstanding_amount, "total": l.total_amount, "emi": l.monthly_payment} for l in liability_logs]
    }
    
    total_liabilities_val = sum(l.outstanding_amount for l in liability_logs)

    return {
        "assets": consolidated_assets,
        "liabilities": consolidated_liabilities,
        "total_assets": total_assets_val,
        "total_liabilities": total_liabilities_val,
        "net_worth": total_assets_val - total_liabilities_val
    }

# -----------------------------
# FIRE & RETIREMENT PLANNER (Phase 11)
# -----------------------------

@router.get("/fire-profile", response_model=FireProfileResponse)
def get_fire_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["user_id"]
    profile = db.query(FireProfile).filter(FireProfile.user_id == user_id).first()
    if not profile:
        profile = FireProfile(
            user_id=user_id,
            current_age=30,
            retirement_age=55,
            life_expectancy=85,
            monthly_expenses_post_retirement=40000.0,
            pre_retirement_cagr=12.0,
            post_retirement_cagr=7.0,
            inflation_rate=6.0
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.post("/fire-profile", response_model=FireProfileResponse)
def update_fire_profile(data: FireProfileCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["user_id"]
    profile = db.query(FireProfile).filter(FireProfile.user_id == user_id).first()
    if not profile:
        profile = FireProfile(user_id=user_id)
        db.add(profile)
    
    for key, val in data.dict().items():
        setattr(profile, key, val)
        
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/fire-planner", response_model=Dict[str, Any])
def get_fire_planner_data(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["user_id"]
    
    profile = db.query(FireProfile).filter(FireProfile.user_id == user_id).first()
    if not profile:
        profile = FireProfile(
            user_id=user_id,
            current_age=30,
            retirement_age=55,
            life_expectancy=85,
            monthly_expenses_post_retirement=40000.0,
            pre_retirement_cagr=12.0,
            post_retirement_cagr=7.0,
            inflation_rate=6.0
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    from app.models.paper_trading import PaperPortfolio, PaperPosition
    portfolio = db.query(PaperPortfolio).filter(PaperPortfolio.user_id == user_id).first()
    portfolio_cash = portfolio.cash if portfolio else 100000.0
    
    positions_value = 0.0
    if portfolio:
        positions = db.query(PaperPosition).filter(PaperPosition.portfolio_id == portfolio.id).all()
        from app.services.price_service import get_cached_price
        for pos in positions:
            current_price = get_cached_price(pos.stock_symbol) or pos.average_price
            positions_value += pos.quantity * current_price

    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
    total_savings_goals = sum(g.current_amount for g in goals)
    
    asset_logs = db.query(AssetLog).filter(AssetLog.user_id == user_id).all()
    manual_assets_total = sum(a.value for a in asset_logs)
    
    total_assets = portfolio_cash + positions_value + total_savings_goals + manual_assets_total
    
    liability_logs = db.query(LiabilityLog).filter(LiabilityLog.user_id == user_id).all()
    total_liabilities = sum(l.outstanding_amount for l in liability_logs)
    
    current_net_worth = max(total_assets - total_liabilities, 0.0)

    current_age = max(profile.current_age, 1)
    retirement_age = max(profile.retirement_age, current_age)
    life_expectancy = max(profile.life_expectancy, retirement_age)
    
    years_to_retirement = max(retirement_age - current_age, 0)
    years_in_retirement = max(life_expectancy - retirement_age, 0)
    
    inflation_rate = profile.inflation_rate
    pre_retirement_cagr = profile.pre_retirement_cagr
    post_retirement_cagr = profile.post_retirement_cagr
    monthly_expenses_post_retirement = profile.monthly_expenses_post_retirement

    inflation_factor = (1.0 + inflation_rate/100.0) ** years_to_retirement
    monthly_expense_at_retirement = monthly_expenses_post_retirement * inflation_factor
    annual_expense_at_retirement = monthly_expense_at_retirement * 12

    real_retirement_return = (1.0 + post_retirement_cagr/100.0) / (1.0 + inflation_rate/100.0) - 1.0
    
    if abs(real_retirement_return) < 0.001:
        required_corpus = annual_expense_at_retirement * years_in_retirement
    else:
        required_corpus = annual_expense_at_retirement * ((1.0 - (1.0 + real_retirement_return) ** (-years_in_retirement)) / real_retirement_return)
    
    required_corpus = max(required_corpus, 0.0)
    future_assets_value = current_net_worth * ((1.0 + pre_retirement_cagr/100.0) ** years_to_retirement)
    savings_gap = max(required_corpus - future_assets_value, 0.0)

    monthly_sip_required = 0.0
    if savings_gap > 0 and years_to_retirement > 0:
        monthly_rate = (pre_retirement_cagr / 100.0) / 12.0
        months = years_to_retirement * 12
        if monthly_rate > 0:
            monthly_sip_required = savings_gap * monthly_rate / (((1.0 + monthly_rate) ** months) - 1.0)
        else:
            monthly_sip_required = savings_gap / months

    readiness_score = 0.0
    if required_corpus > 0:
        readiness_score = min((future_assets_value / required_corpus) * 100.0, 100.0)
    else:
        readiness_score = 100.0

    projected_savings_monthly = max(monthly_sip_required, 25000.0)
    annual_savings = projected_savings_monthly * 12
    
    projections = []
    current_year = datetime.now().year
    
    scenarios = [
        {"name": "average", "pre": pre_retirement_cagr, "post": post_retirement_cagr},
        {"name": "best", "pre": pre_retirement_cagr + 3.0, "post": post_retirement_cagr + 2.0},
        {"name": "worst", "pre": pre_retirement_cagr - 4.0, "post": post_retirement_cagr - 2.0}
    ]
    
    for year_idx in range(years_to_retirement + years_in_retirement + 1):
        age = current_age + year_idx
        year = current_year + year_idx
        
        row = {
            "year": year,
            "age": age,
            "is_retired": age >= retirement_age
        }
        
        for scen in scenarios:
            name = scen["name"]
            pre_r = scen["pre"]
            post_r = scen["post"]
            
            if year_idx == 0:
                val = current_net_worth
            else:
                prev_val = projections[-1][f"{name}_value"]
                if age <= retirement_age:
                    val = prev_val * (1.0 + pre_r/100.0) + annual_savings
                else:
                    exp_inf_factor = (1.0 + inflation_rate/100.0) ** (age - retirement_age)
                    current_yr_expense = annual_expense_at_retirement * exp_inf_factor
                    val = max(prev_val * (1.0 + post_r/100.0) - current_yr_expense, 0.0)
            
            row[f"{name}_value"] = round(val, 2)
            
        projections.append(row)

    return {
        "profile": {
            "current_age": current_age,
            "retirement_age": retirement_age,
            "life_expectancy": life_expectancy,
            "monthly_expenses_post_retirement": monthly_expenses_post_retirement,
            "pre_retirement_cagr": pre_retirement_cagr,
            "post_retirement_cagr": post_retirement_cagr,
            "inflation_rate": inflation_rate
        },
        "metrics": {
            "current_net_worth": current_net_worth,
            "years_to_retirement": years_to_retirement,
            "years_in_retirement": years_in_retirement,
            "inflation_adjusted_monthly_expense": round(monthly_expense_at_retirement, 2),
            "required_corpus": round(required_corpus, 2),
            "estimated_corpus_future_value": round(future_assets_value, 2),
            "savings_gap": round(savings_gap, 2),
            "monthly_sip_required": round(monthly_sip_required, 2),
            "readiness_score": round(readiness_score, 1)
        },
        "projections": projections
    }

@router.get("/alternative-protection", response_model=Dict[str, Any])
def get_alternative_protection_models(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["user_id"]
    
    policies = db.query(InsurancePolicy).filter(InsurancePolicy.user_id == user_id).all()
    
    total_annual_premium = 0.0
    total_coverage = 0.0
    for p in policies:
        total_coverage += p.coverage_amount
        if p.premium_frequency.lower() == 'monthly':
            total_annual_premium += p.premium_amount * 12
        else:
            total_annual_premium += p.premium_amount

    if total_annual_premium == 0.0:
        total_annual_premium = 25000.0
        total_coverage = 500000.0

    def fv_annuity(pmt, rate, years):
        if rate <= 0:
            return pmt * years
        return pmt * (((1.0 + rate) ** years - 1.0) / rate) * (1.0 + rate)

    alternatives = [
        {
            "id": "dividend_basket",
            "name": "High-Yield Dividend Portfolio",
            "description": "Invest diverted premium capital in cash-flowing equities.",
            "cagr": 14.0,
            "annual_premium": total_annual_premium,
            "risk_level": "Medium-High",
            "liquidity": "High (T+1 Liquidity)",
            "estimated_value_10y": round(fv_annuity(total_annual_premium, 0.14, 10), 2),
            "estimated_value_20y": round(fv_annuity(total_annual_premium, 0.14, 20), 2),
            "protection_benefit": "Generates direct dividend income to offset life expenses."
        },
        {
            "id": "income_funds",
            "name": "Conservative Hybrid Income Funds",
            "description": "Conservative growth through debt mutual funds and treasury bonds.",
            "cagr": 7.5,
            "annual_premium": total_annual_premium,
            "risk_level": "Low",
            "liquidity": "High (T+2 Liquidity)",
            "estimated_value_10y": round(fv_annuity(total_annual_premium, 0.075, 10), 2),
            "estimated_value_20y": round(fv_annuity(total_annual_premium, 0.075, 20), 2),
            "protection_benefit": "Safe wealth accumulation with lower volatility than stocks."
        },
        {
            "id": "sgb_gold",
            "name": "Sovereign Gold Bonds & SGB ETFs",
            "description": "Appreciation of physical gold with 2.5% guaranteed interest payouts.",
            "cagr": 9.5,
            "annual_premium": total_annual_premium,
            "risk_level": "Low-Medium",
            "liquidity": "Medium (5-Year Lock-in for SGB)",
            "estimated_value_10y": round(fv_annuity(total_annual_premium, 0.095, 10), 2),
            "estimated_value_20y": round(fv_annuity(total_annual_premium, 0.095, 20), 2),
            "protection_benefit": "Direct hedge against local inflation."
        }
    ]

    return {
        "traditional": {
            "total_policies": len(policies),
            "total_annual_premium": total_annual_premium,
            "total_coverage_amount": total_coverage
        },
        "alternatives": alternatives
    }



