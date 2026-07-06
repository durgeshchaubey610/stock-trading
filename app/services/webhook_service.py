import logging
import httpx
from typing import Dict, Any

logger = logging.getLogger(__name__)

class WebhookService:
    """
    Service to handle outgoing webhooks for automated broker execution.
    Supports payload formatting for various broker APIs.
    """

    SUPPORTED_BROKERS = ["zerodha", "upstox", "generic"]

    @staticmethod
    def format_payload(broker: str, signal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Formats internal signal into broker-specific webhook payload.
        Internal signal format:
        {
            "symbol": "RELIANCE.NS",
            "action": "BUY" | "SELL",
            "quantity": 10,
            "order_type": "MARKET" | "LIMIT",
            "price": 2500.0, # Required if LIMIT
            "trigger_price": 0.0 # Optional
        }
        """
        if broker == "zerodha":
            # Example Kite Connect order payload structure
            # To trade via Kite Connect API, usually you need tradingsymbol, exchange, transaction_type
            symbol = signal["symbol"].replace(".NS", "")
            action = "BUY" if signal["action"].upper() == "BUY" else "SELL"
            order_type = signal.get("order_type", "MARKET").upper()
            
            payload = {
                "tradingsymbol": symbol,
                "exchange": "NSE",
                "transaction_type": action,
                "order_type": order_type,
                "quantity": signal["quantity"],
                "product": "CNC", # Cash n Carry for equity delivery
                "validity": "DAY"
            }
            if order_type == "LIMIT":
                payload["price"] = signal.get("price", 0.0)
            if "trigger_price" in signal:
                payload["trigger_price"] = signal["trigger_price"]
                
            return payload

        elif broker == "upstox":
            # Example Upstox API payload structure
            symbol = signal["symbol"].replace(".NS", "")
            action = "BUY" if signal["action"].upper() == "BUY" else "SELL"
            
            payload = {
                "instrument_token": f"NSE_EQ|{symbol}", # This usually requires a lookup, simplified here
                "quantity": signal["quantity"],
                "product": "D", # Delivery
                "validity": "DAY",
                "price": signal.get("price", 0.0) if signal.get("order_type", "MARKET").upper() == "LIMIT" else 0.0,
                "tag": "ai_bot_trade",
                "instrument_token": "ISIN", # Simplified
                "order_type": signal.get("order_type", "MARKET").upper(),
                "transaction_type": "B" if action == "BUY" else "S",
                "disclosed_quantity": 0,
                "trigger_price": signal.get("trigger_price", 0.0),
                "is_amo": False
            }
            return payload

        else:
            # Generic JSON payload
            return signal

    @staticmethod
    async def send_webhook(url: str, broker: str, signal: Dict[str, Any], headers: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Sends the formatted payload to the specified webhook URL.
        """
        if broker not in WebhookService.SUPPORTED_BROKERS:
            return {"status": "error", "message": f"Unsupported broker: {broker}"}

        payload = WebhookService.format_payload(broker, signal)
        
        try:
            # In a real environment, you'd use the provided auth headers.
            # For this MVP, we simulate the request or perform a basic POST if URL is valid.
            if url.startswith("http://mock") or url.startswith("mock://") or url == "mock":
                # Simulation mode
                logger.info(f"Simulating webhook to {broker}: {payload}")
                return {"status": "success", "message": "Simulated webhook sent", "payload": payload}
                
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                response.raise_for_status()
                return {"status": "success", "message": f"Webhook sent to {broker}", "response_status": response.status_code}
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error sending webhook to {url}: {e.response.text}")
            return {"status": "error", "message": f"HTTP Error: {e.response.status_code}"}
        except Exception as e:
            logger.error(f"Error sending webhook to {url}: {e}")
            return {"status": "error", "message": str(e)}
