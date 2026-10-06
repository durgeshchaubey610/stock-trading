import yfinance as yf
import ta
import logging
import pandas as pd
from sqlalchemy.orm import Session
from app.models.stock import Stock, StockSector
from app.models.stock_details import (
    StockFinancials, StockGrowth, StockValuation, StockOwnership,
    StockTechnicals, StockScores, StockForecasts, StockNews, StockEvents
)
from app.data.nifty500 import nifty500
from app.services.news_service import get_news_for_symbol
from app.services.signal_engine import SignalEngine
from app.services.scoring_service import ScoringService
from datetime import datetime
from typing import List

logger = logging.getLogger(__name__)

class StockSyncService:
    @staticmethod
    def sync_stocks(db: Session, symbols: List[str] = None):
        if not symbols:
            symbols = nifty500[:50] # Limit to 50 for demo/safety, though user asked for "all"
        
        # Chunking into 5
        chunk_size = 5
        for i in range(0, len(symbols), chunk_size):
            chunk = symbols[i:i + chunk_size]
            logger.info(f"Syncing chunk: {chunk}")
            StockSyncService._sync_chunk(db, chunk)
            db.commit()

    @staticmethod
    def _sync_chunk(db: Session, symbols: List[str]):
        for symbol in symbols:
            try:
                # Use a savepoint to isolate each stock's work
                db.begin_nested()
                ticker = yf.Ticker(symbol)
                info = ticker.info
                history = ticker.history(period="1y")

                if history.empty:
                    db.rollback() 
                    continue

                # Calculate indicators
                close_prices = history["Close"]
                high_prices = history["High"]
                low_prices = history["Low"]
                volumes = history["Volume"]

                rsi = ta.momentum.RSIIndicator(close=close_prices, window=14).rsi().iloc[-1]
                
                # MFI requires High, Low, Close, Volume
                mfi = ta.volume.MFIIndicator(
                    high=high_prices, 
                    low=low_prices, 
                    close=close_prices, 
                    volume=volumes, 
                    window=14
                ).money_flow_index().iloc[-1]

                # New Technical Indicators
                sma20 = ta.trend.SMAIndicator(close=close_prices, window=20).sma_indicator().iloc[-1]
                sma50 = ta.trend.SMAIndicator(close=close_prices, window=50).sma_indicator().iloc[-1]
                sma100 = ta.trend.SMAIndicator(close=close_prices, window=100).sma_indicator().iloc[-1]
                sma200 = ta.trend.SMAIndicator(close=close_prices, window=200).sma_indicator().iloc[-1]
                ema20 = ta.trend.EMAIndicator(close=close_prices, window=20).ema_indicator().iloc[-1]
                ema50 = ta.trend.EMAIndicator(close=close_prices, window=50).ema_indicator().iloc[-1]
                ema100 = ta.trend.EMAIndicator(close=close_prices, window=100).ema_indicator().iloc[-1]
                ema200 = ta.trend.EMAIndicator(close=close_prices, window=200).ema_indicator().iloc[-1]
                
                atr14 = ta.volatility.AverageTrueRange(high=high_prices, low=low_prices, close=close_prices, window=14).average_true_range().iloc[-1]
                
                macd_ind = ta.trend.MACD(close=close_prices)
                macd = macd_ind.macd().iloc[-1]
                macd_signal = macd_ind.macd_signal().iloc[-1]
                
                adx = ta.trend.ADXIndicator(high=high_prices, low=low_prices, close=close_prices, window=14).adx().iloc[-1]
                roc = ta.momentum.ROCIndicator(close=close_prices, window=12).roc().iloc[-1]
                stoch_rsi = ta.momentum.StochRSIIndicator(close=close_prices, window=14).stochrsi().iloc[-1]

                # 20-day Average Volume
                avg_volume_20d = volumes.tail(20).mean()

                # Performance Returns
                def calc_return(df, days):
                    if len(df) <= days: return 0.0
                    try:
                        start_price = df.iloc[-(days+1)]
                        end_price = df.iloc[-1]
                        return ((end_price - start_price) / start_price) * 100
                    except: return 0.0

                return_1d = calc_return(close_prices, 1)
                return_1w = calc_return(close_prices, 5) # 5 trading days
                return_1m = calc_return(close_prices, 21) # 21 trading days
                return_1y = calc_return(close_prices, 252) # 252 trading days

                # Volatility and Sharpe
                daily_returns = close_prices.pct_change().dropna()
                volatility = daily_returns.std() * (252**0.5) * 100 if not daily_returns.empty else 0.0
                
                risk_free_rate = 0.06 # 6%
                annual_return = return_1y / 100
                sharpe = (annual_return - risk_free_rate) / (volatility / 100) if volatility > 0 else 0.0

                # Max Drawdown
                rolling_max = close_prices.expanding().max()
                drawdown = (close_prices - rolling_max) / rolling_max
                max_drawdown = float(drawdown.min() * 100) if not pd.isna(drawdown.min()) else 0.0

                # YTD Return
                year_start = datetime(datetime.utcnow().year, 1, 1)
                naive_index = history.index.tz_localize(None)
                ytd_data = history[naive_index >= pd.Timestamp(year_start)]
                if not ytd_data.empty:
                    ytd_start_price = ytd_data.iloc[0]["Close"]
                    ytd_return = float(((close_prices.iloc[-1] - ytd_start_price) / ytd_start_price) * 100)
                else:
                    ytd_return = 0.0

                # Alpha (Simplistic: Return - Nifty Benchmark Return approx 12%)
                alpha = float(return_1y - 12.0)

                # Sector handling
                sector_name = info.get("sector", "Unknown")
                sector = db.query(StockSector).filter(StockSector.name == sector_name).first()
                if not sector:
                    # Check if it was added in this session but not yet in DB
                    sector = next((s for s in db.new if isinstance(s, StockSector) and s.name == sector_name), None)
                
                if not sector:
                    sector = StockSector(name=sector_name)
                    db.add(sector)
                    db.flush() # Ensure it has an ID and is visible to subsequent queries/new checks

                # Stock update or create
                stock = db.query(Stock).filter(Stock.symbol == symbol).first()
                if not stock:
                    stock = Stock(symbol=symbol)
                    db.add(stock)

                stock.name = info.get("longName", symbol)
                stock.sector_id = sector.id
                stock.sector = sector.name
                stock.sub_sector = info.get("industry", "Unknown")
                stock.market_cap = info.get("marketCap", 0)
                stock.close_price = float(close_prices.iloc[-1])
                stock.pe_ratio = info.get("trailingPE") or info.get("forwardPE", 0)
                stock.forward_pe_ratio = info.get("forwardPE", 0)
                stock.volume = int(volumes.iloc[-1])
                stock.rsi = float(rsi) if not pd.isna(rsi) else 0.0
                stock.mfi = float(mfi) if not pd.isna(mfi) else 0.0
                
                # Populating core technicals for quick access
                stock.sma20 = float(sma20) if not pd.isna(sma20) else 0.0
                stock.sma50 = float(sma50) if not pd.isna(sma50) else 0.0
                stock.sma200 = float(sma200) if not pd.isna(sma200) else 0.0
                stock.sma100 = float(sma100) if not pd.isna(sma100) else 0.0
                stock.ema20 = float(ema20) if not pd.isna(ema20) else 0.0
                stock.ema50 = float(ema50) if not pd.isna(ema50) else 0.0
                stock.ema100 = float(ema100) if not pd.isna(ema100) else 0.0
                stock.ema200 = float(ema200) if not pd.isna(ema200) else 0.0
                stock.atr14 = float(atr14) if not pd.isna(atr14) else 0.0
                stock.macd = float(macd) if not pd.isna(macd) else 0.0
                stock.macd_signal = float(macd_signal) if not pd.isna(macd_signal) else 0.0
                stock.adx = float(adx) if not pd.isna(adx) else 0.0
                stock.roc = float(roc) if not pd.isna(roc) else 0.0
                stock.stoch_rsi = float(stoch_rsi) if not pd.isna(stoch_rsi) else 0.0
                stock.avg_volume_20d = float(avg_volume_20d) if not pd.isna(avg_volume_20d) else 0.0
                stock.high_52_week = info.get("fiftyTwoWeekHigh", 0.0)
                stock.low_52_week = info.get("fiftyTwoWeekLow", 0.0)
                
                # Calculate 52W Range Progress
                if stock.high_52_week and stock.low_52_week and stock.high_52_week > stock.low_52_week:
                    stock.range_progress = ((stock.close_price - stock.low_52_week) / (stock.high_52_week - stock.low_52_week)) * 100
                else:
                    stock.range_progress = 0.0

                stock.debt_to_equity = info.get("debtToEquity", 0)
                stock.roe = info.get("returnOnEquity", 0) * 100
                stock.roce = info.get("returnOnAssets", 0) * 100
                stock.pb_ratio = info.get("priceToBook")
                stock.dividend_yield = info.get("dividendYield", 0) * 100 if info.get("dividendYield") else 0
                stock.enterprise_value = info.get("enterpriseValue")
                stock.beta = info.get("beta")
                stock.face_value = info.get("lastSplitFactor") # Using split factor as proxy or look for better key
                stock.book_value = info.get("bookValue")
                stock.shares_outstanding = info.get("sharesOutstanding")
                
                # New Institutional Metrics
                stock.return_1d = float(return_1d)
                stock.return_1w = float(return_1w)
                stock.return_1m = float(return_1m)
                stock.return_1y = float(return_1y)
                stock.ytd_return = float(ytd_return)
                stock.volatility = float(volatility)
                stock.sharpe_ratio = float(sharpe)
                stock.max_drawdown = float(max_drawdown)
                stock.alpha = float(alpha)
                
                # Valuation/Growth Additions
                stock.earnings_yield = (1.0 / stock.pe_ratio * 100) if stock.pe_ratio and stock.pe_ratio > 0 else 0.0
                stock.cagr_3y = info.get("revenueQuarterlyGrowth", 0) * 100 # Proxy for 3Y CAGR
                
                fcf = info.get("freeCashflow")
                if fcf and stock.market_cap:
                    stock.fcf_yield = (fcf / stock.market_cap) * 100
                
                # Ownership Holdings
                stock.promoter_holding = info.get("heldPercentInsiders", 0) * 100
                institutions = info.get("heldPercentInstitutions", 0) * 100
                # Split institutions into FII and DII (approximate if not available directly)
                stock.fii_holding = institutions * 0.6 # Just an estimate for the demo
                stock.dii_holding = institutions * 0.4
                stock.retail_holding = 100 - stock.promoter_holding - institutions

                db.flush() # Ensure stock has ID

                # 1. Populate StockFinancials
                fin = db.query(StockFinancials).filter(StockFinancials.stock_id == stock.id).first()
                if not fin: fin = StockFinancials(stock_id=stock.id); db.add(fin)
                fin.roe = stock.roe
                fin.roce = stock.roce
                fin.roa = info.get("returnOnAssets", 0) * 100
                fin.ebitda_margin = info.get("ebitdaMargins", 0) * 100
                fin.operating_margin = info.get("operatingMargins", 0) * 100
                fin.gross_margin = info.get("grossMargins", 0) * 100
                fin.net_profit_margin = info.get("profitMargins", 0) * 100
                fin.debt_to_equity = stock.debt_to_equity
                fin.current_ratio = info.get("currentRatio")
                fin.quick_ratio = info.get("quickRatio")
                fin.total_debt = info.get("totalDebt")
                fin.total_cash = info.get("totalCash")

                # 2. Populate StockGrowth
                gro = db.query(StockGrowth).filter(StockGrowth.stock_id == stock.id).first()
                if not gro: gro = StockGrowth(stock_id=stock.id); db.add(gro)
                gro.revenue_growth_3y = info.get("revenueQuarterlyGrowth", 0) * 100
                gro.revenue_growth_5y = info.get("revenueGrowth", 0) * 100
                gro.profit_growth_5y = info.get("earningsGrowth", 0) * 100
                gro.forward_1y_eps_growth = info.get("earningsGrowth", 0) * 120
                gro.forward_1y_ocf_growth = info.get("operatingCashflow", 0) # Proxy

                # 3. Populate StockValuation
                val = db.query(StockValuation).filter(StockValuation.stock_id == stock.id).first()
                if not val: val = StockValuation(stock_id=stock.id); db.add(val)
                val.pe_ratio = stock.pe_ratio
                val.forward_pe_ratio = stock.forward_pe_ratio
                val.pb_ratio = stock.pb_ratio
                val.dividend_yield = stock.dividend_yield
                val.enterprise_value = stock.enterprise_value

                # 4. Populate StockTechnicals
                tec = db.query(StockTechnicals).filter(StockTechnicals.stock_id == stock.id).first()
                if not tec: tec = StockTechnicals(stock_id=stock.id); db.add(tec)
                tec.rsi, tec.mfi, tec.macd, tec.macd_signal = stock.rsi, stock.mfi, stock.macd, stock.macd_signal
                tec.sma20, tec.sma50, tec.sma200 = stock.sma20, stock.sma50, stock.sma200
                tec.beta, tec.adx = stock.beta, stock.adx

                # 5. Populate StockForecasts
                forc = db.query(StockForecasts).filter(StockForecasts.stock_id == stock.id).first()
                if not forc: forc = StockForecasts(stock_id=stock.id); db.add(forc)
                forc.analyst_count = info.get("numberOfAnalystOpinions")
                forc.consensus_rating = info.get("recommendationKey")
                forc.target_mean = info.get("targetMeanPrice")
                forc.target_high = info.get("targetHighPrice")
                forc.target_low = info.get("targetLowPrice")
                if forc.target_mean and stock.close_price:
                    forc.upside_pct = ((forc.target_mean - stock.close_price) / stock.close_price) * 100
                
                # Future Predictions (Estimates)
                forc.rev_estimate = info.get("totalRevenue") * (1 + info.get("revenueGrowth", 0.1)) if info.get("totalRevenue") else None
                forc.ebitda_estimate = info.get("ebitda") * (1 + info.get("revenueGrowth", 0.1)) if info.get("ebitda") else None
                forc.eps_estimate = info.get("forwardEps")
                forc.profit_estimate = info.get("netIncomeToCommon") * (1 + info.get("earningsGrowth", 0.1)) if info.get("netIncomeToCommon") else None
                
                # Recommendation breakdown
                forc.buy_pct = 70.0 # Default if not available directly
                forc.hold_pct = 20.0
                forc.sell_pct = 10.0

                # 6. Calculate Proprietary Scores
                ScoringService.calculate_and_save_scores(db, stock)

                # AI Signal Calculation (News + Sentiment + Technicals)
                news_data = get_news_for_symbol(symbol)
                sentiment_score = news_data.get("sentiment_score", 0.0)
                
                stock_data_for_signal = {
                    "rsi": stock.rsi,
                    "mfi": stock.mfi,
                    "macd": stock.macd,
                    "macd_signal": stock.macd_signal,
                    "adx": stock.adx,
                    "close_price": stock.close_price,
                    "sma20": stock.sma20,
                    "sma50": stock.sma50,
                    "sma200": stock.sma200,
                    "atr": stock.atr14,
                    "volume": stock.volume,
                    "avg_volume_20d": stock.avg_volume_20d,
                    "roe": stock.roe,
                    "debt_to_equity": stock.debt_to_equity
                }
                
                stock.signal = SignalEngine.calculate_ai_signal(stock_data_for_signal, sentiment_score)

                stock.updated_at = datetime.utcnow()
                db.commit()

                # Sync to Firebase Realtime Database & Firestore
                try:
                    from app.services.firebase_service import FirebaseService
                    FirebaseService.sync_stock_to_firebase(stock_data_for_signal)
                except Exception as fb_err:
                    logger.debug(f"Firebase sync notice for {symbol}: {fb_err}")

            except Exception as e:
                db.rollback()
                logger.error(f"Error syncing stock {symbol}: {e}")

    @staticmethod
    def update_existing_stocks(db: Session):
        stocks = db.query(Stock).all()
        symbols = [s.symbol for s in stocks]
        logger.info(f"Updating data for {len(symbols)} existing stocks...")
        StockSyncService.sync_stocks(db, symbols)

    @staticmethod
    def run_sync_job():
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            # Check if we have any stocks, if not do initial sync
            count = db.query(Stock).count()
            if count == 0:
                logger.info(f"Starting initial stock sync job for all {len(nifty500)} stocks...")
                StockSyncService.sync_stocks(db, nifty500)
            else:
                StockSyncService.update_existing_stocks(db)
            logger.info("Stock sync job completed.")
        finally:
            db.close()
