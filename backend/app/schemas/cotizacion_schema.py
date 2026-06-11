from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class CotizacionCreate(BaseModel):
    solicitud_id_solicitud: int
    tecnico_usuario_rut: str
    monto_estimado: Decimal
    mensaje_cotizacion: Optional[str] = None
    fecha_vigencia: datetime

class CotizacionUpdate(BaseModel):
    monto_estimado: Optional[Decimal] = None
    mensaje_cotizacion: Optional[str] = None
    fecha_vigencia: Optional[datetime] = None
    estado_cotizacion: Optional[str] = None
    motivo_anulacion: Optional[str] = None

class CotizacionResponse(BaseModel):
    id_cotizacion: int
    solicitud_id_solicitud: int
    tecnico_usuario_rut: str
    monto_estimado: Decimal
    mensaje_cotizacion: Optional[str]
    fecha_cotizacion: Optional[datetime]
    fecha_vigencia: datetime
    fecha_aceptacion: Optional[datetime]
    estado_cotizacion: str
    motivo_anulacion: Optional[str]
    archivo_pdf_url: Optional[str]

    class Config:
        from_attributes = True