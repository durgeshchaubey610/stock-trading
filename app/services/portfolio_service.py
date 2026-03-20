from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException
from datetime import datetime


def get_portfolio_service(user_id: int, db: Session):

    result = db.execute(
        text("""
            SELECT 
                stock_symbol,
                SUM(quantity) AS total_quantity,
                AVG(buy_price) AS avg_buy_price
            FROM portfolio
            WHERE user_id = :uid
            GROUP BY stock_symbol
        """),
        {"uid": user_id}
    )

    rows = result.mappings().all()

    portfolio = {}

    for row in rows:
        portfolio[row["stock_symbol"]] = {
            "qty": row["total_quantity"],
            "avg_price": row["avg_buy_price"]
        }

    return portfolio


# ✅ FIXED FUNCTION (DICT BASED)
def add_portfolio_service(user_id: int, data: dict, db: Session):

    # SELL = action 2
    if data["action"] == 2:
        data["quantity"] = -abs(data["quantity"])

    investment = data["buy_price"] * data["quantity"]

    db.execute(
        text("""
        INSERT INTO portfolio
        (user_id, stock_symbol, buy_price, quantity, buy_number, investment, created_at, action)
        VALUES (:uid, :symbol, :price, :qty, :bnum, :inv, :created, :action)
        """),
        {
            "uid": user_id,
            "symbol": data["stock_symbol"],
            "price": data["buy_price"],
            "qty": data["quantity"],
            "bnum": data["buy_number"],
            "inv": investment,
            "created": datetime.utcnow(),
            "action": data["action"]
        }
    )

    db.commit()

    return {"message": "Stock added to portfolio"}


def remove_stock_service(user_id: int, buy_number: int, remove_quantity: int, db: Session):

    result = db.execute(
        text("""
        SELECT quantity, buy_price
        FROM portfolio
        WHERE user_id = :uid AND buy_number = :bnum
        """),
        {"uid": user_id, "bnum": buy_number}
    ).mappings().first()

    if not result:
        raise HTTPException(status_code=404, detail="Stock not found")

    current_qty = result["quantity"]
    buy_price = result["buy_price"]

    if remove_quantity > current_qty:
        raise HTTPException(status_code=400, detail="Not enough quantity")

    remaining_qty = current_qty - remove_quantity

    if remaining_qty == 0:

        db.execute(
            text("""
            DELETE FROM portfolio
            WHERE user_id = :uid AND buy_number = :bnum
            """),
            {"uid": user_id, "bnum": buy_number}
        )

    else:

        new_investment = remaining_qty * buy_price

        db.execute(
            text("""
            UPDATE portfolio
            SET quantity = :qty, investment = :inv
            WHERE user_id = :uid AND buy_number = :bnum
            """),
            {
                "qty": remaining_qty,
                "inv": new_investment,
                "uid": user_id,
                "bnum": buy_number
            }
        )

    db.commit()

    return {
        "message": "Stock quantity updated",
        "removed_quantity": remove_quantity,
        "remaining_quantity": remaining_qty
    }