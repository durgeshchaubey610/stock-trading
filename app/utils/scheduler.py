from apscheduler.schedulers.background import BackgroundScheduler
from app.services.stock_scanner import scan_stocks
from app.services.strategy_engine import get_strategy
from app.database import SessionLocal

def run_all_users():

    db = SessionLocal()

    users = db.execute("SELECT user_strategy.*, strategy.name as strategy_name FROM user_strategy left join strategy on strategy.id = user_strategy.strategy_id").fetchall()

    stocks = scan_stocks()

    for user in users:

        strategy = get_strategy(user.strategy_name)

        for stock in stocks:

            strategy.execute(stock, user.user_id)

def start_scheduler():

    scheduler = BackgroundScheduler()

    scheduler.add_job(
        run_all_users,
        "cron",
        hour=15,
        minute=5
    )

    scheduler.start()