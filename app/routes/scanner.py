from fastapi import APIRouter
from app.services.scanner_engine import run_scanner

router = APIRouter()

@router.get("/scanner/top-stocks")
def top_stocks():
    return run_scanner()