import os
try:
    import psutil
except ImportError:
    psutil = None
import time
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/health", tags=["Monitoring"])

START_TIME = time.time()

@router.get("")
def health_check(db: Session = Depends(get_db)):
    """
    Standard health check endpoint to monitor database connectivity and service status.
    """
    db_status = "connected"
    error = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "disconnected"
        error = str(e)

    status = "healthy" if db_status == "connected" else "unhealthy"

    return {
        "status": status,
        "database": db_status,
        "error": error,
        "timestamp": datetime.now().isoformat(),
        "version": "1.1.0"
    }

@router.get("/detailed")
def detailed_health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check including system metrics and uptime.
    """
    # Database Check
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    # System Metrics
    system_metrics = {}
    if psutil:
        try:
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()
            disk = psutil.disk_usage('/')
            
            system_metrics = {
                "cpu_usage_pct": psutil.cpu_percent(interval=None),
                "memory": {
                    "rss_mb": round(memory_info.rss / (1024 * 1024), 2),
                    "vms_mb": round(memory_info.vms / (1024 * 1024), 2),
                    "system_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
                    "system_available_gb": round(psutil.virtual_memory().available / (1024**3), 2)
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "used_gb": round(disk.used / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "percent": disk.percent
                }
            }
        except Exception as e:
            system_metrics = {"error": f"Failed to fetch system metrics: {str(e)}"}
    else:
        system_metrics = {"error": "psutil library not installed"}
    
    uptime_seconds = time.time() - START_TIME
    
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "service": {
            "name": "AI Stock Trader Backend",
            "version": "1.1.0",
            "uptime_seconds": round(uptime_seconds, 2),
            "start_time": datetime.fromtimestamp(START_TIME).isoformat()
        },
        "database": {
            "status": db_status,
            "engine": "MySQL/PostgreSQL"
        },
        "system": system_metrics,
        "timestamp": datetime.now().isoformat()
    }
