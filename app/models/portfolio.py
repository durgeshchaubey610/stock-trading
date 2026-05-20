from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base
import datetime

class Portfolio(Base):

    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer)
    stock_symbol = Column(String(50))

    buy_price = Column(Float)
    quantity = Column(Integer)

    buy_number = Column(Integer)

    investment = Column(Float)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)