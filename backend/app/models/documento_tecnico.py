from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, text
from datetime import datetime

from app.database import Base


class DocumentoTecnico(Base):
    __tablename__ = "documento_tecnico"

    id_documento = Column(Integer, primary_key=True, index=True)

    tecnico_usuario_rut = Column(String(12), ForeignKey("tecnico.usuario_rut"), nullable=False)

    tipo_documento = Column(String(50), nullable=False)
    nombre_archivo = Column(String(200), nullable=False)
    archivo_url = Column(String(300), nullable=False)

    fecha_subida = Column(DateTime, default=datetime.utcnow, nullable=False)

    documento_aprobado = Column(Boolean, default=False, nullable=False)

    # Estado de revisión explícito: PENDIENTE / APROBADO / RECHAZADO.
    # documento_aprobado se conserva por compatibilidad (True solo si APROBADO).
    # server_default: para que create_all cree la columna con DEFAULT en la BD
    # (así los INSERT crudos del seed no violan NOT NULL en una base nueva).
    estado_documento = Column(
        String(20), default="PENDIENTE", server_default=text("'PENDIENTE'"), nullable=False
    )

    # Motivo del rechazo escrito por el admin (solo cuando estado = RECHAZADO).
    motivo_rechazo = Column(String(500), nullable=True)

    fecha_aprobacion = Column(DateTime, nullable=True)

    usuario_rut = Column(String(12), ForeignKey("usuario.rut"), nullable=True)