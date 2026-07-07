from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


TipoConflicto = Literal[
    "TRABAJO_INCOMPLETO",
    "TRABAJO_DEFICIENTE",
    "NO_SE_PRESENTO",
    "COBRO_INDEBIDO",
    "DANOS_PROPIEDAD",
    "COMPORTAMIENTO_INADECUADO",
    "MATERIALES_NO_ACORDADOS",
    "INCUMPLIMIENTO_ACUERDO",
    "OTRO",
]

EstadoConflicto = Literal["PENDIENTE", "EN_REVISION", "CONFIRMADO", "DESCARTADO"]


class ConflictoEvidenciaResponse(BaseModel):
    id_evidencia: int
    nombre_archivo: str
    archivo_url: str
    fecha_subida: datetime

    class Config:
        from_attributes = True


class ConflictoResolver(BaseModel):
    estado: Literal["CONFIRMADO", "DESCARTADO"]
    observacion_admin: Optional[str] = Field(default=None, max_length=1000)


class ConflictoResponse(BaseModel):
    id_conflicto: int
    solicitud_id_solicitud: int
    reportante_rut: str
    reportante_rol: str
    tipo: str
    descripcion: str
    estado: str
    fecha_reporte: datetime
    fecha_revision: Optional[datetime] = None
    admin_rut_resuelve: Optional[str] = None
    observacion_admin: Optional[str] = None
    evidencias: List[ConflictoEvidenciaResponse] = []

    class Config:
        from_attributes = True


class ConflictoAdminResponse(ConflictoResponse):
    solicitud_titulo: Optional[str] = None
    solicitud_estado: Optional[str] = None
    reportante_nombre: Optional[str] = None
