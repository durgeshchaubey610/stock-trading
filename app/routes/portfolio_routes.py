from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.schemas.portfolio_schema import PortfolioCreate
from app.services.paper_trading_service import PaperTradingService
from app.services.price_service import PriceService

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("/")
def get_portfolio(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PaperTradingService.get_portfolio_analytics(db, user["user_id"])


@router.post("/add")
def add_portfolio(
    data: PortfolioCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    action_str = "BUY" if data.action == 1 else "SELL"
    PaperTradingService.place_order(
        db, user["user_id"], data.stock_symbol, data.quantity, data.buy_price, "Market", action_str
    )
    return {"message": f"Stock {action_str.lower()} transaction recorded"}


@router.delete("/remove/{stock_symbol}/{buy_number}")
def remove_stock(
    stock_symbol: str,
    buy_number: int,
    remove_quantity: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_prices = PriceService.get_latest_prices([stock_symbol])
    current_price = current_prices.get(stock_symbol, 0.0)
    if current_price == 0.0:
        from app.models.paper_trading import PaperPosition
        pos = db.query(PaperPosition).filter(
            PaperPosition.user_id == user["user_id"],
            PaperPosition.stock_symbol == stock_symbol.upper()
        ).first()
        current_price = pos.avg_buy_price if pos else 100.0

    PaperTradingService.place_order(
        db, user["user_id"], stock_symbol, remove_quantity, current_price, "Market", "SELL"
    )
    return {"message": "Stock holding updated via sell order"}
