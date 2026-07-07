from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Boolean, text
from sqlalchemy.sql import func
from app.database import Base

class Cotizacion(Base):
    __tablename__ = "cotizacion"

    id_cotizacion = Column(Integer, primary_key=True, index=True)
    solicitud_id_solicitud = Column(Integer, ForeignKey("solicitud.id_solicitud"), nullable=False)
    tecnico_usuario_rut = Column(String(12), ForeignKey("tecnico.usuario_rut"), nullable=False)
    monto_estimado = Column(Numeric(10, 2), nullable=False)
    materiales_incluidos = Column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    mensaje_cotizacion = Column(String(500), nullable=True)
    fecha_cotizacion = Column(DateTime, server_default=func.now())
    fecha_vigencia = Column(DateTime, nullable=False)
    fecha_aceptacion = Column(DateTime, nullable=True)
    estado_cotizacion = Column(String(30), default="ENVIADA")
    motivo_anulacion = Column(String(300), nullable=True)
    archivo_pdf_url = Column(String(300), nullable=True)
    # Plazo estimado del trabajo (texto libre) y vínculo a la cotización original
    # cuando esta cotización nace de un cambio de alcance.
    plazo_estimado = Column(String(150), nullable=True)
    cotizacion_origen_id = Column(
        Integer, ForeignKey("cotizacion.id_cotizacion"), nullable=True
    )