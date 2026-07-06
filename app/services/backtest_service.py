import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import List, Tuple, Dict, Any

from app.schemas.backtest_schema import BacktestRequest, StrategyRule

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    
    # Wilde's smoothing method
    avg_gain = gain.ewm(alpha=1/period, min_periods=period).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return rsi

class BacktestService:
    @staticmethod
    def get_indicator_value(df: pd.DataFrame, i: int, indicator: str, period: int) -> float:
        if indicator == "price" or indicator == "close":
            return float(df.iloc[i]['Close'])
        elif indicator == "rsi":
            return float(df.iloc[i][f"rsi_{period}"])
        elif indicator == "sma":
            return float(df.iloc[i][f"sma_{period}"])
        elif indicator == "ema":
            return float(df.iloc[i][f"ema_{period}"])
        return 0.0

    @staticmethod
    def check_rule(df: pd.DataFrame, i: int, rule: StrategyRule) -> bool:
        if i < 1:
            return False
            
        val_cur = BacktestService.get_indicator_value(df, i, rule.indicator, rule.indicator_period)
        val_prev = BacktestService.get_indicator_value(df, i - 1, rule.indicator, rule.indicator_period)
        
        threshold = rule.value
        op = rule.operator.lower()
        
        if op == ">":
            return val_cur > threshold
        elif op == "<":
            return val_cur < threshold
        elif op == ">=":
            return val_cur >= threshold
        elif op == "<=":
            return val_cur <= threshold
        elif op == "=" or op == "==":
            return val_cur == threshold
        elif op == "crosses_above":
            return val_prev <= threshold and val_cur > threshold
        elif op == "crosses_below":
            return val_prev >= threshold and val_cur < threshold
            
        return False

    @staticmethod
    def backtest_strategy(db: Session, request: BacktestRequest) -> Dict[str, Any]:
        # Formulate yfinance symbol
        symbol_to_download = request.symbol.upper()
        if not symbol_to_download.endswith(".NS") and not symbol_to_download.endswith(".BO"):
            symbol_to_download = f"{symbol_to_download}.NS"
            
        try:
            df = yf.download(
                symbol_to_download,
                period=request.period,
                interval="1d",
                progress=False,
                auto_adjust=True
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch market data for {request.symbol}: {str(e)}")
            
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail=f"No historical price data found for symbol {request.symbol}")

        # Flatten multi-index columns if returned by yfinance
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # Collect indicator parameters to calculate
        indicators_to_calc = set()
        for rule in request.buy_rules + request.sell_rules:
            if rule.indicator in ["rsi", "sma", "ema"]:
                indicators_to_calc.add((rule.indicator, rule.indicator_period))

        # Calculate indicators
        for ind_type, period in indicators_to_calc:
            if ind_type == "rsi":
                df[f"rsi_{period}"] = calculate_rsi(df['Close'], period)
            elif ind_type == "sma":
                df[f"sma_{period}"] = df['Close'].rolling(window=period).mean()
            elif ind_type == "ema":
                df[f"ema_{period}"] = df['Close'].ewm(span=period, adjust=False).mean()

        # Determine start index to bypass NaN indicator buffers
        max_period = max([p for _, p in indicators_to_calc] + [1])
        start_idx = max_period + 1
        
        df = df.dropna()
        n_rows = len(df)
        
        if n_rows <= start_idx:
            raise HTTPException(status_code=400, detail="Insufficient historical price data for the indicator periods selected.")

        capital = request.initial_capital
        position = 0.0
        buy_price = 0.0
        trades = []
        daily_values = []

        for i in range(start_idx, n_rows):
            row = df.iloc[i]
            date_str = str(df.index[i].date()) if hasattr(df.index[i], 'date') else str(df.index[i])
            close_price = float(row['Close'])
            
            # Record daily tracking value
            current_portfolio_value = capital + (position * close_price)
            daily_values.append({
                "date": date_str,
                "portfolio_value": round(current_portfolio_value, 2),
                "stock_close": round(close_price, 2)
            })

            # Check exits
            if position > 0:
                pnl_pct = ((close_price - buy_price) / buy_price) * 100.0
                
                trigger_sell = False
                exit_reason = ""
                
                if request.stop_loss_pct is not None and pnl_pct <= -request.stop_loss_pct:
                    trigger_sell = True
                    exit_reason = f"Stop Loss ({request.stop_loss_pct}%)"
                elif request.take_profit_pct is not None and pnl_pct >= request.take_profit_pct:
                    trigger_sell = True
                    exit_reason = f"Take Profit ({request.take_profit_pct}%)"
                else:
                    if request.sell_rules:
                        # Require all sell rules to align
                        sell_rules_met = all(BacktestService.check_rule(df, i, rule) for rule in request.sell_rules)
                        if sell_rules_met:
                            trigger_sell = True
                            exit_reason = "Sell Rules Met"
                            
                if trigger_sell:
                    sell_val = position * close_price
                    capital += sell_val
                    pnl_amount = sell_val - (position * buy_price)
                    trades.append({
                        "action": "SELL",
                        "date": date_str,
                        "price": round(close_price, 2),
                        "quantity": int(position),
                        "value": round(sell_val, 2),
                        "pnl_percentage": round(pnl_pct, 2),
                        "pnl_amount": round(pnl_amount, 2),
                        "reason": exit_reason
                    })
                    position = 0.0
                    buy_price = 0.0
                    
            # Check entries
            elif position == 0:
                if request.buy_rules:
                    buy_rules_met = all(BacktestService.check_rule(df, i, rule) for rule in request.buy_rules)
                    if buy_rules_met:
                        position = capital // close_price
                        if position > 0:
                            buy_val = position * close_price
                            capital -= buy_val
                            buy_price = close_price
                            trades.append({
                                "action": "BUY",
                                "date": date_str,
                                "price": round(close_price, 2),
                                "quantity": int(position),
                                "value": round(buy_val, 2),
                                "reason": "Buy Rules Met"
                            })

        # Force close open position at period end
        if position > 0:
            last_row = df.iloc[-1]
            last_close = float(last_row['Close'])
            last_date_str = str(df.index[-1].date()) if hasattr(df.index[-1], 'date') else str(df.index[-1])
            sell_val = position * last_close
            pnl_pct = ((last_close - buy_price) / buy_price) * 100.0
            pnl_amount = sell_val - (position * buy_price)
            
            trades.append({
                "action": "SELL",
                "date": last_date_str,
                "price": round(last_close, 2),
                "quantity": int(position),
                "value": round(sell_val, 2),
                "pnl_percentage": round(pnl_pct, 2),
                "pnl_amount": round(pnl_amount, 2),
                "reason": "Force Close (End of Period)"
            })
            capital += sell_val
            position = 0.0

        # Performance Calculations
        final_value = capital
        strategy_return = ((final_value - request.initial_capital) / request.initial_capital) * 100.0
        
        first_close = float(df.iloc[start_idx]['Close'])
        last_close = float(df.iloc[-1]['Close'])
        benchmark_return = ((last_close - first_close) / first_close) * 100.0
        alpha = strategy_return - benchmark_return

        total_trade_pairs = 0
        profitable_trades = 0
        for t in trades:
            if t["action"] == "SELL":
                total_trade_pairs += 1
                if t.get("pnl_amount", 0.0) > 0:
                    profitable_trades += 1

        win_rate = (profitable_trades / total_trade_pairs * 100.0) if total_trade_pairs > 0 else 0.0

        # Calculate Risk Adjustments
        portfolio_values = [v["portfolio_value"] for v in daily_values]
        if len(portfolio_values) > 1:
            daily_returns = np.diff(portfolio_values) / portfolio_values[:-1]
        else:
            daily_returns = np.array([])

        if len(daily_returns) > 1 and np.std(daily_returns) > 0:
            mean_ret = np.mean(daily_returns)
            std_ret = np.std(daily_returns)
            daily_rf = 0.06 / 252  # 6% annual risk-free rate proxy
            sharpe = float((mean_ret - daily_rf) / std_ret * np.sqrt(252))
            volatility = float(std_ret * np.sqrt(252) * 100.0)
        else:
            sharpe = 0.0
            volatility = 0.0

        # Max Drawdown
        max_drawdown = 0.0
        peak = -1.0
        for val in portfolio_values:
            if val > peak:
                peak = val
            drawdown = (peak - val) / peak * 100.0 if peak > 0 else 0.0
            if drawdown > max_drawdown:
                max_drawdown = drawdown

        return {
            "summary": {
                "initial_capital": round(request.initial_capital, 2),
                "final_value": round(final_value, 2),
                "strategy_return": round(strategy_return, 2),
                "benchmark_return": round(benchmark_return, 2),
                "alpha": round(alpha, 2),
                "total_trades": total_trade_pairs,
                "win_rate": round(win_rate, 2),
                "sharpe_ratio": round(sharpe, 2),
                "max_drawdown": round(max_drawdown, 2),
                "volatility": round(volatility, 2)
            },
            "trades": trades,
            "daily_values": daily_values
        }
