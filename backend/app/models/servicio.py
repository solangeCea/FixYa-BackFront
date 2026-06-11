from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class Servicio(Base):
    __tablename__ = "servicio"

    id_servicio = Column(Integer, primary_key=True, index=True)
    nombre_servicio = Column(String(100), nullable=False)
    descripcion_servicio = Column(String(300))
    estado_servicio = Column(Boolean, default=True)