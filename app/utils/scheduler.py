from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import text

from app.services.stock_scanner import scan_stocks
from app.services.strategy_engine import get_strategy
from app.database import SessionLocal


scheduler = BackgroundScheduler()


def run_all_users():

    db = SessionLocal()
    try:
        users = db.execute(
            text("""
            SELECT user_id, strategy_name
            FROM user_strategy
            """)
        ).mappings().all()

        stocks = scan_stocks()

        for user in users:
            strategy = get_strategy(user["strategy_name"])
            if strategy is None:
                continue

            for stock in stocks:
                strategy.execute(stock, user["user_id"])
    finally:
        db.close()

def start_scheduler():
    if scheduler.running:
        return scheduler

    scheduler.add_job(
        run_all_users,
        "cron",
        id="run_all_users",
        replace_existing=True,
        hour=15,
        minute=5
    )

    scheduler.start()
    return scheduler
