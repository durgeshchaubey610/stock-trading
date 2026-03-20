import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user

from app.services.data_engine import get_stock_data_low
from app.services.sector_strength_engine import sector_strength
from app.services.portfolio_service import get_portfolio_service, add_portfolio_service

from app.data.nifty200 import sectors

router = APIRouter()

BUY_TIME_HOUR = 15


@router.get("/run-strategy")
def run_weekly_strategy(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    now = datetime.datetime.now()

    # Optional time check
    # if now.weekday() != 3 or now.hour != BUY_TIME_HOUR:
    #     return {"status": "not trading time"}

    portfolio = get_portfolio_service(user["user_id"], db)

    results = []

    # Step 1: Find strong sectors
    strong_sectors = sector_strength(sectors)

    # Step 2: Scan stocks
    for sector in strong_sectors:

        for symbol in sectors[sector]:

            stock = get_stock_data_low(symbol)

            if not stock:
                continue

            price = stock["price"]
            low52 = stock["week52_low"]

            discount = (price - low52) / low52 * 100

            # Buy near 52-week low
            if discount <= 10:

                # NEW BUY
                if symbol not in portfolio:

                    data = {
                        "stock_symbol": symbol,
                        "buy_price": price,
                        "quantity": 1,
                        "buy_number": 1,
                        "action": 1  # BUY
                    }

                    add_portfolio_service(user["user_id"], data, db)

                    results.append({
                        "action": "NEW_BUY",
                        "symbol": symbol,
                        "price": price,
                        "sector": sector
                    })

                # AVERAGING
                else:

                    last_buy = float(portfolio[symbol]["avg_price"])

                    if price <= last_buy * 0.95:

                        qty = portfolio[symbol]["qty"] * 2

                        data = {
                            "stock_symbol": symbol,
                            "buy_price": price,
                            "quantity": qty,
                            "buy_number": 2,
                            "action": 1
                        }

                        add_portfolio_service(user["user_id"], data, db)

                        results.append({
                            "action": "AVERAGE",
                            "symbol": symbol,
                            "qty": qty,
                            "price": price
                        })

    if not results:
        return {"status": "no opportunity"}

    return {
        "status": "success",
        "trades": results
    }