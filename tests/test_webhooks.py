import asyncio
import logging
from app.services.webhook_service import WebhookService

import pytest

logging.basicConfig(level=logging.INFO)

@pytest.mark.asyncio
async def test_webhook_service():
    signal = {
        "symbol": "RELIANCE.NS",
        "action": "BUY",
        "quantity": 10,
        "order_type": "LIMIT",
        "price": 2500.0,
        "trigger_price": 2505.0
    }

    print("Testing payload formatting for Zerodha:")
    zerodha_payload = WebhookService.format_payload("zerodha", signal)
    print(f"{zerodha_payload}\n")

    print("Testing payload formatting for Upstox:")
    upstox_payload = WebhookService.format_payload("upstox", signal)
    print(f"{upstox_payload}\n")
    
    print("Testing payload formatting for Generic:")
    generic_payload = WebhookService.format_payload("generic", signal)
    print(f"{generic_payload}\n")

    print("Testing mock webhook send to Upstox:")
    result = await WebhookService.send_webhook(
        url="mock://upstox.api",
        broker="upstox",
        signal=signal
    )
    print(f"Result: {result}\n")

if __name__ == "__main__":
    asyncio.run(test_webhook_service())
