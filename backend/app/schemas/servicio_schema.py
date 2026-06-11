from pydantic import BaseModel
from typing import Optional


class ServicioCreate(BaseModel):
    nombre_servicio: str
    descripcion_servicio: Optional[str] = None


class ServicioResponse(BaseModel):
    id_servicio: int
    nombre_servicio: str
    descripcion_servicio: Optional[str] = None
    estado_servicio: bool

    class Config:
        from_attributes = True