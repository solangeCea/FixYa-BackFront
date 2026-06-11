from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
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

    fecha_aprobacion = Column(DateTime, nullable=True)

    usuario_rut = Column(String(12), ForeignKey("usuario.rut"), nullable=True)