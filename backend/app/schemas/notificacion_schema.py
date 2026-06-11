from pydantic import BaseModel
from datetime import datetime


class NotificacionResponse(BaseModel):
    id_notificacion: int
    usuario_rut: str
    titulo: str
    mensaje: str
    tipo: str
    leida: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True
        