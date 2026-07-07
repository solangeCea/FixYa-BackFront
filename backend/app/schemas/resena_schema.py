from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ResenaCreate(BaseModel):
    id_solicitud: int
    calificacion: float = Field(..., ge=1, le=5)
    # max_length = ancho de columna (String(1000)); min_length evita reseñas vacías.
    comentario: str = Field(..., min_length=1, max_length=1000)


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

    # Trazabilidad de moderación (necesaria para el panel de admin)
    fecha_reporte: Optional[datetime] = None
    reporte_resuelto: Optional[str] = None
    fecha_resolucion: Optional[datetime] = None
    usuario_rut_reporta: Optional[str] = None
    admin_rut_resuelve: Optional[str] = None

    # Análisis de IA (moderación + clasificación)
    categorias: Optional[str] = None
    sentimiento: Optional[str] = None
    resumen_ia: Optional[str] = None
    analisis_modo: Optional[str] = None

    class Config:
        from_attributes = True

class ResolverReporteResena(BaseModel):
    aprobar_publicacion: bool
    motivo_reporte: Optional[str] = None
        