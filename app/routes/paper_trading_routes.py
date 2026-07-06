from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import require_pro
from app.services.paper_trading_service import PaperTradingService
from pydantic import BaseModel
from typing import Optional, List
from app.models.user import User

router = APIRouter(prefix="/paper-trading", tags=["Paper Trading"])

class OrderRequest(BaseModel):
    symbol: str
    quantity: int
    price: float
    order_type: str # Market, Limit, Stop Loss
    action: str # BUY, SELL

class JournalRequest(BaseModel):
    symbol: str
    notes: str
    reasoning: str

@router.get("/portfolio")
def get_portfolio(user: User = Depends(require_pro), db: Session = Depends(get_db)):
    return PaperTradingService.get_portfolio_analytics(db, user.id)

@router.get("/history")
def get_trade_history(user: User = Depends(require_pro), db: Session = Depends(get_db)):
    return PaperTradingService.get_trade_history(db, user.id)

@router.get("/watchlist")
def get_watchlist(user: User = Depends(require_pro), db: Session = Depends(get_db)):
    return PaperTradingService.get_watchlist(db, user.id)

@router.post("/watchlist/add")
def add_to_watchlist(symbol: str, user: User = Depends(require_pro), db: Session = Depends(get_db)):
    return PaperTradingService.add_to_watchlist(db, user.id, symbol)

@router.delete("/watchlist/{symbol}")
def remove_from_watchlist(symbol: str, user: User = Depends(require_pro), db: Session = Depends(get_db)):
    return PaperTradingService.remove_from_watchlist(db, user.id, symbol)

@router.post("/order")
def place_order(order: OrderRequest, user: User = Depends(require_pro), db: Session = Depends(get_db)):
    return PaperTradingService.place_order(
        db, user.id, order.symbol, order.quantity, order.price, order.order_type, order.action
    )

@router.post("/journal")
def add_journal(entry: JournalRequest, user: User = Depends(require_pro), db: Session = Depends(get_db)):
    return PaperTradingService.add_journal_entry(
        db, user.id, entry.symbol, entry.notes, entry.reasoning
    )

# Note: In a real implementation, I'd need to register this router in app/main.py.
