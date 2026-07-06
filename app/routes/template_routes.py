from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth import get_current_user
from app.models.screener_template import ScreenerTemplate
from app.schemas.template_schema import ScreenerTemplateCreate, ScreenerTemplateUpdate, ScreenerTemplateResponse

router = APIRouter(prefix="/templates", tags=["Screener Templates"])

import json

@router.post("", response_model=ScreenerTemplateResponse)
def create_template(
    template: ScreenerTemplateCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new custom screener template."""
    db_template = ScreenerTemplate(
        user_id=user["user_id"],
        name=template.name,
        description=template.description,
        filters=json.dumps(template.filters), # Serialize to string
        is_public=template.is_public
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    # Deserialize for response
    db_template.filters = json.loads(db_template.filters)
    return db_template

@router.get("/me", response_model=List[ScreenerTemplateResponse])
def get_my_templates(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all templates created by the authenticated user."""
    templates = db.query(ScreenerTemplate).filter(ScreenerTemplate.user_id == user["user_id"]).all()
    for t in templates:
        if isinstance(t.filters, str):
            t.filters = json.loads(t.filters)
    return templates

@router.get("/community", response_model=List[ScreenerTemplateResponse])
def get_community_templates(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    sort_by: str = Query("upvotes", description="Sort by 'upvotes' or 'recent'")
):
    """
    Get public templates shared by the community.
    Does not require authentication.
    """
    query = db.query(ScreenerTemplate).filter(ScreenerTemplate.is_public == True)
    
    if sort_by == "recent":
        query = query.order_by(ScreenerTemplate.created_at.desc())
    else:
        query = query.order_by(ScreenerTemplate.upvotes.desc())
        
    templates = query.limit(limit).all()
    for t in templates:
        if isinstance(t.filters, str):
            t.filters = json.loads(t.filters)
    return templates

@router.put("/{template_id}", response_model=ScreenerTemplateResponse)
def update_template(
    template_id: int,
    updates: ScreenerTemplateUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing template owned by the user."""
    db_template = db.query(ScreenerTemplate).filter(
        ScreenerTemplate.id == template_id,
        ScreenerTemplate.user_id == user["user_id"]
    ).first()
    
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "filters":
            value = json.dumps(value)
        setattr(db_template, key, value)
        
    db.commit()
    db.refresh(db_template)
    db_template.filters = json.loads(db_template.filters)
    return db_template

@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a template owned by the user."""
    db_template = db.query(ScreenerTemplate).filter(
        ScreenerTemplate.id == template_id,
        ScreenerTemplate.user_id == user["user_id"]
    ).first()
    
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    db.delete(db_template)
    db.commit()
    return {"message": "Template deleted successfully"}

@router.post("/{template_id}/upvote")
def upvote_template(
    template_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upvote a community template."""
    db_template = db.query(ScreenerTemplate).filter(ScreenerTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    if not db_template.is_public and db_template.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot upvote private templates")
        
    # In a real app, track who upvoted to prevent multiple votes. 
    # Simplified for MVP.
    db_template.upvotes += 1
    db.commit()
    return {"message": "Upvoted successfully", "upvotes": db_template.upvotes}
