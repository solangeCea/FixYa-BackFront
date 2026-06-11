from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Solicitud(Base):
    __tablename__ = "solicitud"

    id_solicitud = Column(Integer, primary_key=True, index=True)
    usuario_rut = Column(String(12), ForeignKey("usuario.rut"), nullable=False)
    servicio_id_servicio = Column(Integer, ForeignKey("servicio.id_servicio"), nullable=False)
    tecnico_usuario_rut = Column(String(12), ForeignKey("tecnico.usuario_rut"), nullable=True)
    comuna_id_comuna = Column(Integer, ForeignKey("comuna.id_comuna"), nullable=False)

    titulo_solicitud = Column(String(150), nullable=False)
    descripcion_problema = Column(String(1000), nullable=False)
    urgencia = Column(String(10), nullable=False)
    direccion = Column(String(200), nullable=False)
    fecha_creacion = Column(DateTime, server_default=func.now())
    solicitud_activa = Column(Boolean, default=True)
    estado_trabajo = Column(String(20), nullable=False, default="INICIADO")

    fecha_asignacion = Column(DateTime, nullable=True)
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_fin_estimada = Column(DateTime, nullable=True)
    costo_final = Column(Numeric(10, 2), nullable=True)

    tipo_problema = Column(String(50), nullable=False)
    foto_problema = Column(String(300), nullable=True)
    ubicacion_problema_referencia = Column(String(30), nullable=False)
    fecha_real = Column(DateTime, nullable=True)