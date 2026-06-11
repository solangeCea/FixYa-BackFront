from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class SolicitudFinalizar(BaseModel):
    costo_final: Decimal


class SolicitudEstadoUpdate(BaseModel):
    estado_trabajo: str


class SolicitudCreate(BaseModel):
    usuario_rut: str
    servicio_id_servicio: int
    comuna_id_comuna: int
    titulo_solicitud: str
    descripcion_problema: str
    urgencia: str
    direccion: str
    tipo_problema: str
    foto_problema: Optional[str] = None
    ubicacion_problema_referencia: str


class SolicitudUpdate(BaseModel):
    tecnico_usuario_rut: Optional[str] = None
    titulo_solicitud: Optional[str] = None
    descripcion_problema: Optional[str] = None
    urgencia: Optional[str] = None
    direccion: Optional[str] = None
    estado_trabajo: Optional[str] = None
    solicitud_activa: Optional[bool] = None
    fecha_asignacion: Optional[datetime] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin_estimada: Optional[datetime] = None
    costo_final: Optional[Decimal] = None
    tipo_problema: Optional[str] = None
    foto_problema: Optional[str] = None
    ubicacion_problema_referencia: Optional[str] = None
    fecha_real: Optional[datetime] = None


class SolicitudResponse(BaseModel):
    id_solicitud: int
    usuario_rut: str
    servicio_id_servicio: int
    tecnico_usuario_rut: Optional[str] = None
    comuna_id_comuna: int
    titulo_solicitud: str
    descripcion_problema: str
    urgencia: str
    direccion: str
    fecha_creacion: datetime
    solicitud_activa: bool
    estado_trabajo: str
    tipo_problema: str
    foto_problema: Optional[str] = None
    ubicacion_problema_referencia: str
    costo_final: Optional[Decimal] = None
    fecha_real: Optional[datetime] = None

    class Config:
        from_attributes = True