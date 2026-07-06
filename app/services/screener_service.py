from sqlalchemy import and_, or_, desc, asc
from sqlalchemy.orm import Session
from app.models.stock import Stock
from app.schemas.scanner_schema import FilterGroup, FilterRule
from typing import Any, List, Union

class ScreenerService:
    @staticmethod
    def apply_filters(db: Session, request_filters: FilterGroup):
        """
        Main entry point to apply filters to a query.
        """
        query = db.query(Stock)
        
        if request_filters:
            sqlalchemy_filter = ScreenerService._build_filter(request_filters)
            query = query.filter(sqlalchemy_filter)
            
        return query

    @staticmethod
    def _build_filter(group: FilterGroup):
        """
        Recursively builds SQLAlchemy filters from FilterGroup.
        """
        rules = []
        for rule in group.rules:
            if isinstance(rule, FilterGroup):
                rules.append(ScreenerService._build_filter(rule))
            else:
                rules.append(ScreenerService._apply_rule(rule))
        
        if group.condition.upper() == "OR":
            return or_(*rules)
        return and_(*rules)

    @staticmethod
    def _apply_rule(rule: FilterRule):
        """
        Applies a single FilterRule to a SQLAlchemy column.
        """
        if rule.field == 'sector':
            val = rule.value
            return or_(
                Stock.sector == val,
                Stock.sub_sector == val
            )

        if not hasattr(Stock, rule.field):
            # Fallback or handle invalid fields
            # For now, return a neutral filter (always true)
            return True
            
        column = getattr(Stock, rule.field)
        op = rule.operator.lower()
        val = rule.value

        if op == "=" or op == "==":
            return column == val
        elif op == "!=" or op == "<>":
            return column != val
        elif op == ">":
            return column > val
        elif op == ">=":
            return column >= val
        elif op == "<":
            return column < val
        elif op == "<=":
            return column <= val
        elif op == "between":
            if isinstance(val, list) and len(val) == 2:
                return column.between(val[0], val[1])
        elif op == "in":
            if isinstance(val, list):
                return column.in_(val)
        elif op == "contains":
            return column.ilike(f"%{val}%")
        elif op == "starts_with":
            return column.ilike(f"{val}%")
        elif op == "ends_with":
            return column.ilike(f"%{val}")
            
        return True

    @staticmethod
    def screen_stocks(db: Session, request):
        """
        Executes the screening process: filter, sort, paginate.
        """
        query = ScreenerService.apply_filters(db, request.filters)
        
        # Apply Sorting
        if request.sort_by and hasattr(Stock, request.sort_by):
            col = getattr(Stock, request.sort_by)
            if request.sort_order.lower() == "desc":
                query = query.order_by(desc(col))
            else:
                query = query.order_by(asc(col))
        
        total_count = query.count()
        
        # Apply Pagination
        offset = (request.page - 1) * request.page_size
        stocks = query.offset(offset).limit(request.page_size).all()
        
        return {
            "total_count": total_count,
            "page": request.page,
            "page_size": request.page_size,
            "stocks": stocks
        }
