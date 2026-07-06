from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_user
from app.models.basket import InvestmentBasket
from app.schemas.basket_schema import InvestmentBasketCreate, InvestmentBasketResponse
from app.services.price_service import PriceService

router = APIRouter(prefix="/baskets", tags=["Investment Baskets (Smallcases)"])

import json

@router.post("", response_model=InvestmentBasketResponse)
def create_basket(
    basket: InvestmentBasketCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new investment basket. 
    In a real app, this might be restricted to 'Experts' or 'Admins'.
    """
    # Ensure weights sum to ~100
    total_weight = sum(c.weight for c in basket.constituents)
    if not (99.0 <= total_weight <= 101.0):
        raise HTTPException(status_code=400, detail="Constituent weights must sum to 100%")
        
    db_basket = InvestmentBasket(
        name=basket.name,
        description=basket.description,
        category=basket.category,
        constituents=json.dumps([c.model_dump() for c in basket.constituents]), # Serialize
        risk_level=basket.risk_level,
        min_investment=basket.min_investment,
        creator_id=user["user_id"]
    )
    db.add(db_basket)
    db.commit()
    db.refresh(db_basket)
    
    # Deserialize for response
    db_basket.constituents = json.loads(db_basket.constituents)
    return db_basket

@router.get("", response_model=List[InvestmentBasketResponse])
def list_baskets(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List available curated baskets."""
    query = db.query(InvestmentBasket)
    if category:
        query = query.filter(InvestmentBasket.category == category)
    
    baskets = query.all()
    for b in baskets:
        if isinstance(b.constituents, str):
            b.constituents = json.loads(b.constituents)
    return baskets

@router.get("/{basket_id}")
def get_basket_details(
    basket_id: int,
    db: Session = Depends(get_db)
):
    """Fetch details and current performance of a basket."""
    basket = db.query(InvestmentBasket).filter(InvestmentBasket.id == basket_id).first()
    if not basket:
        raise HTTPException(status_code=404, detail="Basket not found")
        
    if isinstance(basket.constituents, str):
        basket.constituents = json.loads(basket.constituents)
        
    # Enrich with real-time prices
    symbols = [c["symbol"] for c in basket.constituents]
    prices = PriceService.get_latest_prices(symbols)
    
    enriched_constituents = []
    for c in basket.constituents:
        enriched_constituents.append({
            **c,
            "current_price": prices.get(c["symbol"], 0.0)
        })
        
    return {
        "id": basket.id,
        "name": basket.name,
        "description": basket.description,
        "category": basket.category,
        "constituents": enriched_constituents,
        "risk_level": basket.risk_level,
        "min_investment": basket.min_investment
    }
