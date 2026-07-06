from typing import Optional

from pydantic import BaseModel


class AdminDashboardResponse(BaseModel):
    total_usuarios: int
    total_tecnicos: int
    total_clientes: int
    total_admins: int
    tecnicos_verificados: int
    tecnicos_pendientes: int
    total_solicitudes: int
    solicitudes_iniciadas: int
    solicitudes_asignadas: int
    solicitudes_en_proceso: int
    solicitudes_activas: int
    solicitudes_finalizadas: int
    solicitudes_canceladas: int
    total_resenas: int
    resenas_activas: int
    resenas_reportadas: int
    total_cotizaciones: int
    reportes_solicitudes_pendientes: int
    promedio_general_calificaciones: float


# --- Analítica de la plataforma -------------------------------------------

class AnaliticaIndicadores(BaseModel):
    total_usuarios: int
    total_clientes: int
    total_tecnicos: int
    total_solicitudes: int
    solicitudes_pendientes: int
    solicitudes_asignadas: int
    solicitudes_en_proceso: int
    solicitudes_finalizadas: int
    solicitudes_canceladas: int
    tecnicos_pendientes: int
    tecnicos_activos: int
    reportes_pendientes: int


class ConteoNombre(BaseModel):
    nombre: str
    total: int


class ConteoEstado(BaseModel):
    estado: str
    label: str
    total: int


class UsuariosPorMes(BaseModel):
    periodo: str
    label: str
    clientes: int
    tecnicos: int
    total: int


class DistribucionEtaria(BaseModel):
    rango: str
    total: int


class AnaliticaInsights(BaseModel):
    oficio_mas_solicitado: Optional[str] = None
    comuna_mayor_demanda: Optional[str] = None
    comuna_menor_cobertura: Optional[str] = None
    porcentaje_completadas: float
    promedio_solicitudes_mes: float
    crecimiento_usuarios_pct: float
    tendencia: str


class AdminAnaliticaResponse(BaseModel):
    indicadores: AnaliticaIndicadores
    solicitudes_por_oficio: list[ConteoNombre]
    solicitudes_por_comuna: list[ConteoNombre]
    usuarios_por_mes: list[UsuariosPorMes]
    solicitudes_por_estado: list[ConteoEstado]
    tecnicos_por_oficio: list[ConteoNombre]
    clientes_por_comuna: list[ConteoNombre]
    tecnicos_por_comuna: list[ConteoNombre]
    problemas_frecuentes: list[ConteoNombre]
    distribucion_etaria: list[DistribucionEtaria]
    edad_promedio_clientes: float
    insights: AnaliticaInsights
