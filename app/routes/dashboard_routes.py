from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime, date

from app.database import get_db
from app.auth import get_current_user
from app.models.paper_trading import PaperPortfolio, PaperPosition
from app.models.finance import SavingsGoal, InsurancePolicy, AssetLog, LiabilityLog
from app.models.stock import Stock

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=Dict[str, Any])
def get_dashboard_summary(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["user_id"]

    # 1. Fetch Paper Trading Data
    portfolio = db.query(PaperPortfolio).filter(PaperPortfolio.user_id == user_id).first()
    positions = db.query(PaperPosition).filter(PaperPosition.user_id == user_id).all()
    
    cash = portfolio.available_cash if portfolio else 1000000.0
    invested = portfolio.invested_amount if portfolio else 0.0
    
    # Calculate position values with current stock prices
    positions_value = 0.0
    for pos in positions:
        stock = db.query(Stock).filter(Stock.symbol == pos.stock_symbol).first()
        current_price = stock.close_price if stock else pos.avg_buy_price
        positions_value += pos.quantity * current_price

    # 2. Fetch Finance Data
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
    policies = db.query(InsurancePolicy).filter(InsurancePolicy.user_id == user_id).all()

    # Total savings in goals
    total_savings_goals = sum(g.current_amount for g in goals)

    # 3. Use baseline monthly expenses & income
    monthly_expenses = 50000.0  # Baseline ₹50k/month
    monthly_income = 80000.0  # Baseline ₹80k/month
    annual_expenses = monthly_expenses * 12

    # 4. Calculate Net Worth
    # Assets: Portfolio Cash + Current Position Value + Savings Goals + Manual Assets (Real Estate, Gold, Pension, etc.)
    manual_assets = db.query(AssetLog).filter(AssetLog.user_id == user_id).all()
    manual_assets_total = sum(a.value for a in manual_assets)
    total_assets = cash + positions_value + total_savings_goals + manual_assets_total
    
    # Liabilities: Manual Liabilities (Home Loans, Car Loans, Credit Cards, etc.)
    manual_liabilities = db.query(LiabilityLog).filter(LiabilityLog.user_id == user_id).all()
    total_liabilities = sum(l.outstanding_amount for l in manual_liabilities)
    
    net_worth = total_assets - total_liabilities


    # 5. FIRE Score (FI Number = Annual Expenses * 25)
    fi_number = max(annual_expenses * 25, 1000000.0)
    fi_progress = min((net_worth / fi_number) * 100, 100.0)

    # Years to reach FI (assuming 12% returns on net worth, saving 30% of income)
    monthly_savings = max(monthly_income - monthly_expenses, 10000.0)
    annual_savings = monthly_savings * 12
    
    years_to_fi = 0
    temp_net_worth = net_worth
    while temp_net_worth < fi_number and years_to_fi < 50:
        temp_net_worth = temp_net_worth * 1.12 + annual_savings
        years_to_fi += 1
    estimated_fi_year = datetime.now().year + years_to_fi

    # 6. Calculate Financial Health & Protection Scores
    # Emergency Fund Score (Target: 6 months of monthly expenses)
    emergency_target = monthly_expenses * 6
    emergency_savings = sum(g.current_amount for g in goals if "emergency" in g.goal_name.lower())
    # If no emergency goal, use total goals as proxy capped at target
    if emergency_savings == 0:
        emergency_savings = min(total_savings_goals, emergency_target)
    
    emergency_score = min((emergency_savings / max(emergency_target, 1.0)) * 100, 100.0)

    # Insurance / Protection Score
    has_health = any(p.policy_type.lower() == "health" for p in policies)
    has_life = any(p.policy_type.lower() in ["life", "term"] for p in policies)
    
    protection_score = 0
    if has_health:
        protection_score += 50
    if has_life:
        protection_score += 50

    # Wealth Building Score (Equity / Invested assets allocation vs cash)
    invested_ratio = (positions_value / total_assets) if total_assets > 0 else 0
    # Ideal: 40-70% in investments
    if 0.4 <= invested_ratio <= 0.7:
        wealth_building_score = 100.0
    elif invested_ratio > 0.7:
        wealth_building_score = 80.0
    else:
        wealth_building_score = min((invested_ratio / 0.4) * 100, 100.0)

    # Overall Financial Score
    financial_health_score = (emergency_score + protection_score + wealth_building_score + fi_progress) / 4.0

    # 7. Generate Proactive Insights
    insights = []
    
    if protection_score < 100:
        missing_type = "Health and Life"
        if has_health and not has_life:
            missing_type = "Life/Term"
        elif has_life and not has_health:
            missing_type = "Health"
            
        insights.append({
            "category": "Finance",
            "title": "Insurance Coverage Gap",
            "message": f"You are missing active {missing_type} insurance. Register a policy in the Insurance tracker to secure your family protection.",
            "priority": "high"
        })
        
    if emergency_score < 80:
        insights.append({
            "category": "Finance",
            "title": "Emergency Fund Underfunded",
            "message": f"Your emergency fund covers less than 6 months of expenses. Save another ₹{(emergency_target - emergency_savings):,.2f} to hit your safety cushion.",
            "priority": "high"
        })
        
    if len(positions) == 0:
        insights.append({
            "category": "Trading",
            "title": "Start Paper Trading",
            "message": "You have no active virtual portfolio positions. Explore the Screener and place a sandbox order to start building market experience.",
            "priority": "medium"
        })
    else:
        insights.append({
            "category": "Trading",
            "title": "Review Current Positions",
            "message": f"You have {len(positions)} active holdings. Keep track of technical signals (RSI/MFI) for dynamic scale-out alerts.",
            "priority": "medium"
        })

    # Add default positive insights if few alerts
    if len(insights) < 3:
        insights.append({
            "category": "Finance",
            "title": "Savings Shield Active",
            "message": "Building consistent savings goals helps accelerate your path to Financial Independence.",
            "priority": "low"
        })

    # 8. Gamification Level & FIRE Roadmap
    roadmap = [
        {
            "stage": 1,
            "title": "Establish Foundation",
            "requirement": "Set up your account profile details",
            "is_completed": True,
            "action_link": "/profile"
        },
        {
            "stage": 2,
            "title": "Risk Protection",
            "requirement": "Log health or term life insurance policies",
            "is_completed": has_health or has_life,
            "action_link": "/finance/insurance"
        },
        {
            "stage": 3,
            "title": "Emergency Cushion",
            "requirement": "Fund a 6-month living expense safety cushion",
            "is_completed": emergency_score >= 99.0,
            "action_link": "/finance/emergency-fund"
        },
        {
            "stage": 4,
            "title": "Wealth Accelerator",
            "requirement": "Place a paper trade to start equity exposure",
            "is_completed": len(positions) > 0,
            "action_link": "/screener"
        },
        {
            "stage": 5,
            "title": "Wealth Accumulator",
            "requirement": "Reach 25% of your target FIRE FI Number",
            "is_completed": fi_progress >= 25.0,
            "action_link": "/finance/goals"
        },
        {
            "stage": 6,
            "title": "Financial Freedom",
            "requirement": "Achieve 100% of your target FIRE FI Number",
            "is_completed": fi_progress >= 100.0,
            "action_link": "/"
        }
    ]

    gamified_level = 1
    for step in roadmap:
        if step["is_completed"]:
            gamified_level = step["stage"]
        else:
            break

    xp_to_next = 1000 - int((fi_progress % 25) * 40)

    # 9. Format response
    return {
        "net_worth": {
            "assets": {
                "portfolio_cash": cash,
                "portfolio_holdings": positions_value,
                "savings_goals": total_savings_goals,
                "gold": manual_assets_total
            },
            "liabilities": {
                "loans": total_liabilities
            },
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "net_worth_value": net_worth
        },
        "fire": {
            "annual_expenses": annual_expenses,
            "fi_number": fi_number,
            "progress_pct": fi_progress,
            "estimated_fi_year": estimated_fi_year,
            "years_remaining": years_to_fi
        },
        "scores": {
            "financial_health": financial_health_score,
            "emergency_fund": emergency_score,
            "protection": protection_score,
            "wealth_building": wealth_building_score
        },
        "gamification": {
            "level": gamified_level,
            "xp_to_next": xp_to_next
        },
        "roadmap": roadmap,
        "insights": insights
    }
