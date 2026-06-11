from sqlalchemy import Column, String, Integer, ForeignKey
from app.database import Base

class TecnicoServicio(Base):
    __tablename__ = "tecnico_servicio"

    tecnico_usuario_rut = Column(String(12), ForeignKey("tecnico.usuario_rut"), primary_key=True)
    servicio_id_servicio = Column(Integer, ForeignKey("servicio.id_servicio"), primary_key=True)