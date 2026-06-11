from pydantic import BaseModel
from datetime import datetime


class TecnicoComunaCreate(BaseModel):
    tecnico_usuario_rut: str
    comuna_id_comuna: int


class TecnicoComunaResponse(BaseModel):
    tecnico_usuario_rut: str
    comuna_id_comuna: int
    estado_cobertura: bool
    fecha_registro: datetime

    class Config:
        from_attributes = True