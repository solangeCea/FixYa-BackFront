from sqlalchemy import Column, Integer, String
from app.database import Base


class Region(Base):
    __tablename__ = "region"

    id_region = Column(Integer, primary_key=True, index=True)
    nombre_region = Column(String(100), unique=True, nullable=False)