from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class AuditLog(Base):
    """Registro de auditoría de acciones administrativas sensibles.

    Cada fila deja constancia inmutable de QUIÉN (admin), QUÉ (acción), sobre
    QUIÉN/QUÉ (entidad y usuario afectado), POR QUÉ (motivo), el cambio de
    estado (antes → después), CUÁNDO (fecha) y DESDE DÓNDE (IP). No se edita ni
    se borra: es la evidencia de trazabilidad del panel administrativo.
    """

    __tablename__ = "audit_log"

    id_audit = Column(Integer, primary_key=True, index=True)

    # Admin que ejecuta la acción. SET NULL para no perder el registro si el
    # usuario admin llegara a eliminarse; el correo queda como respaldo legible.
    admin_rut = Column(
        String(12),
        ForeignKey("usuario.rut", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    admin_correo = Column(String(150), nullable=True)

    accion = Column(String(50), nullable=False, index=True)
    entidad_tipo = Column(String(30), nullable=False, index=True)
    entidad_id = Column(String(50), nullable=True)

    # Usuario afectado por la acción (técnico, cliente, autor de la reseña, etc.).
    usuario_afectado_rut = Column(String(12), nullable=True, index=True)

    motivo = Column(String(1000), nullable=True)
    estado_antes = Column(String(50), nullable=True)
    estado_despues = Column(String(50), nullable=True)
    detalle = Column(String(1000), nullable=True)

    ip = Column(String(64), nullable=True)

    fecha = Column(DateTime, server_default=func.now(), nullable=False, index=True)
