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