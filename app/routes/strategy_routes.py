from fastapi import APIRouter
from app.database import SessionLocal

router = APIRouter()

@router.post("/select-strategy")

def select_strategy(user_id: int, strategy: str):

    db = SessionLocal()

    db.execute(
        "INSERT INTO user_strategy(user_id,strategy_id) VALUES (%s,%s)",
        (user_id, strategy)
    )

    db.commit()

    return {"message": "Strategy saved"}