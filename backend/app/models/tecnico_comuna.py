from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class TecnicoComuna(Base):
    __tablename__ = "tecnico_comuna"

    tecnico_usuario_rut = Column(String(12), ForeignKey("tecnico.usuario_rut"), primary_key=True)
    comuna_id_comuna = Column(Integer, ForeignKey("comuna.id_comuna"), primary_key=True)
    estado_cobertura = Column(Boolean, default=True)
    fecha_registro = Column(DateTime, server_default=func.now())