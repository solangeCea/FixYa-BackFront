from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.usuario import Usuario
from app.models.usuario_rol import UsuarioRol
from app.models.tecnico import Tecnico
from app.models.solicitud import Solicitud
from app.models.resena import Resena
from app.models.cotizacion import Cotizacion
from app.models.reporte_solicitud import ReporteSolicitud


def obtener_dashboard_admin(db: Session):
    total_usuarios = db.query(Usuario).count()

    total_tecnicos = db.query(Tecnico).count()

    total_clientes = db.query(UsuarioRol.usuario_rut).filter(
        UsuarioRol.rol == "CLIENTE",
        UsuarioRol.activo == True,
    ).distinct().count()

    total_admins = db.query(UsuarioRol.usuario_rut).filter(
        UsuarioRol.rol == "ADMIN",
        UsuarioRol.activo == True,
    ).distinct().count()

    tecnicos_verificados = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == True,
        Tecnico.estado_verificacion == "APROBADO",
    ).count()

    tecnicos_pendientes = db.query(Tecnico).filter(
        Tecnico.estado_verificacion != "APROBADO"
    ).count()

    total_solicitudes = db.query(Solicitud).count()

    solicitudes_iniciadas = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "INICIADO"
    ).count()

    solicitudes_finalizadas = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "FINALIZADO"
    ).count()

    solicitudes_canceladas = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "CANCELADO"
    ).count()

    solicitudes_asignadas = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "ASIGNADO"
    ).count()

    solicitudes_en_proceso = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "EN_PROCESO"
    ).count()

    solicitudes_activas = db.query(Solicitud).filter(
        Solicitud.solicitud_activa == True,
        Solicitud.estado_trabajo != "FINALIZADO",
        Solicitud.estado_trabajo != "CANCELADO"
    ).count()

    total_resenas = db.query(Resena).count()

    resenas_activas = db.query(Resena).filter(
        Resena.resena_activa == "S"
    ).count()

    resenas_reportadas = db.query(Resena).filter(
        Resena.resena_reportada == "S"
    ).count()

    total_cotizaciones = db.query(Cotizacion).count()

    reportes_solicitudes_pendientes = db.query(ReporteSolicitud).filter(
        ReporteSolicitud.estado_reporte.in_(["PENDIENTE", "EN_REVISION"])
    ).count()

    promedio = db.query(
        func.avg(Resena.calificacion)
    ).scalar()

    return {
        "total_usuarios": total_usuarios,
        "total_tecnicos": total_tecnicos,
        "total_clientes": total_clientes,
        "total_admins": total_admins,
        "tecnicos_verificados": tecnicos_verificados,
        "tecnicos_pendientes": tecnicos_pendientes,
        "total_solicitudes": total_solicitudes,
        "solicitudes_iniciadas": solicitudes_iniciadas,
        "solicitudes_asignadas": solicitudes_asignadas,
        "solicitudes_en_proceso": solicitudes_en_proceso,
        "solicitudes_activas": solicitudes_activas,
        "solicitudes_finalizadas": solicitudes_finalizadas,
        "solicitudes_canceladas": solicitudes_canceladas,
        "total_resenas": total_resenas,
        "resenas_activas": resenas_activas,
        "resenas_reportadas": resenas_reportadas,
        "total_cotizaciones": total_cotizaciones,
        "reportes_solicitudes_pendientes": reportes_solicitudes_pendientes,
        "promedio_general_calificaciones": round(promedio or 0, 2)
    }
