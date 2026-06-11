from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class HistorialSolicitud(Base):
    __tablename__ = "historial_solicitud"

    id_historial = Column(Integer, primary_key=True, index=True)
    fecha_historial = Column(DateTime(timezone=True), server_default=func.now())
    motivo = Column(String, nullable=False)
    estado = Column(String, nullable=False)

    solicitud_id_solicitud = Column(
        Integer,
        ForeignKey("solicitud.id_solicitud"),
        nullable=False
    )

    usuario_rut = Column(
        String,
        ForeignKey("usuario.rut"),
        nullable=False
    )