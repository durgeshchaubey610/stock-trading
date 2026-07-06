# Enterprise Error Log

* timestamp: 2026-06-03 14:55:00 UTC
* phase/module: Phase 8 / AI Strategy
* file/function: app/services/swing_trade_service.py
* error type/message: ModuleNotFoundError: No module named 'google.generativeai'
* stack trace: uvicorn -> importlib -> app.main -> scheduler -> swing_trade_service
* root cause: google-generativeai package not installed or in requirements.txt
* fix applied: Added google-generativeai to requirements.txt and installed via pip.
* status: Resolved
* prevention recommendation: Always verify newly imported third-party libraries are added to requirements.txt.
* severity: High (Prevents app startup)

* timestamp: 2026-06-17 09:15:00 UTC
* phase/module: Environment Startup
* file/function: app/services/stock_sync_service.py
* error type/message: Backend Unresponsive / Timeout
* stack trace: N/A (Hung process)
* root cause: Synchronous long-running stock sync job (500 stocks) triggered on startup via scheduler, potentially blocking the event loop or exhausting DB connections.
* fix applied: Monitored sync job completion. Verified backend responsiveness after sync finished. (Future fix: Make sync job async or run in a separate process).
* status: Resolved
* prevention recommendation: Ensure heavy background jobs are truly non-blocking and consider staggered startup for intensive tasks.
* severity: Medium (Temporary unresponsiveness)
