from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class MensajeChatCreate(BaseModel):
    contenido: str

    @field_validator("contenido")
    @classmethod
    def contenido_no_vacio(cls, v: str) -> str:
        texto = (v or "").strip()
        if not texto:
            raise ValueError("El mensaje no puede estar vacio")
        return texto[:1000]


class MensajeChatResponse(BaseModel):
    id_mensaje: int
    chat_id_chat: int
    emisor_rut: str
    contenido: str
    fecha_envio: Optional[datetime]
    leido: bool
    es_sistema: bool = False

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    id_chat: int
    cotizacion_id_cotizacion: int
    solicitud_id_solicitud: int
    cliente_rut: str
    tecnico_rut: str
    fecha_creacion: Optional[datetime]
    activo: bool

    class Config:
        from_attributes = True
