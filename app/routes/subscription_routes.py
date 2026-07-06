from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_db_user
from app.models.user import User
from app.models.subscription import SubscriptionPlan, UserInvoice
from datetime import datetime, timedelta
import razorpay
import os
from pydantic import BaseModel

router = APIRouter(prefix="/subscription", tags=["Subscription"])

# Razorpay client (Use environment variables in production)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: int

@router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    if not plans:
        # Seed default plans if empty
        default_plans = [
            SubscriptionPlan(name="free", display_name="Free Plan", price=0, duration_days=365, features='["Basic Screener", "Health Tracking"]'),
            SubscriptionPlan(name="pro", display_name="Pro Plan", price=299, duration_days=30, features='["Advanced Screener", "Paper Trading", "AI Coach"]'),
            SubscriptionPlan(name="premium", display_name="Premium Plan", price=999, duration_days=30, features='["Family Health", "Insurance Planner", "Emergency SOS"]')
        ]
        db.add_all(default_plans)
        db.commit()
        plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    return plans

@router.post("/create-order")
def create_order(plan_id: int, user: User = Depends(get_db_user), db: Session = Depends(get_db)):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan.price == 0:
        # Handle free plan directly
        user.is_premium = False if plan.name == "free" else True
        user.subscription_tier = plan.name
        user.subscription_expiry = datetime.utcnow() + timedelta(days=plan.duration_days)
        db.commit()
        return {"status": "success", "message": "Subscribed to free plan"}

    order_data = {
        "amount": int(plan.price * 100), # Amount in paise
        "currency": plan.currency,
        "receipt": f"receipt_{user.id}_{int(datetime.utcnow().timestamp())}"
    }
    
    try:
        order = client.order.create(data=order_data)
        
        # Save invoice record as pending
        invoice = UserInvoice(
            user_id=user.id,
            plan_id=plan.id,
            amount=plan.price,
            currency=plan.currency,
            order_id=order['id'],
            payment_status="pending"
        )
        db.add(invoice)
        db.commit()
        
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating Razorpay order: {str(e)}")

@router.post("/verify-payment")
def verify_payment(data: PaymentVerification, user: User = Depends(get_db_user), db: Session = Depends(get_db)):
    params_dict = {
        'razorpay_order_id': data.razorpay_order_id,
        'razorpay_payment_id': data.razorpay_payment_id,
        'razorpay_signature': data.razorpay_signature
    }

    try:
        # Verify signature
        client.utility.verify_payment_signature(params_dict)
        
        # Update invoice
        invoice = db.query(UserInvoice).filter(UserInvoice.order_id == data.razorpay_order_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        invoice.payment_id = data.razorpay_payment_id
        invoice.signature = data.razorpay_signature
        invoice.payment_status = "paid"
        
        # Upgrade user
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == data.plan_id).first()
        user.is_premium = True
        user.subscription_tier = plan.name
        user.subscription_expiry = datetime.utcnow() + timedelta(days=plan.duration_days)
        
        db.commit()
        return {"status": "success", "message": "Payment verified and subscription activated"}
    except Exception as e:
        # Update invoice as failed if needed
        invoice = db.query(UserInvoice).filter(UserInvoice.order_id == data.razorpay_order_id).first()
        if invoice:
            invoice.payment_status = "failed"
            db.commit()
        raise HTTPException(status_code=400, detail="Payment verification failed")

@router.get("/invoices")
def get_user_invoices(user: User = Depends(get_db_user), db: Session = Depends(get_db)):
    return db.query(UserInvoice).filter(UserInvoice.user_id == user.id).all()
