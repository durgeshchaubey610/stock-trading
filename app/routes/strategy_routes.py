from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.schemas.strategy_schema import StrategySelectionRequest
from app.services.strategy_engine import get_strategy

router = APIRouter()

@router.post("/select-strategy")
def select_strategy(
    data: StrategySelectionRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    strategy_name = data.strategy.lower()

    if get_strategy(strategy_name) is None:
        raise HTTPException(status_code=400, detail="Unknown strategy")

    db.execute(
        text("""
        DELETE FROM user_strategy
        WHERE user_id = :user_id
        """),
        {"user_id": user["user_id"]}
    )

    db.execute(
        text("""
        INSERT INTO user_strategy(user_id, strategy_name)
        VALUES (:user_id, :strategy_name)
        """),
        {"user_id": user["user_id"], "strategy_name": strategy_name}
    )

    db.commit()

    return {"message": "Strategy saved"}
