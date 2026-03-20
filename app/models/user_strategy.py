from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class UserStrategy(Base):

    __tablename__ = "user_strategy"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer)

    strategy_name = Column(String(50))