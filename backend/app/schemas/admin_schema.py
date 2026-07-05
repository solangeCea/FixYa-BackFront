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
