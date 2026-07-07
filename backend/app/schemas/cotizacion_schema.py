from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal

# Tope de Numeric(10,2): evita 500 por overflow en la BD.
MONTO_MAX = Decimal("99999999.99")


def _validar_vigencia_futura(v: datetime) -> datetime:
    # Compara en naive (el resto del sistema usa datetime.utcnow()).
    ahora = datetime.utcnow()
    comparando = v.replace(tzinfo=None) if v.tzinfo else v
    if comparando <= ahora:
        raise ValueError("La vigencia debe ser una fecha futura")
    return v


class CotizacionCreate(BaseModel):
    solicitud_id_solicitud: int
    tecnico_usuario_rut: Optional[str] = None
    monto_estimado: Decimal = Field(gt=0, le=MONTO_MAX)
    materiales_incluidos: bool = False
    mensaje_cotizacion: Optional[str] = Field(default=None, max_length=500)
    plazo_estimado: Optional[str] = Field(default=None, max_length=150)
    fecha_vigencia: datetime

    _vig = field_validator("fecha_vigencia")(_validar_vigencia_futura)


class CambioAlcanceCreate(BaseModel):
    """Datos con que el técnico genera la nueva cotización tras un cambio de
    alcance detectado en terreno."""
    motivo: str = Field(min_length=1, max_length=300)
    monto_estimado: Decimal = Field(gt=0, le=MONTO_MAX)
    materiales_incluidos: bool = False
    mensaje_cotizacion: Optional[str] = Field(default=None, max_length=500)
    plazo_estimado: Optional[str] = Field(default=None, max_length=150)
    fecha_vigencia: datetime

    _vig = field_validator("fecha_vigencia")(_validar_vigencia_futura)

class CotizacionUpdate(BaseModel):
    monto_estimado: Optional[Decimal] = None
    materiales_incluidos: Optional[bool] = None
    mensaje_cotizacion: Optional[str] = None
    fecha_vigencia: Optional[datetime] = None
    estado_cotizacion: Optional[str] = None
    motivo_anulacion: Optional[str] = None

class CotizacionResponse(BaseModel):
    id_cotizacion: int
    solicitud_id_solicitud: int
    tecnico_usuario_rut: str
    monto_estimado: Decimal
    materiales_incluidos: bool = False
    mensaje_cotizacion: Optional[str]
    plazo_estimado: Optional[str] = None
    fecha_cotizacion: Optional[datetime]
    fecha_vigencia: datetime
    fecha_aceptacion: Optional[datetime]
    estado_cotizacion: str
    motivo_anulacion: Optional[str]
    archivo_pdf_url: Optional[str]
    cotizacion_origen_id: Optional[int] = None

    class Config:
        from_attributes = True
