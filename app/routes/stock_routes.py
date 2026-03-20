from fastapi import APIRouter
from app.services.stock_scanner import scan_stocks

router = APIRouter()

@router.get("/stocks")

def get_stocks():

    stocks = scan_stocks()

    return {"stocks": stocks}