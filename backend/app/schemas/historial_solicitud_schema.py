from pydantic import BaseModel
from datetime import datetime

class HistorialCreate(BaseModel):
    motivo: str
    estado: str
    solicitud_id_solicitud: int
    usuario_rut: str

class HistorialResponse(BaseModel):
    fecha_historial: datetime
    motivo: str
    estado: str
    solicitud_id_solicitud: int
    usuario_rut: str

    class Config:
        from_attributes = True


class TimelineEventoResponse(BaseModel):
    """Evento enriquecido para la línea de tiempo (incluye datos del actor)."""

    id_historial: int
    fecha_historial: datetime
    estado: str
    motivo: str
    solicitud_id_solicitud: int
    usuario_rut: str
    usuario_nombre: str | None = None
    usuario_rol: str | None = None
