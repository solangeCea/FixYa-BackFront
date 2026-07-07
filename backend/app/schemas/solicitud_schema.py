from pydantic import BaseModel, Field, model_validator
from typing import Optional, Literal, List
from datetime import datetime
from decimal import Decimal


DiaSemana = Literal[
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
    "SABADO",
    "DOMINGO",
]


class SolicitudFinalizar(BaseModel):
    # > 0 y dentro del tope Numeric(10,2) para evitar montos inválidos o 500 por overflow.
    costo_final: Decimal = Field(gt=0, le=Decimal("99999999.99"))


class SolicitudEstadoUpdate(BaseModel):
    estado_trabajo: str
    motivo: Optional[str] = "Cambio de estado administrativo"
    usuario_rut: Optional[str] = None


class SolicitudDisponibilidadBase(BaseModel):
    dia: DiaSemana
    hora_inicio: str = Field(pattern=r"^\d{2}:\d{2}$")
    hora_fin: str = Field(pattern=r"^\d{2}:\d{2}$")

    @model_validator(mode="after")
    def validar_rango_horario(self):
        inicio = self._minutos_desde_medianoche(self.hora_inicio)
        fin = self._minutos_desde_medianoche(self.hora_fin)

        if fin <= inicio:
            raise ValueError("hora_fin debe ser posterior a hora_inicio")

        return self

    @staticmethod
    def _minutos_desde_medianoche(value: str) -> int:
        horas, minutos = value.split(":")
        horas_int = int(horas)
        minutos_int = int(minutos)

        if horas_int > 23 or minutos_int > 59:
            raise ValueError("El horario debe estar en formato HH:MM valido")

        return horas_int * 60 + minutos_int


class SolicitudDisponibilidadCreate(SolicitudDisponibilidadBase):
    pass


class SolicitudDisponibilidadResponse(SolicitudDisponibilidadBase):
    class Config:
        from_attributes = True


class SolicitudCreate(BaseModel):
    usuario_rut: str
    servicio_id_servicio: int
    comuna_id_comuna: int
    titulo_solicitud: str = Field(min_length=10, max_length=100)
    descripcion_problema: str = Field(min_length=20, max_length=1000)
    urgencia: Literal["BAJA", "MEDIA", "ALTA"]  
    direccion: str = Field(min_length=10, max_length=200)
    tipo_problema: str = Field(min_length=3, max_length=50)
    foto_problema: Optional[str] = None
    ubicacion_problema_referencia: str = Field(min_length=3, max_length=200) 
    tipo_inmueble: Optional[str] = Field(default=None, min_length=3, max_length=30)
    detalle_inmueble: Optional[str] = Field(default=None, max_length=200)
    piso: Optional[str] = Field(default=None, max_length=20)
    numero_departamento: Optional[str] = Field(default=None, max_length=30)
    tiene_conserjeria: Optional[bool] = None
    requiere_autorizacion: Optional[bool] = None
    horario_disponible: Optional[str] = Field(default=None, min_length=3, max_length=200)
    condiciones_acceso: Optional[str] = Field(default=None, max_length=500)
    instrucciones_acceso: Optional[str] = Field(default=None, max_length=500)
    persona_contacto: Optional[str] = Field(default=None, max_length=120)
    telefono_contacto: Optional[str] = Field(default=None, max_length=20)
    estacionamiento_disponible: Optional[bool] = None
    tiene_mascotas: Optional[bool] = None
    disponibilidad_horaria: Optional[List[SolicitudDisponibilidadCreate]] = None

    @model_validator(mode="after")
    def validar_contexto_inmueble(self):
        tiene_disponibilidad_estructurada = bool(self.disponibilidad_horaria)
        tiene_disponibilidad_legacy = bool(
            self.horario_disponible and self.horario_disponible.strip()
        )

        if not tiene_disponibilidad_estructurada and not tiene_disponibilidad_legacy:
            raise ValueError(
                "Debe informar disponibilidad_horaria u horario_disponible"
            )

        if self.disponibilidad_horaria:
            dias = [item.dia for item in self.disponibilidad_horaria]

            if len(dias) != len(set(dias)):
                raise ValueError("No se puede repetir el mismo dia en disponibilidad_horaria")

        campos_contexto = [
            self.tipo_inmueble,
            self.detalle_inmueble,
            self.piso,
            self.numero_departamento,
            self.tiene_conserjeria,
            self.requiere_autorizacion,
            self.horario_disponible,
            self.condiciones_acceso,
            self.instrucciones_acceso,
            self.persona_contacto,
            self.telefono_contacto,
            self.estacionamiento_disponible,
            self.tiene_mascotas,
        ]

        tiene_contexto = any(
            campo is not None and (not isinstance(campo, str) or campo.strip())
            for campo in campos_contexto
        )

        if not tiene_contexto:
            return self

        if not self.tipo_inmueble or not self.tipo_inmueble.strip():
            raise ValueError("tipo_inmueble es obligatorio al informar contexto del inmueble")

        tiene_condiciones = bool(self.condiciones_acceso and self.condiciones_acceso.strip())
        tiene_instrucciones = bool(
            self.instrucciones_acceso and self.instrucciones_acceso.strip()
        )

        if not tiene_condiciones and not tiene_instrucciones:
            raise ValueError(
                "Debe informar condiciones_acceso o instrucciones_acceso al informar contexto del inmueble"
            )

        return self


class SolicitudUpdate(BaseModel):
    tecnico_usuario_rut: Optional[str] = None
    titulo_solicitud: Optional[str] = None
    descripcion_problema: Optional[str] = None
    urgencia: Optional[str] = None
    direccion: Optional[str] = None
    estado_trabajo: Optional[str] = None
    solicitud_activa: Optional[bool] = None
    fecha_asignacion: Optional[datetime] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin_estimada: Optional[datetime] = None
    costo_final: Optional[Decimal] = None
    tipo_problema: Optional[str] = None
    foto_problema: Optional[str] = None
    ubicacion_problema_referencia: Optional[str] = None
    fecha_real: Optional[datetime] = None
    tipo_inmueble: Optional[str] = None
    detalle_inmueble: Optional[str] = None
    piso: Optional[str] = None
    numero_departamento: Optional[str] = None
    tiene_conserjeria: Optional[bool] = None
    requiere_autorizacion: Optional[bool] = None
    horario_disponible: Optional[str] = None
    condiciones_acceso: Optional[str] = None
    instrucciones_acceso: Optional[str] = None
    persona_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    estacionamiento_disponible: Optional[bool] = None
    tiene_mascotas: Optional[bool] = None
    disponibilidad_horaria: Optional[List[SolicitudDisponibilidadCreate]] = None

    @model_validator(mode="after")
    def validar_disponibilidad_horaria(self):
        if self.disponibilidad_horaria is None:
            return self

        dias = [item.dia for item in self.disponibilidad_horaria]

        if len(dias) != len(set(dias)):
            raise ValueError("No se puede repetir el mismo dia en disponibilidad_horaria")

        return self


class SolicitudResponse(BaseModel):
    id_solicitud: int
    usuario_rut: str
    servicio_id_servicio: int
    tecnico_usuario_rut: Optional[str] = None
    comuna_id_comuna: int
    titulo_solicitud: str
    descripcion_problema: str
    urgencia: str
    direccion: str
    fecha_creacion: datetime
    solicitud_activa: bool
    estado_trabajo: str
    tipo_problema: str
    foto_problema: Optional[str] = None
    ubicacion_problema_referencia: str
    costo_final: Optional[Decimal] = None
    fecha_real: Optional[datetime] = None
    tipo_inmueble: Optional[str] = None
    detalle_inmueble: Optional[str] = None
    piso: Optional[str] = None
    numero_departamento: Optional[str] = None
    tiene_conserjeria: Optional[bool] = None
    requiere_autorizacion: Optional[bool] = None
    horario_disponible: Optional[str] = None
    condiciones_acceso: Optional[str] = None
    instrucciones_acceso: Optional[str] = None
    persona_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    estacionamiento_disponible: Optional[bool] = None
    tiene_mascotas: Optional[bool] = None
    disponibilidad_horaria: List[SolicitudDisponibilidadResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
