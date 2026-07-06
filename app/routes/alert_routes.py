from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth import get_current_user
from app.schemas.alert_schema import AlertCreate, AlertResponse
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.post("", response_model=AlertResponse)
def create_alert(
    alert: AlertCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new custom alert for the user.
    """
    return AlertService.create_alert(db, user["user_id"], alert)

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches all alerts for the authenticated user.
    """
    return AlertService.get_user_alerts(db, user["user_id"])

@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes an alert.
    """
    success = AlertService.delete_alert(db, alert_id, user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found or not authorized")
    return {"message": "Alert deleted successfully"}
