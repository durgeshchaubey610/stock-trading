import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from typing import List, Dict, Any

from app.models.alert import Alert
from app.schemas.alert_schema import AlertCreate
from app.services.webhook_service import WebhookService
from app.services.scanner_engine import scan_stock
from app.services.news_service import get_news_for_symbol

logger = logging.getLogger(__name__)

class AlertService:
    
    @staticmethod
    def create_alert(db: Session, user_id: int, alert_data: AlertCreate) -> Alert:
        db_alert = Alert(
            user_id=user_id,
            symbol=alert_data.symbol.upper(),
            alert_type=alert_data.alert_type.upper(),
            threshold_value=alert_data.threshold_value,
            notify_email=alert_data.notify_email,
            notify_webhook=alert_data.notify_webhook,
            webhook_url=alert_data.webhook_url
        )
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)
        return db_alert

    @staticmethod
    def get_user_alerts(db: Session, user_id: int) -> List[Alert]:
        return db.query(Alert).filter(Alert.user_id == user_id).all()

    @staticmethod
    def delete_alert(db: Session, alert_id: int, user_id: int) -> bool:
        alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == user_id).first()
        if not alert:
            return False
        db.delete(alert)
        db.commit()
        return True

    @staticmethod
    async def evaluate_alerts(db: Session):
        """
        Background task to evaluate all active alerts.
        """
        active_alerts = db.query(Alert).filter(Alert.is_active == True).all()
        if not active_alerts:
            return
            
        logger.info(f"Evaluating {len(active_alerts)} active alerts...")
        
        # Group by symbol to minimize API calls
        alerts_by_symbol = {}
        for alert in active_alerts:
            if alert.symbol not in alerts_by_symbol:
                alerts_by_symbol[alert.symbol] = []
            alerts_by_symbol[alert.symbol].append(alert)
            
        for symbol, alerts in alerts_by_symbol.items():
            # For efficiency, we need to know what data to fetch
            needs_tech = any(a.alert_type in ["PRICE_ABOVE", "PRICE_BELOW", "RSI_ABOVE", "RSI_BELOW"] for a in alerts)
            needs_sent = any(a.alert_type in ["SENTIMENT_BULLISH", "SENTIMENT_BEARISH"] for a in alerts)
            
            tech_data = None
            if needs_tech:
                try:
                    from app.services.data_engine import get_stock_data
                    from app.services.indicator_engine import calculate_indicators
                    
                    df = get_stock_data(symbol)
                    if df is not None and len(df) >= 200:
                        tech_data = calculate_indicators(df)
                        logger.info(f"Tech data for {symbol}: price={tech_data.get('price')}, rsi={tech_data.get('rsi')}")
                except Exception as e:
                    logger.error(f"Error fetching tech data for {symbol} alerts: {e}")
                    
            sent_data = None
            if needs_sent:
                sent_data = get_news_for_symbol(symbol)
                
            for alert in alerts:
                triggered = False
                trigger_message = ""
                current_value = None
                
                try:
                    if alert.alert_type == "PRICE_ABOVE" and tech_data and tech_data["price"] >= alert.threshold_value:
                        triggered = True
                        current_value = tech_data["price"]
                        trigger_message = f"{symbol} price crossed above {alert.threshold_value}. Current: {current_value}"
                        
                    elif alert.alert_type == "PRICE_BELOW" and tech_data and tech_data["price"] <= alert.threshold_value:
                        triggered = True
                        current_value = tech_data["price"]
                        trigger_message = f"{symbol} price dropped below {alert.threshold_value}. Current: {current_value}"
                        
                    elif alert.alert_type == "RSI_ABOVE" and tech_data and tech_data.get("rsi", 0) >= alert.threshold_value:
                        triggered = True
                        current_value = tech_data["rsi"]
                        trigger_message = f"{symbol} RSI crossed above {alert.threshold_value}. Current: {current_value}"
                        
                    elif alert.alert_type == "RSI_BELOW" and tech_data and tech_data.get("rsi", 100) <= alert.threshold_value:
                        triggered = True
                        current_value = tech_data["rsi"]
                        trigger_message = f"{symbol} RSI dropped below {alert.threshold_value}. Current: {current_value}"
                        
                    elif alert.alert_type == "SENTIMENT_BULLISH" and sent_data and sent_data.get("aggregate_sentiment") == "bullish":
                        triggered = True
                        current_value = "bullish"
                        trigger_message = f"{symbol} overall sentiment turned bullish."
                        
                    elif alert.alert_type == "SENTIMENT_BEARISH" and sent_data and sent_data.get("aggregate_sentiment") == "bearish":
                        triggered = True
                        current_value = "bearish"
                        trigger_message = f"{symbol} overall sentiment turned bearish."

                    if triggered:
                        logger.info(f"Alert Triggered: {trigger_message}")
                        alert.is_active = False
                        alert.triggered_at = datetime.utcnow()
                        db.commit()
                        
                        # Dispatch Notifications
                        if alert.notify_webhook and alert.webhook_url:
                            payload = {
                                "alert_id": alert.id,
                                "symbol": alert.symbol,
                                "alert_type": alert.alert_type,
                                "message": trigger_message,
                                "current_value": current_value,
                                "timestamp": datetime.utcnow().isoformat()
                            }
                            await WebhookService.send_webhook(
                                url=alert.webhook_url,
                                broker="generic",
                                signal=payload
                            )
                            
                        if alert.notify_email:
                            logger.info(f"Mock sending Email to user {alert.user_id}: {trigger_message}")
                            # In production, integrate SendGrid/AWS SES here
                            
                except Exception as e:
                    logger.error(f"Error evaluating alert {alert.id}: {e}")
