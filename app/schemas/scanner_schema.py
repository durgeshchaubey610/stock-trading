from pydantic import BaseModel, Field
from typing import List, Any, Optional, Union, Dict

class FilterRule(BaseModel):
    field: str
    operator: str
    value: Any

class FilterGroup(BaseModel):
    condition: str  # "AND" or "OR"
    rules: List[Union[FilterRule, 'FilterGroup']]

class ScreenRequest(BaseModel):
    filters: Optional[FilterGroup] = None
    sort_by: Optional[str] = "market_cap"
    sort_order: Optional[str] = "desc"
    page: int = 1
    page_size: int = 30

FilterGroup.model_rebuild()
