from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func

from app.database import Base


class Chat(Base):
    """Chat privado entre el cliente y el técnico de una cotización aceptada.
    Existe uno por cotización aceptada (relación 1:1)."""

    __tablename__ = "chat"

    id_chat = Column(Integer, primary_key=True, index=True)
    cotizacion_id_cotizacion = Column(
        Integer, ForeignKey("cotizacion.id_cotizacion"), nullable=False, unique=True
    )
    solicitud_id_solicitud = Column(
        Integer, ForeignKey("solicitud.id_solicitud"), nullable=False
    )
    cliente_rut = Column(String(12), ForeignKey("usuario.rut"), nullable=False)
    tecnico_rut = Column(String(12), ForeignKey("usuario.rut"), nullable=False)
    fecha_creacion = Column(DateTime, server_default=func.now())
    activo = Column(Boolean, default=True, nullable=False)


class MensajeChat(Base):
    __tablename__ = "mensaje_chat"

    id_mensaje = Column(Integer, primary_key=True, index=True)
    chat_id_chat = Column(Integer, ForeignKey("chat.id_chat"), nullable=False, index=True)
    emisor_rut = Column(String(12), ForeignKey("usuario.rut"), nullable=False)
    contenido = Column(String(1000), nullable=False)
    fecha_envio = Column(DateTime, server_default=func.now())
    leido = Column(Boolean, default=False, nullable=False)
    # Mensaje automático generado por la plataforma (avisos del flujo, no de un usuario).
    es_sistema = Column(Boolean, default=False, nullable=False)
