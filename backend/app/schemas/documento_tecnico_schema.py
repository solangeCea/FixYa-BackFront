from pydantic import BaseModel
from datetime import datetime
from typing import Optional


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
    fecha_aprobacion: Optional[datetime] = None
    usuario_rut: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentoTecnicoAprobacion(BaseModel):
    usuario_rut: str
    
class TecnicoPendienteVerificacionResponse(BaseModel):
    usuario_rut: str
    descripcion_perfil: str
    experiencia_anios: int
    nivel_tecnico: str
    tecnico_verificado: bool

    class Config:
        from_attributes = True