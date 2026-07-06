from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from typing import Dict, Any, Optional

from app.services.webhook_service import WebhookService
from app.auth import get_current_user

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

class WebhookRequest(BaseModel):
    url: str
    broker: str # "zerodha", "upstox", "generic"
    signal: Dict[str, Any]
    headers: Optional[Dict[str, str]] = None

@router.post("/test")
async def test_webhook(
    request: WebhookRequest,
    user=Depends(get_current_user)
):
    """
    Endpoint to test formatting and sending a webhook to a configured broker URL.
    """
    if request.broker not in WebhookService.SUPPORTED_BROKERS:
        raise HTTPException(status_code=400, detail=f"Supported brokers are: {', '.join(WebhookService.SUPPORTED_BROKERS)}")
        
    result = await WebhookService.send_webhook(
        url=request.url,
        broker=request.broker,
        signal=request.signal,
        headers=request.headers
    )
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
        
    return result

@router.post("/payload-preview")
def preview_payload(
    request: WebhookRequest,
    user=Depends(get_current_user)
):
    """
    Endpoint to preview how a signal will be formatted for a specific broker.
    """
    if request.broker not in WebhookService.SUPPORTED_BROKERS:
        raise HTTPException(status_code=400, detail=f"Supported brokers are: {', '.join(WebhookService.SUPPORTED_BROKERS)}")
        
    payload = WebhookService.format_payload(request.broker, request.signal)
    return {"broker": request.broker, "formatted_payload": payload}
