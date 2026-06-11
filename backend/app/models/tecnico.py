from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Tecnico(Base):
    __tablename__ = "tecnico"

    usuario_rut = Column(String(12), ForeignKey("usuario.rut"), primary_key=True)
    descripcion_perfil = Column(String(500), nullable=False)
    experiencia_anios = Column(Integer, nullable=False)
    nivel_tecnico = Column(String(30), nullable=False)
    tecnico_verificado = Column(Boolean, default=False)

    usuario = relationship("Usuario")