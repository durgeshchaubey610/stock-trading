from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import text
import asyncio
import logging
from pytz import timezone
from datetime import datetime

from app.services.stock_scanner import scan_stocks
from app.database import SessionLocal
from app.services.alert_service import AlertService
from app.services.stock_sync_service import StockSyncService
# from app.services.swing_trade_service import SwingTradeService

scheduler = BackgroundScheduler()
logger = logging.getLogger(__name__)
ist = timezone('Asia/Kolkata')

def evaluate_alerts_job():
    logger.info("Evaluating user alerts via scheduler...")
    db = SessionLocal()
    try:
        asyncio.run(AlertService.evaluate_alerts(db))
    except Exception as e:
        logger.error(f"Error running alert evaluation: {e}")
    finally:
        db.close()

def health_alarms_job():
    logger.info("Checking health alarms and medication schedules...")
    # This would query medicine_schedules and doctor_records and send notifications
    # Implementation of NotificationService call would go here
    pass

def start_scheduler():
    if scheduler.running:
        return scheduler

    # 1. Yahoo Finance Scheduler
    # Every hour at minute 15 between 9:15 AM and 3:15 PM IST (Mon-Fri)
    scheduler.add_job(
        StockSyncService.run_sync_job,
        "cron",
        day_of_week='mon-fri',
        hour='9-15',
        minute='15',
        timezone=ist,
        id="periodic_stock_update",
        replace_existing=True
    )

    # 2. AI Daily Picks: 10:00 AM and 1:00 PM IST (Mon-Fri) [DISABLED/COMMENTED]
    # scheduler.add_job(
    #     SwingTradeService.run_daily_job,
    #     "cron",
    #     day_of_week='mon-fri',
    #     hour='10,13',
    #     minute=0,
    #     timezone=ist,
    #     id="daily_ai_picks",
    #     replace_existing=True
    # )

    # 3. Alert evaluation: Every 5 minutes during market hours
    scheduler.add_job(
        evaluate_alerts_job,
        "cron",
        day_of_week='mon-fri',
        hour='9-14',
        minute='*/5',
        timezone=ist,
        id="evaluate_alerts",
        replace_existing=True
    )

    # 4. Health Alarms: Every 15 minutes
    scheduler.add_job(
        health_alarms_job,
        "interval",
        minutes=15,
        id="health_alarms",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started with market hours constraints (IST).")
    return scheduler
