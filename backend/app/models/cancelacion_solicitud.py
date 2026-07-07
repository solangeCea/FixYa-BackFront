from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class CancelacionSolicitud(Base):
    """Solicitud de cancelación de un trabajo que está EN_PROCESO y por eso
    requiere revisión del administrador (no se cancela de forma directa).

    Mientras está PENDIENTE, la solicitud queda en estado EN_REVISION_ADMIN.
    Si el admin la APRUEBA, la solicitud pasa a CANCELADO; si la RECHAZA, se
    restaura `estado_previo` (normalmente EN_PROCESO).
    """

    __tablename__ = "cancelacion_solicitud"

    id_cancelacion = Column(Integer, primary_key=True, index=True)
    solicitud_id_solicitud = Column(
        Integer,
        ForeignKey("solicitud.id_solicitud", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    solicitante_rut = Column(
        String(12), ForeignKey("usuario.rut"), nullable=False, index=True
    )
    solicitante_rol = Column(String(10), nullable=False)  # CLIENTE / TECNICO
    motivo = Column(String(1000), nullable=False)

    estado = Column(String(15), nullable=False, default="PENDIENTE", index=True)
    estado_previo = Column(String(20), nullable=True)

    fecha_solicitud = Column(DateTime, server_default=func.now(), nullable=False)
    fecha_resolucion = Column(DateTime, nullable=True)
    admin_rut_resuelve = Column(String(12), ForeignKey("usuario.rut"), nullable=True)
    observacion_admin = Column(String(1000), nullable=True)
