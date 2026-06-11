from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ResenaCreate(BaseModel):
    id_solicitud: int
    calificacion: float = Field(..., ge=1, le=5)
    comentario: str


class ResenaResponse(BaseModel):
    id_resena: int
    solicitud_id_solicitud: int
    usuario_rut: str

    calificacion: float
    comentario: str

    fecha_resena: datetime

    resena_activa: str
    resena_reportada: Optional[str] = None
    motivo_reporte: Optional[str] = None

    
class Config:
        from_attributes = True

class ResolverReporteResena(BaseModel):
    aprobar_publicacion: bool
    motivo_reporte: Optional[str] = None
        