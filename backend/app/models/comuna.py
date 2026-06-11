from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class Comuna(Base):
    __tablename__ = "comuna"

    id_comuna = Column(Integer, primary_key=True, index=True)
    nombre_comuna = Column(String(100), nullable=False)

    region_id_region = Column(
        Integer,
        ForeignKey("region.id_region"),
        nullable=False
    )