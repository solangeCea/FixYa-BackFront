from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func

from app.database import Base


class PasswordResetToken(Base):
    """Token de un solo uso para restablecer la contraseña.

    Se almacena el HASH del token (nunca el token en claro). El token real solo
    viaja en el enlace enviado al correo del usuario.
    """
    __tablename__ = "password_reset_token"

    id = Column(Integer, primary_key=True, index=True)
    usuario_rut = Column(
        String(12),
        ForeignKey("usuario.rut", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expira_en = Column(DateTime, nullable=False)
    usado = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
