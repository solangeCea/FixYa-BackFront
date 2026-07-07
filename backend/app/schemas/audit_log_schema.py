from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id_audit: int
    admin_rut: str | None = None
    admin_correo: str | None = None
    accion: str
    entidad_tipo: str
    entidad_id: str | None = None
    usuario_afectado_rut: str | None = None
    motivo: str | None = None
    estado_antes: str | None = None
    estado_despues: str | None = None
    detalle: str | None = None
    ip: str | None = None
    fecha: datetime

    model_config = ConfigDict(from_attributes=True)
