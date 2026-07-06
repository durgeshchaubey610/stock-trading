import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.paper_trading import (
    PaperPortfolio, PaperPosition, PaperOrder, PaperTrade, PaperJournal
)
from app.models.stock import Stock
from app.models.watchlist import Watchlist
from fastapi import HTTPException
from datetime import datetime

from app.services.price_service import PriceService

logger = logging.getLogger(__name__)

class PaperTradingService:
    @staticmethod
    def get_or_create_portfolio(db: Session, user_id: int):
        portfolio = db.query(PaperPortfolio).filter(PaperPortfolio.user_id == user_id).first()
        if not portfolio:
            portfolio = PaperPortfolio(user_id=user_id, available_cash=1000000.0)
            db.add(portfolio)
            db.commit()
            db.refresh(portfolio)
        return portfolio

    @staticmethod
    def place_order(db: Session, user_id: int, symbol: str, quantity: int, price: float, order_type: str, action: str):
        portfolio = PaperTradingService.get_or_create_portfolio(db, user_id)
        
        # Validation
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
            
        total_cost = quantity * price
        if action == "BUY" and portfolio.available_cash < total_cost:
            raise HTTPException(status_code=400, detail="Insufficient virtual funds")

        # Create Order
        order = PaperOrder(
            user_id=user_id,
            stock_symbol=symbol.upper(),
            quantity=quantity,
            price=price,
            order_type=order_type,
            action=action,
            status="OPEN" if order_type != "Market" else "COMPLETED"
        )
        db.add(order)
        db.flush()

        # If Market Order, execute immediately
        if order_type == "Market":
            PaperTradingService._execute_trade(db, order, price)
        
        db.commit()
        return order

    @staticmethod
    def _execute_trade(db: Session, order: PaperOrder, execution_price: float):
        # 1. Create Trade record
        trade = PaperTrade(
            order_id=order.id,
            user_id=order.user_id,
            stock_symbol=order.stock_symbol,
            quantity=order.quantity,
            execution_price=execution_price,
            action=order.action
        )
        db.add(trade)
        
        # 2. Update Portfolio Cash
        portfolio = PaperTradingService.get_or_create_portfolio(db, order.user_id)
        total_value = order.quantity * execution_price
        
        if order.action == "BUY":
            portfolio.available_cash -= total_value
            portfolio.invested_amount += total_value
        else:
            # For SELL, calculate profit/loss against avg_buy_price
            position = db.query(PaperPosition).filter(
                PaperPosition.user_id == order.user_id,
                PaperPosition.stock_symbol == order.stock_symbol
            ).first()
            
            if not position or position.quantity < order.quantity:
                raise HTTPException(status_code=400, detail="Insufficient shares to sell")
                
            cost_basis = order.quantity * position.avg_buy_price
            profit = total_value - cost_basis
            
            portfolio.available_cash += total_value
            portfolio.invested_amount -= cost_basis
            portfolio.realized_profit += profit

        # 3. Update Position
        position = db.query(PaperPosition).filter(
            PaperPosition.user_id == order.user_id,
            PaperPosition.stock_symbol == order.stock_symbol
        ).first()

        if order.action == "BUY":
            if not position:
                position = PaperPosition(
                    user_id=order.user_id,
                    stock_symbol=order.stock_symbol,
                    quantity=order.quantity,
                    avg_buy_price=execution_price
                )
                db.add(position)
            else:
                # Update weighted average price
                new_total_qty = position.quantity + order.quantity
                new_avg_price = ((position.quantity * position.avg_buy_price) + (order.quantity * execution_price)) / new_total_qty
                position.quantity = new_total_qty
                position.avg_buy_price = new_avg_price
        else:
            position.quantity -= order.quantity
            if position.quantity == 0:
                db.delete(position)
        
        order.status = "COMPLETED"

    @staticmethod
    def get_portfolio_analytics(db: Session, user_id: int):
        portfolio = PaperTradingService.get_or_create_portfolio(db, user_id)
        positions = db.query(PaperPosition).filter(PaperPosition.user_id == user_id).all()
        
        # Fetch current prices and fundamentals
        symbols = [p.stock_symbol for p in positions]
        current_prices = PriceService.get_latest_prices(symbols) if symbols else {}
        fundamentals = PriceService.get_batch_fundamentals(symbols) if symbols else {}
        
        # Fetch detailed metrics from our local Stock table
        stock_metrics = {s.symbol: s for s in db.query(Stock).filter(Stock.symbol.in_(symbols)).all()}
        
        portfolio_items = []
        total_current_value = 0.0
        sector_breakdown = {}
        cap_breakdown = {"Large Cap": 0.0, "Mid Cap": 0.0, "Small Cap": 0.0, "Unknown": 0.0}

        for pos in positions:
            symbol = pos.stock_symbol
            qty = pos.quantity
            avg_buy_price = pos.avg_buy_price
            cost_basis = qty * avg_buy_price
            
            current_price = current_prices.get(symbol, avg_buy_price)
            current_value = qty * current_price
            
            unrealized_pnl = current_value - cost_basis
            pnl_pct = (unrealized_pnl / cost_basis) * 100 if cost_basis > 0 else 0.0
            
            fund = fundamentals.get(symbol, {})
            sector = fund.get("sector", "Other")
            market_cap = fund.get("market_cap") or 0
            
            # Sale Recommendation Logic
            sale_recommendation = None
            stock_data = stock_metrics.get(symbol)
            if stock_data:
                # 1. Stock hit target position
                target_hit = stock_data.target_price and current_price >= stock_data.target_price
                
                # 2. Stock above 52W high and RSI crossing downside (interpreted as overbought RSI > 70)
                # Note: "Crossing" typically needs historical data, but we use RSI > 70 as a proxy for "in the danger zone"
                # while being at or above 52W high.
                high_52_hit = stock_data.high_52_week and current_price >= stock_data.high_52_week
                rsi_bearish = stock_data.rsi and stock_data.rsi > 70
                
                if target_hit:
                    sale_pct = 50 # Example: Sell 50% on target hit
                    sale_qty = int(qty * (sale_pct / 100))
                    if sale_qty > 0:
                        sale_recommendation = f"Can sale {sale_pct}% of the quantity that is {sale_qty} stock (Target Hit)"
                elif high_52_hit and rsi_bearish:
                    sale_pct = 45 # Example: Sell 45% on 52W high + Bearish RSI
                    sale_qty = int(qty * (sale_pct / 100))
                    if sale_qty > 0:
                        sale_recommendation = f"Can sale {sale_pct}% of the quantity that is {sale_qty} stock (52W High & Bearish RSI)"

            mcap_cr = market_cap / 10**7
            if mcap_cr > 20000: cap_cat = "Large Cap"
            elif mcap_cr > 5000: cap_cat = "Mid Cap"
            elif mcap_cr > 0: cap_cat = "Small Cap"
            else: cap_cat = "Unknown"

            portfolio_items.append({
                "symbol": symbol,
                "quantity": qty,
                "avg_buy_price": round(avg_buy_price, 2),
                "cost_basis": round(cost_basis, 2),
                "current_price": round(current_price, 2),
                "current_value": round(current_value, 2),
                "unrealized_pnl": round(unrealized_pnl, 2),
                "pnl_percentage": round(pnl_pct, 2),
                "sector": sector,
                "cap_category": cap_cat,
                "sale_recommendation": sale_recommendation
            })
            
            total_current_value += current_value
            sector_breakdown[sector] = sector_breakdown.get(sector, 0.0) + current_value
            cap_breakdown[cap_cat] += current_value

        unrealized_profit = total_current_value - portfolio.invested_amount
        total_portfolio_value = portfolio.available_cash + total_current_value
        
        # Total P&L since start
        total_pnl = (total_portfolio_value - 1000000.0) # Assuming 10L initial capital
        total_pnl_pct = (total_pnl / 1000000.0) * 100
        
        # Diversification
        diversification = {
            "sector": {s: round((v / total_current_value * 100), 2) for s, v in sector_breakdown.items()} if total_current_value > 0 else {},
            "market_cap": {c: round((v / total_current_value * 100), 2) for c, v in cap_breakdown.items() if v > 0} if total_current_value > 0 else {}
        }

        # Benchmarking (Placeholder for demo)
        nifty_return = 5.2 # Hardcoded for demo
        alpha = total_pnl_pct - nifty_return

        return {
            "holdings": portfolio_items,
            "summary": {
                "available_cash": round(portfolio.available_cash, 2),
                "total_buy_cost": round(portfolio.invested_amount, 2),
                "current_value": round(total_current_value, 2),
                "total_portfolio_value": round(total_portfolio_value, 2),
                "unrealized_pnl": round(unrealized_profit, 2),
                "realized_pnl": round(portfolio.realized_profit, 2),
                "total_pnl": round(total_pnl, 2),
                "total_pnl_percentage": round(total_pnl_pct, 2),
                "benchmarking": {
                    "index_name": "Nifty 50",
                    "index_return_pct": nifty_return,
                    "alpha": round(alpha, 2)
                }
            },
            "diversification": diversification,
            "tax_harvesting": { # Optional for paper trading but keeps frontend happy
                "total_harvestable_loss": 0,
                "suggested_stocks": []
            }
        }

    @staticmethod
    def add_journal_entry(db: Session, user_id: int, symbol: str, notes: str, reasoning: str):
        entry = PaperJournal(
            user_id=user_id,
            stock_symbol=symbol.upper(),
            notes=notes,
            reasoning=reasoning
        )
        db.add(entry)
        db.commit()
        return entry

    @staticmethod
    def get_trade_history(db: Session, user_id: int):
        return db.query(PaperTrade).filter(PaperTrade.user_id == user_id).order_by(PaperTrade.transaction_date.desc()).all()

    @staticmethod
    def get_watchlist(db: Session, user_id: int):
        watchlist_items = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
        symbols = [item.stock_symbol for item in watchlist_items]
        
        if not symbols:
            return []
            
        # Enrich with current prices
        stocks = db.query(Stock).filter(Stock.symbol.in_(symbols)).all()
        return stocks

    @staticmethod
    def add_to_watchlist(db: Session, user_id: int, symbol: str):
        # Validate that symbol exists in stocks table
        stock_exists = db.query(Stock).filter(Stock.symbol == symbol.upper()).first()
        if not stock_exists:
            raise HTTPException(status_code=404, detail=f"Stock symbol {symbol} not found")

        existing = db.query(Watchlist).filter(
            Watchlist.user_id == user_id,
            Watchlist.stock_symbol == symbol.upper()
        ).first()
        
        if existing:
            return existing
            
        item = Watchlist(user_id=user_id, stock_symbol=symbol.upper())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def remove_from_watchlist(db: Session, user_id: int, symbol: str):
        item = db.query(Watchlist).filter(
            Watchlist.user_id == user_id,
            Watchlist.stock_symbol == symbol.upper()
        ).first()
        
        if item:
            db.delete(item)
            db.commit()
        return {"status": "success"}
