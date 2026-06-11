from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Notificacion(Base):
    __tablename__ = "notificacion"

    id_notificacion = Column(Integer, primary_key=True, index=True)

    usuario_rut = Column(
        String(12),
        ForeignKey("usuario.rut"),
        nullable=False
    )

    titulo = Column(String(150), nullable=False)
    mensaje = Column(String(500), nullable=False)
    tipo = Column(String(50), nullable=False)

    leida = Column(Boolean, default=False)

    fecha_creacion = Column(
        DateTime,
        server_default=func.now()
    )

    usuario = relationship(
        "Usuario",
        back_populates="notificaciones"
    )