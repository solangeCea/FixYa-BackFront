from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


EstadoRevisionEvidencia = Literal[
    "PENDIENTE_REVISION",
    "APROBADO",
    "RECHAZADO",
]

TipoEvidenciaTecnica = Literal[
    "CERTIFICADO",
    "TITULO",
    "CURSO",
    "LICENCIA",
    "FOTO_TRABAJO",
    "REFERENCIA_LABORAL",
    "PORTAFOLIO",
    "EXPERIENCIA_OFICIO",
    "OTRO",
]


class DocumentoTecnicoCreate(BaseModel):
    tecnico_usuario_rut: str
    tipo_documento: str
    nombre_archivo: str
    archivo_url: str


class DocumentoTecnicoResponse(BaseModel):
    id_documento: int
    tecnico_usuario_rut: str
    tipo_documento: str
    nombre_archivo: str
    archivo_url: str
    fecha_subida: datetime
    documento_aprobado: bool
    estado_revision: EstadoRevisionEvidencia = "PENDIENTE_REVISION"
    observacion_revision: Optional[str] = None
    fecha_aprobacion: Optional[datetime] = None
    fecha_revision: Optional[datetime] = None
    usuario_rut: Optional[str] = None
    revisado_por_rut: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentoTecnicoAprobacion(BaseModel):
    usuario_rut: Optional[str] = None
    observacion: Optional[str] = None
    
class TecnicoPendienteVerificacionResponse(BaseModel):
    usuario_rut: str
    descripcion_perfil: str
    experiencia_anios: int
    nivel_tecnico: str
    tecnico_verificado: bool

    class Config:
        from_attributes = True
