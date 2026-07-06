import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Optional
import logging

from app.services.data_engine import get_historical_ohlcv
from app.services.indicator_engine import calculate_indicators, scalar
from app.services.signal_engine import generate_signals

logger = logging.getLogger(__name__)

class BacktestEngine:
    """
    Historical backtesting engine for technical strategies.
    """

    @staticmethod
    def run_backtest(
        symbol: str, 
        period: str = "1y", 
        initial_capital: float = 100000.0,
        stop_loss_pct: float = 2.0,
        take_profit_pct: float = 5.0
    ) -> Dict:
        """
        Runs a backtest for a single stock using the default technical signals.
        """
        df = get_historical_ohlcv(symbol, period=period, interval="1d")
        if df is None or len(df) < 50:
            return {"error": "Insufficient data for backtesting"}

        # Flatten MultiIndex if necessary
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # We need to calculate indicators for each day in a sliding window
        # To be efficient, we calculate indicators for the whole series once if possible,
        # but existing indicator_engine is designed for the 'current' snapshot.
        # We'll adapt by using a loop (slow but simple) or refactoring indicator_engine.
        
        capital = initial_capital
        position = 0 # 0: None, 1: Long
        shares = 0
        buy_price = 0.0
        trades = []
        equity_curve = []

        # Start from when we have enough data (e.g., 50 days for MA50)
        start_idx = 50
        
        for i in range(start_idx, len(df)):
            # Get historical slice up to this day
            current_slice = df.iloc[:i+1]
            current_date = df.index[i]
            current_price = float(df["Close"].iloc[i])
            
            # Calculate indicators for the 'current' day in simulation
            # We wrap this to avoid overhead if possible, but for MVP we use existing logic
            ind = calculate_indicators(current_slice)
            signals = generate_signals(ind)
            
            # Strategy Logic
            if position == 0:
                # Entry: Strong Buy signal
                if signals["strong_buy"]:
                    shares = capital // current_price
                    if shares > 0:
                        position = 1
                        buy_price = current_price
                        cost = shares * buy_price
                        capital -= cost
                        trades.append({
                            "type": "BUY",
                            "date": current_date.isoformat(),
                            "price": round(buy_price, 2),
                            "shares": shares,
                            "remaining_capital": round(capital, 2)
                        })
            
            elif position == 1:
                # Exit Logic: Stop Loss or Take Profit
                pnl_pct = ((current_price - buy_price) / buy_price) * 100
                
                exit_reason = None
                if pnl_pct <= -stop_loss_pct:
                    exit_reason = "STOP_LOSS"
                elif pnl_pct >= take_profit_pct:
                    exit_reason = "TAKE_PROFIT"
                # Also exit if signal turns weak (e.g., RSI drops below 45)
                elif ind["rsi"] < 45:
                    exit_reason = "SIGNAL_WEAK"
                
                if exit_reason:
                    revenue = shares * current_price
                    capital += revenue
                    trades.append({
                        "type": "SELL",
                        "date": current_date.isoformat(),
                        "price": round(current_price, 2),
                        "reason": exit_reason,
                        "pnl_pct": round(pnl_pct, 2),
                        "total_capital": round(capital, 2)
                    })
                    position = 0
                    shares = 0

            current_equity = capital + (shares * current_price if position == 1 else 0)
            equity_curve.append({
                "date": current_date.isoformat(),
                "equity": round(current_equity, 2)
            })

        # Performance Metrics
        final_equity = capital + (shares * float(df["Close"].iloc[-1]) if position == 1 else 0)
        total_return_pct = ((final_equity - initial_capital) / initial_capital) * 100
        
        win_trades = [t for t in trades if t.get("type") == "SELL" and t.get("pnl_pct", 0) > 0]
        loss_trades = [t for t in trades if t.get("type") == "SELL" and t.get("pnl_pct", 0) <= 0]
        win_rate = (len(win_trades) / (len(win_trades) + len(loss_trades)) * 100) if (win_trades or loss_trades) else 0

        # Max Drawdown
        equity_values = [e["equity"] for t in equity_curve for e in [t]] # flat list
        equity_values = np.array([e["equity"] for e in equity_curve])
        peak = np.maximum.accumulate(equity_values)
        drawdown = (equity_values - peak) / peak
        max_drawdown = np.min(drawdown) * 100 if len(drawdown) > 0 else 0

        return {
            "symbol": symbol,
            "initial_capital": initial_capital,
            "final_equity": round(final_equity, 2),
            "total_return_percentage": round(total_return_pct, 2),
            "win_rate": round(win_rate, 2),
            "max_drawdown_percentage": round(max_drawdown, 2),
            "total_trades": len(trades),
            "trades": trades,
            "equity_curve": equity_curve
        }
