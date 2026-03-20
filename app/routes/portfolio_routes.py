from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.schemas.portfolio_schema import PortfolioCreate

from app.services.portfolio_service import (
    get_portfolio_service,
    add_portfolio_service,
    remove_stock_service
)

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("/")
def get_portfolio(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_portfolio_service(user["user_id"], db)


@router.post("/add")
def add_portfolio(
    data: PortfolioCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return add_portfolio_service(user["user_id"], data, db)


@router.delete("/remove/{buy_number}")
def remove_stock(
    buy_number: int,
    remove_quantity: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return remove_stock_service(
        user["user_id"],
        buy_number,
        remove_quantity,
        db
    )