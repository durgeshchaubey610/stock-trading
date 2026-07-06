from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.routes.auth_routes import router as auth_router
from app.routes.stock_routes import router as stock_router
from app.routes.portfolio_routes import router as portfolio_router
from app.routes.finance_news import router as finance_news
from app.routes.buy import router as buy
from app.routes.scanner import router as scanner
from app.routes.webhook_routes import router as webhook_router
from app.routes.alert_routes import router as alert_router
from app.routes.profile_routes import router as profile_router
from app.routes.template_routes import router as template_router
from app.routes.basket_routes import router as basket_router
from app.routes.paper_trading_routes import router as paper_trading_router
from app.routes.finance_routes import router as finance_router
from app.routes.subscription_routes import router as subscription_router
from app.routes.backtest_routes import router as backtest_router
from app.routes.dashboard_routes import router as dashboard_router
from app.logging_config import configure_logging

from app.utils.scheduler import scheduler, start_scheduler

# from app.utils.scheduler import start_scheduler

configure_logging()

from app.database import engine, Base
# Register models
from app.models.user import User
from app.models.stock import Stock, StockSector, StockBasket, BasketStock
from app.models.daily_pick import DailyPick
from app.models.alert import Alert
from app.models.screener_template import ScreenerTemplate
from app.models.basket import InvestmentBasket
from app.models.stock_details import (
    StockFinancials, StockGrowth, StockValuation, StockOwnership,
    StockTechnicals, StockScores, StockForecasts, StockNews, StockEvents
)
from app.models.paper_trading import (
    PaperPortfolio, PaperPosition, PaperOrder, PaperTrade, PaperJournal
)
from app.models.finance import SavingsGoal, InsurancePolicy, AssetLog, LiabilityLog, FireProfile
from app.models.watchlist import Watchlist
from app.models.subscription import SubscriptionPlan, UserInvoice

# Create tables if they don't exist (skip when running tests)
import sys
if "pytest" not in sys.modules:
    Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    try:
        yield
    finally:
        if scheduler.running:
            scheduler.shutdown(wait=False)


from app.routes.monitoring import router as monitoring_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allowing all. Change to specific origins for production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock_router)
app.include_router(portfolio_router)
app.include_router(auth_router)
app.include_router(finance_news)
app.include_router(buy)
app.include_router(scanner)
app.include_router(webhook_router)
app.include_router(alert_router)
app.include_router(profile_router)
app.include_router(template_router)
app.include_router(basket_router)
app.include_router(paper_trading_router)
app.include_router(finance_router)
app.include_router(subscription_router)
app.include_router(monitoring_router)
app.include_router(backtest_router)
app.include_router(dashboard_router)


@app.get("/")
def home():
    return {"message": "AI Trading System Running"}
