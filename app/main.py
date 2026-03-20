from fastapi import FastAPI
from app.routes.auth_routes import router as auth_router
from app.routes.stock_routes import router as stock_router
from app.routes.strategy_routes import router as strategy_router
from app.routes.portfolio_routes import router as portfolio_router
from app.routes.test_strategy import router as test_strategy
from app.routes.finance_news import router as finance_news
from app.routes.buy import router as buy
from app.routes.scanner import router as scanner
from app.utils.scheduler import start_scheduler

# from app.utils.scheduler import start_scheduler

app = FastAPI()

app.include_router(stock_router)
app.include_router(strategy_router)
app.include_router(portfolio_router)
app.include_router(auth_router)
app.include_router(test_strategy)
app.include_router(finance_news)
app.include_router(buy)
app.include_router(scanner)

@app.get("/")
def home():

    return {"message": "AI Trading System Running"}

start_scheduler()