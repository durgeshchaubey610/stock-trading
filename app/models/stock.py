from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Stock(Base):

    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True)
    symbol = Column(String(50))
    price = Column(Float)
    week52_low = Column(Float)
    week52_high = Column(Float)