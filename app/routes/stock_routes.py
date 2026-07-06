from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.encoders import jsonable_encoder
from app.services.stock_scanner import scan_stocks
from app.services.data_engine import get_historical_ohlcv
from app.services.scanner_engine import run_scanner
from app.services.news_service import get_news_for_symbol
from app.auth import require_premium
from app.database import get_db
from app.models.stock import Stock, StockPriceHistory, StockSector
from datetime import datetime, timedelta
from app.models.daily_pick import DailyPick
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
import yfinance as yf
import math
from app.services.sector_service import SectorService

router = APIRouter(prefix="/stocks", tags=["Stocks"])

from sqlalchemy import or_, desc, asc

def sanitize_float(val):
    """Ensures a value is a JSON-compliant float (not NaN or Inf)."""
    if val is None or (isinstance(val, float) and not math.isfinite(val)):
        return 0.0
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0

def serialize_stock(stock: Stock) -> dict:
    if not stock:
        return {}
    data = jsonable_encoder(stock)
    data["company_name"] = stock.name
    data["sector"] = stock.sector or stock.sub_sector
    data["technical_signal"] = stock.signal
    return data

@router.get("/daily-picks")
def get_daily_picks(db: Session = Depends(get_db)):
    """
    Returns latest AI daily picks for the header.
    """
    result = []
    return {"picks": result}

@router.get("")
def get_stocks(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    search: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    signal: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """
    Returns a paginated list of stocks from the database with all fundamental and technical metrics.
    Supports filtering by search (symbol/name), sector, and signal, plus sorting.
    """
    query = db.query(Stock)

    # Filtering
    if search:
        query = query.filter(or_(
            Stock.symbol.ilike(f"%{search}%"),
            Stock.name.ilike(f"%{search}%")
        ))
    
    if sector:
        query = query.filter(or_(
            Stock.sector == sector,
            Stock.sub_sector == sector
        ))
    
    if signal:
        query = query.filter(Stock.signal == signal)

    # Sorting
    if sort_by and hasattr(Stock, sort_by):
        col = getattr(Stock, sort_by)
        if sort_order == "desc":
            query = query.order_by(desc(col))
        else:
            query = query.order_by(asc(col))
    else:
        # Default sort by market cap or ID
        query = query.order_by(desc(Stock.market_cap))

    offset = (page - 1) * page_size
    total = query.count()
    stocks = query.offset(offset).limit(page_size).all()
    
    return {
        "page": page,
        "page_size": page_size,
        "total_count": total,
        "stocks": [serialize_stock(s) for s in stocks]
    }

@router.get("/value-picks")
def get_value_stocks(db: Session = Depends(get_db)):
    """
    Returns stocks that match high-growth and high-quality criteria.
    Criteria: Promoter > 50%, FII > 5%, Growth > 5%, RSI > 69, MFI > 79.
    """
    stocks = db.query(Stock).filter(
        Stock.promoter_holding > 50,
        Stock.fii_holding > 5,
        Stock.forward_1y_growth > 5,
        Stock.forward_1y_ebitda_growth > 5,
        Stock.forward_1y_eps_growth > 5,
        Stock.rsi > 69,
        Stock.mfi > 79
    ).order_by(Stock.rsi.desc()).all()
    
    return [serialize_stock(s) for s in stocks]

@router.get("/sectors")
def get_sectors(db: Session = Depends(get_db)):
    """
    Returns all parent sectors and sub-sectors from the database.
    """
    parent_sectors = [s[0] for s in db.query(StockSector.name).distinct().all() if s[0]]
    sub_sectors = [s[0] for s in db.query(Stock.sub_sector).distinct().all() if s[0]]
    return {
        "sectors": sorted(parent_sectors),
        "sub_sectors": sorted(sub_sectors)
    }

@router.get("/benchmarks")
def get_sector_benchmarks(limit: int = Query(50, description="Number of stocks to use for benchmarking")):
    """
    Calculates and returns sector-wide benchmarks based on a subset of stocks.
    """
    from app.data.nifty500 import nifty500
    import app.services.scanner_engine
    
    original_nifty = app.services.scanner_engine.nifty500
    # Use a subset for speed in this demo/endpoint
    app.services.scanner_engine.nifty500 = original_nifty[:limit]
    
    try:
        results = run_scanner(fetch_fundamentals=True)
        benchmarks = SectorService.calculate_benchmarks(results)
        return {
            "stocks_scanned": len(results),
            "benchmarks": benchmarks
        }
    finally:
        app.services.scanner_engine.nifty500 = original_nifty

from sqlalchemy.orm import Session, joinedload

from app.schemas.scanner_schema import ScreenRequest
from app.services.screener_service import ScreenerService

@router.post("/screen")
def screen_stocks(request: ScreenRequest, db: Session = Depends(get_db)):
    """
    Advanced screening endpoint that supports complex nested filters and institutional metrics.
    """
    res = ScreenerService.screen_stocks(db, request)
    res["stocks"] = [serialize_stock(s) for s in res["stocks"]]
    return res

@router.get("/{symbol}")
def get_stock_detail(symbol: str, db: Session = Depends(get_db)):
    """
    Returns full details for a single stock by its symbol, including all normalized detail tables.
    """
    stock = db.query(Stock).options(
        joinedload(Stock.sector_rel),
        joinedload(Stock.financials),
        joinedload(Stock.growth),
        joinedload(Stock.valuation),
        joinedload(Stock.technicals),
        joinedload(Stock.scores),
        joinedload(Stock.forecasts),
        joinedload(Stock.news),
        joinedload(Stock.events)
    ).filter(Stock.symbol == symbol).first()
    
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock with symbol {symbol} not found")
    
    res = serialize_stock(stock)
    for rel in ["financials", "growth", "valuation", "technicals", "scores", "forecasts", "news", "events", "sector_rel"]:
        if hasattr(stock, rel) and getattr(stock, rel) is not None:
            res[rel] = jsonable_encoder(getattr(stock, rel))
    return res

@router.get("/{symbol}/sentiment")
def get_stock_sentiment(symbol: str, current_user=Depends(require_premium)):
    """
    Fetches latest news for a stock and performs AI-based sentiment analysis.
    """
    result = get_news_for_symbol(symbol)
    if not result or result["article_count"] == 0:
        raise HTTPException(status_code=404, detail=f"No news found for symbol {symbol}")
    return result

@router.get("/{symbol}/chart")
def get_stock_chart(
    symbol: str,
    period: str = Query("1y", description="Data period (e.g., 1d, 5d, 1mo, 1y, max)"),
    interval: str = Query(None, description="Data interval (e.g., 1m, 5m, 1h, 1d, 1wk)"),
    db: Session = Depends(get_db)
):
    """
    Returns historical OHLCV data for a specific stock.
    Attempts to read from the database cache first; otherwise downloads and caches from yfinance.
    """
    period_lower = period.lower()
    
    # Map periods to valid yfinance periods
    period_mapping = {
        "1d": "1d",
        "1w": "5d",
        "5d": "5d",
        "1m": "1mo",
        "1mo": "1mo",
        "3m": "3mo",
        "6m": "6mo",
        "1y": "1y",
        "5y": "5y",
        "max": "max"
    }
    
    mapped_period = period_mapping.get(period_lower, "1y")
    
    # Choose best default interval if none is provided
    if not interval:
        if mapped_period == "1d":
            interval = "5m"
        elif mapped_period == "5d":
            interval = "15m"
        elif mapped_period in ["1mo", "3mo"]:
            interval = "1d"
        else:
            interval = "1d"
            
    # Find stock in database
    stock = db.query(Stock).filter(Stock.symbol == symbol).first()
    if not stock:
        # Create a basic stock record if it doesn't exist
        stock = Stock(symbol=symbol, name=symbol)
        db.add(stock)
        db.commit()
        db.refresh(stock)

    # Check database cache
    cached_data = db.query(StockPriceHistory).filter(
        StockPriceHistory.stock_id == stock.id,
        StockPriceHistory.period == mapped_period,
        StockPriceHistory.interval == interval
    ).order_by(StockPriceHistory.time.asc()).all()

    # Determine cache validity: 
    # For intraday (1d), cache is valid for 15 minutes.
    # For others, cache is valid for 12 hours.
    cache_valid = False
    if cached_data:
        last_cached = cached_data[-1].created_at
        cache_duration = timedelta(minutes=15) if mapped_period == "1d" else timedelta(hours=12)
        if datetime.utcnow() - last_cached < cache_duration:
            cache_valid = True

    if cache_valid:
        chart_data = []
        for point in cached_data:
            chart_data.append({
                "time": point.time.strftime("%Y-%m-%d %H:%M:%S") if interval != "1d" else point.time.strftime("%Y-%m-%d"),
                "open": point.open,
                "high": point.high,
                "low": point.low,
                "close": point.close,
                "volume": point.volume
            })
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "data": chart_data
        }

    # Cache is invalid or empty: fetch from yfinance
    df = get_historical_ohlcv(symbol, mapped_period, interval)

    if df is None or df.empty:
        # Fallback to existing cached data if yfinance query failed
        if cached_data:
            chart_data = []
            for point in cached_data:
                chart_data.append({
                    "time": point.time.strftime("%Y-%m-%d %H:%M:%S") if interval != "1d" else point.time.strftime("%Y-%m-%d"),
                    "open": point.open,
                    "high": point.high,
                    "low": point.low,
                    "close": point.close,
                    "volume": point.volume
                })
            return {
                "symbol": symbol,
                "period": period,
                "interval": interval,
                "data": chart_data
            }
        raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")

    # Process and cache yfinance data
    df = df.reset_index()
    if isinstance(df.columns, pd.MultiIndex):
        if any(metric in df.columns.get_level_values(0) for metric in ["Open", "High", "Low", "Close"]):
            df.columns = df.columns.get_level_values(0)
        elif any(metric in df.columns.get_level_values(1) for metric in ["Open", "High", "Low", "Close"]):
            df.columns = df.columns.get_level_values(1)
        else:
            df.columns = [col[0] if col[1] == "" else col[1] for col in df.columns]

    df.columns = [str(c).replace(symbol, "").strip() if symbol in str(c) and str(c) != symbol else str(c) for c in df.columns]

    # Delete old cache records
    db.query(StockPriceHistory).filter(
        StockPriceHistory.stock_id == stock.id,
        StockPriceHistory.period == mapped_period,
        StockPriceHistory.interval == interval
    ).delete()

    chart_data = []
    for _, row in df.iterrows():
        time_val = row.get("Date") or row.get("Datetime") or row.get("index")
        if time_val is None:
            continue
            
        if not isinstance(time_val, datetime):
            try:
                time_val = pd.to_datetime(time_val)
            except:
                continue

        # Format string for JSON response
        time_str = time_val.strftime("%Y-%m-%d %H:%M:%S") if interval != "1d" else time_val.strftime("%Y-%m-%d")

        try:
            open_val = sanitize_float(row.get("Open", 0))
            high_val = sanitize_float(row.get("High", 0))
            low_val = sanitize_float(row.get("Low", 0))
            close_val = sanitize_float(row.get("Close", 0))
            volume_val = int(row["Volume"]) if "Volume" in row and math.isfinite(row["Volume"]) else 0

            # Insert into database cache
            history_record = StockPriceHistory(
                stock_id=stock.id,
                time=time_val,
                open=open_val,
                high=high_val,
                low=low_val,
                close=close_val,
                volume=volume_val,
                period=mapped_period,
                interval=interval
            )
            db.add(history_record)

            chart_data.append({
                "time": time_str,
                "open": open_val,
                "high": high_val,
                "low": low_val,
                "close": close_val,
                "volume": volume_val
            })
        except (KeyError, ValueError, TypeError):
            continue

    db.commit()

    return {
        "symbol": symbol,
        "period": period,
        "interval": interval,
        "data": chart_data
    }

@router.get("/{symbol}/financials")
def get_stock_financials(symbol: str):
    """
    Returns historical annual financials (Income Statement) for a stock.
    """
    try:
        ticker = yf.Ticker(symbol)
        financials = ticker.financials
        
        if financials is None or financials.empty:
            raise HTTPException(status_code=404, detail=f"Financials not found for {symbol}")
            
        # Convert to a format suitable for the chart
        result = []
        for col in financials.columns:
            year = str(col.year)
            data = financials[col]
            result.append({
                "year": year,
                "revenue": sanitize_float(data.get("Total Revenue", 0)),
                "net_income": sanitize_float(data.get("Net Income", 0)),
                "ebitda": sanitize_float(data.get("EBITDA", 0)),
                "operating_income": sanitize_float(data.get("Operating Income", 0))
            })
            
        # Sort by year ascending
        result.sort(key=lambda x: x["year"])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/peers")
def get_stock_peers(symbol: str, db: Session = Depends(get_db)):
    """
    Returns stocks in the same sector as the given stock.
    """
    stock = db.query(Stock).filter(Stock.symbol == symbol).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    peers = db.query(Stock).filter(
        Stock.sector_id == stock.sector_id,
        Stock.symbol != symbol
    ).order_by(desc(Stock.market_cap)).limit(10).all()
    
    return [serialize_stock(s) for s in peers]
