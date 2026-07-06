import time
import logging
from app.services.backtest_engine import BacktestEngine

# Setup logging
logging.basicConfig(level=logging.INFO)

def test_backtest_engine():
    print("Starting historical backtest for RELIANCE.NS (1y period)...")
    start_time = time.time()
    
    results = BacktestEngine.run_backtest(
        symbol="RELIANCE.NS",
        period="1y",
        initial_capital=100000.0,
        stop_loss_pct=3.0,
        take_profit_pct=10.0
    )
    
    end_time = time.time()
    duration = end_time - start_time
    
    if "error" in results:
        print(f"Error: {results['error']}")
        return

    print(f"Backtest completed in {duration:.2f} seconds.")
    print(f"Symbol: {results['symbol']}")
    print(f"Initial Capital: {results['initial_capital']}")
    print(f"Final Equity: {results['final_equity']}")
    print(f"Total Return: {results['total_return_percentage']}%")
    print(f"Win Rate: {results['win_rate']}%")
    print(f"Max Drawdown: {results['max_drawdown_percentage']}%")
    print(f"Total Trades: {results['total_trades']}")
    
    if results['trades']:
        print("\nLast 3 trades:")
        for t in results['trades'][-3:]:
            print(f"- {t['type']} on {t['date']}: Price {t.get('price')}, Reason: {t.get('reason', 'N/A')}, PnL: {t.get('pnl_pct', 'N/A')}%")

if __name__ == "__main__":
    test_backtest_engine()
