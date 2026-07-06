from app.services.stock_sync_service import StockSyncService
import logging

logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    print("Starting manual sync for 10 stocks in chunks of 5...")
    StockSyncService.run_sync_job()
    print("Sync completed.")
