from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class CancelacionCreate(BaseModel):
    motivo: str = Field(min_length=5, max_length=1000)


class CancelacionResolver(BaseModel):
    aprobar: bool
    observacion_admin: Optional[str] = Field(default=None, max_length=1000)


class CancelacionResponse(BaseModel):
    id_cancelacion: int
    solicitud_id_solicitud: int
    solicitante_rut: str
    solicitante_rol: str
    motivo: str
    estado: str
    estado_previo: Optional[str] = None
    fecha_solicitud: datetime
    fecha_resolucion: Optional[datetime] = None
    admin_rut_resuelve: Optional[str] = None
    observacion_admin: Optional[str] = None

    class Config:
        from_attributes = True


class CancelacionAdminResponse(CancelacionResponse):
    solicitud_titulo: Optional[str] = None
    solicitud_estado: Optional[str] = None
    solicitante_nombre: Optional[str] = None


class SolicitarCancelacionResultado(BaseModel):
    """Respuesta del endpoint de cancelación: indica si fue directa o si quedó
    en revisión del administrador."""

    resultado: Literal["CANCELADA_DIRECTA", "EN_REVISION_ADMIN"]
    mensaje: str
    id_solicitud: int
    estado: str
    id_cancelacion: Optional[int] = None
