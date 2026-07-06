from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.schemas.backtest_schema import BacktestRequest
from app.services.backtest_service import BacktestService

router = APIRouter(prefix="/backtest", tags=["Backtest"])

@router.post("")
def backtest_strategy(
    request: BacktestRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes backtest simulation for a custom user investment strategy on yfinance historical data.
    """
    return BacktestService.backtest_strategy(db, request)
