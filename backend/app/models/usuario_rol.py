from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


class UsuarioRol(Base):
    __tablename__ = "usuario_rol"
    __table_args__ = (
        UniqueConstraint("usuario_rut", "rol", name="uq_usuario_rol"),
    )

    usuario_rut = Column(
        String(12),
        ForeignKey("usuario.rut", ondelete="CASCADE"),
        primary_key=True,
    )
    rol = Column(String(20), primary_key=True)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_asignacion = Column(DateTime, server_default=func.now(), nullable=False)
