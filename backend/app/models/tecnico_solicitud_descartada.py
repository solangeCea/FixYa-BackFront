from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


class TecnicoSolicitudDescartada(Base):
    __tablename__ = "tecnico_solicitud_descartada"
    __table_args__ = (
        UniqueConstraint(
            "solicitud_id_solicitud",
            "tecnico_usuario_rut",
            name="uq_tecnico_solicitud_descartada",
        ),
    )

    id_descarte = Column(Integer, primary_key=True, index=True)
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
    fecha_descarte = Column(DateTime, server_default=func.now(), nullable=False)
