from sqlalchemy import (
    Column,
    String,
    Date,
    Boolean,
    ForeignKey,
    Integer,
    DateTime
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Enum as SqlEnum

from app.database import Base
from app.enums.usuario_enum import TipoUsuario


class Usuario(Base):

    __tablename__ = "usuario"

    id_usuario = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    rut = Column(
        String(12),
        unique=True,
        nullable=False
    )

    nombre_completo = Column(
        String(150),
        nullable=False
    )

    fecha_nacimiento = Column(
        Date,
        nullable=False
    )

    genero = Column(
        String(20),
        nullable=False
    )

    correo = Column(
        String(120),
        unique=True,
        nullable=False
    )

    telefono = Column(
        String(20)
    )

    contrasena = Column(
        String,
        nullable=False
    )

    estado_usuario = Column(
        Boolean,
        default=True
    )

    comuna_id_comuna = Column(
        ForeignKey("comuna.id_comuna"),
        nullable=False
    )

    tipo_usuario = Column(
        SqlEnum(TipoUsuario),
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    # RELACIÓN CON NOTIFICACIONES
    notificaciones = relationship(
        "Notificacion",
        back_populates="usuario"
    )