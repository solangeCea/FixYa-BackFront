from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric
from sqlalchemy.sql import func
from app.database import Base


class Resena(Base):
    __tablename__ = "resena"

    id_resena = Column(Integer, primary_key=True, index=True)

    solicitud_id_solicitud = Column(
        Integer,
        ForeignKey("solicitud.id_solicitud"),
        unique=True,
        nullable=False
    )

    usuario_rut = Column(
        String(12),
        ForeignKey("usuario.rut"),
        nullable=False
    )

    calificacion = Column(Numeric(2, 1), nullable=False)
    comentario = Column(String(1000), nullable=False)
    fecha_resena = Column(DateTime, server_default=func.now(), nullable=False)

    resena_activa = Column(String(1), default="S", nullable=False)
    resena_reportada = Column(String(1), nullable=True)
    motivo_reporte = Column(String(300), nullable=True)
    fecha_reporte = Column(DateTime, nullable=True)
    reporte_resuelto = Column(String(1), nullable=True)
    fecha_resolucion = Column(DateTime, nullable=True)

    usuario_rut_reporta = Column(String(12), ForeignKey("usuario.rut"), nullable=True)
    admin_rut_resuelve = Column(String(12), ForeignKey("usuario.rut"), nullable=True)