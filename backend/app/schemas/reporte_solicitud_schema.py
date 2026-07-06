from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


MotivoReporteSolicitud = Literal[
    "SOSPECHA_ESTAFA",
    "SUPLANTACION",
    "INFORMACION_FALSA",
    "SOLICITUD_DUPLICADA",
    "CONTENIDO_INAPROPIADO",
    "SERVICIO_INCORRECTO",
    "CONTACTO_SOSPECHOSO",
    "UBICACION_SOSPECHOSA",
    "RIESGO_SEGURIDAD",
    "PAGO_FUERA_FIXYA",
    "OTRO_MOTIVO",
]

EstadoReporteSolicitud = Literal[
    "PENDIENTE",
    "EN_REVISION",
    "DESCARTADO",
    "CONFIRMADO",
]


class SolicitudDescartadaResponse(BaseModel):
    id_descarte: int
    solicitud_id_solicitud: int
    tecnico_usuario_rut: str
    fecha_descarte: datetime

    class Config:
        from_attributes = True


class ReporteSolicitudCreate(BaseModel):
    motivo: MotivoReporteSolicitud
    comentario: Optional[str] = Field(default=None, max_length=1000)
    descripcion_otro: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validar_otro_motivo(self):
        if self.motivo == "OTRO_MOTIVO":
            if not self.descripcion_otro or not self.descripcion_otro.strip():
                raise ValueError("descripcion_otro es obligatoria para Otro motivo")

        return self


class ReporteSolicitudResolver(BaseModel):
    estado_reporte: EstadoReporteSolicitud
    observacion_admin: Optional[str] = Field(default=None, max_length=1000)
    solicitud_activa: Optional[bool] = None


class ReporteSolicitudResponse(BaseModel):
    id_reporte: int
    solicitud_id_solicitud: int
    tecnico_usuario_rut: str
    motivo: str
    comentario: Optional[str] = None
    estado_reporte: str
    fecha_reporte: datetime
    fecha_revision: Optional[datetime] = None
    admin_rut_resuelve: Optional[str] = None
    observacion_admin: Optional[str] = None

    class Config:
        from_attributes = True


class ReporteSolicitudAdminResponse(ReporteSolicitudResponse):
    solicitud_titulo: Optional[str] = None
    solicitud_estado: Optional[str] = None
    solicitud_activa: Optional[bool] = None
    cliente_usuario_rut: Optional[str] = None
