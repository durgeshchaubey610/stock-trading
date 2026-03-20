from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

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