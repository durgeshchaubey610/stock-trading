from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session


def get_portfolio_service(user_id: int, db: Session):
    result = db.execute(
        text(
            """
            SELECT
                stock_symbol,
                SUM(quantity) AS total_quantity,
                CASE
                    WHEN SUM(quantity) > 0
                    THEN SUM(quantity * buy_price) / SUM(quantity)
                    ELSE 0
                END AS avg_buy_price
            FROM portfolio
            WHERE user_id = :uid
              AND quantity > 0
            GROUP BY stock_symbol
            HAVING SUM(quantity) > 0
            """
        ),
        {"uid": user_id},
    )

    rows = result.mappings().all()

    portfolio = {}
    for row in rows:
        portfolio[row["stock_symbol"]] = {
            "qty": int(row["total_quantity"]),
            "avg_price": float(row["avg_buy_price"]),
        }

    return portfolio


def add_portfolio_service(user_id: int, data, db: Session):
    if hasattr(data, "model_dump"):
        data = data.model_dump()
    elif not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Invalid portfolio payload")

    action = int(data["action"])
    if action not in (1, 2):
        raise HTTPException(status_code=400, detail="Invalid action")

    quantity = int(data["quantity"])
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    buy_price = float(data["buy_price"])
    if buy_price <= 0:
        raise HTTPException(status_code=400, detail="Buy price must be greater than 0")

    symbol = str(data["stock_symbol"]).upper().strip()
    if not symbol:
        raise HTTPException(status_code=400, detail="Stock symbol is required")

    next_buy_number = db.execute(
        text(
            """
            SELECT COALESCE(MAX(buy_number), 0) + 1 AS next_buy_number
            FROM portfolio
            WHERE user_id = :uid AND stock_symbol = :symbol
            """
        ),
        {"uid": user_id, "symbol": symbol},
    ).scalar_one()

    signed_quantity = -abs(quantity) if action == 2 else quantity
    investment = buy_price * signed_quantity

    db.execute(
        text(
            """
            INSERT INTO portfolio
            (user_id, stock_symbol, buy_price, quantity, buy_number, investment, created_at, action)
            VALUES (:uid, :symbol, :price, :qty, :bnum, :inv, :created, :action)
            """
        ),
        {
            "uid": user_id,
            "symbol": symbol,
            "price": buy_price,
            "qty": signed_quantity,
            "bnum": next_buy_number,
            "inv": investment,
            "created": datetime.utcnow(),
            "action": action,
        },
    )

    db.commit()

    return {"message": "Stock added to portfolio", "buy_number": int(next_buy_number)}


def remove_stock_service(
    user_id: int,
    stock_symbol: str,
    buy_number: int,
    remove_quantity: int,
    db: Session,
):
    symbol = stock_symbol.upper().strip()
    if not symbol:
        raise HTTPException(status_code=400, detail="Stock symbol is required")
    if remove_quantity <= 0:
        raise HTTPException(status_code=400, detail="Remove quantity must be greater than 0")

    result = db.execute(
        text(
            """
            SELECT quantity, buy_price
            FROM portfolio
            WHERE user_id = :uid
              AND stock_symbol = :symbol
              AND buy_number = :bnum
            """
        ),
        {"uid": user_id, "symbol": symbol, "bnum": buy_number},
    ).mappings().first()

    if not result:
        raise HTTPException(status_code=404, detail="Stock lot not found")

    current_qty = int(result["quantity"])
    buy_price = float(result["buy_price"])

    if current_qty <= 0:
        raise HTTPException(status_code=400, detail="Cannot remove from non-buy position")

    if remove_quantity > current_qty:
        raise HTTPException(status_code=400, detail="Not enough quantity")

    remaining_qty = current_qty - remove_quantity

    if remaining_qty == 0:
        db.execute(
            text(
                """
                DELETE FROM portfolio
                WHERE user_id = :uid
                  AND stock_symbol = :symbol
                  AND buy_number = :bnum
                """
            ),
            {"uid": user_id, "symbol": symbol, "bnum": buy_number},
        )
    else:
        db.execute(
            text(
                """
                UPDATE portfolio
                SET quantity = :qty, investment = :inv
                WHERE user_id = :uid
                  AND stock_symbol = :symbol
                  AND buy_number = :bnum
                """
            ),
            {
                "qty": remaining_qty,
                "inv": remaining_qty * buy_price,
                "uid": user_id,
                "symbol": symbol,
                "bnum": buy_number,
            },
        )

    db.commit()

    return {
        "message": "Stock quantity updated",
        "stock_symbol": symbol,
        "buy_number": buy_number,
        "removed_quantity": remove_quantity,
        "remaining_quantity": remaining_qty,
    }
