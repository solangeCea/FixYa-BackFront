from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


class ReporteSolicitud(Base):
    __tablename__ = "reporte_solicitud"
    __table_args__ = (
        UniqueConstraint(
            "solicitud_id_solicitud",
            "tecnico_usuario_rut",
            name="uq_reporte_solicitud_tecnico",
        ),
    )

    id_reporte = Column(Integer, primary_key=True, index=True)
    solicitud_id_solicitud = Column(
        Integer,
        ForeignKey("solicitud.id_solicitud", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tecnico_usuario_rut = Column(
        String(12),
        ForeignKey("tecnico.usuario_rut", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    motivo = Column(String(150), nullable=False)
    comentario = Column(String(1000), nullable=True)
    estado_reporte = Column(String(20), default="PENDIENTE", nullable=False, index=True)
    fecha_reporte = Column(DateTime, server_default=func.now(), nullable=False)
    fecha_revision = Column(DateTime, nullable=True)
    admin_rut_resuelve = Column(String(12), ForeignKey("usuario.rut"), nullable=True)
    observacion_admin = Column(String(1000), nullable=True)
