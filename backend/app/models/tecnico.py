from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Tecnico(Base):
    __tablename__ = "tecnico"

    usuario_rut = Column(String(12), ForeignKey("usuario.rut"), primary_key=True)
    descripcion_perfil = Column(String(500), nullable=False)
    experiencia_anios = Column(Integer, nullable=False)
    nivel_tecnico = Column(String(30), nullable=False)
    tecnico_verificado = Column(Boolean, default=False)
    estado_verificacion = Column(String(20), default="PENDIENTE", nullable=False)
    fecha_solicitud = Column(DateTime, server_default=func.now(), nullable=True)
    fecha_revision = Column(DateTime, nullable=True)
    observacion_admin = Column(String(1000), nullable=True)
    admin_revisor_rut = Column(String(12), ForeignKey("usuario.rut"), nullable=True)

    usuario = relationship("Usuario")
