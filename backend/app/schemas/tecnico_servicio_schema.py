from pydantic import BaseModel


class TecnicoServicioCreate(BaseModel):
    tecnico_usuario_rut: str
    servicio_id_servicio: int


class TecnicoServicioResponse(BaseModel):
    tecnico_usuario_rut: str
    servicio_id_servicio: int

    class Config:
        from_attributes = True