from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.usuario import Usuario
from app.models.tecnico import Tecnico
from app.models.solicitud import Solicitud
from app.models.resena import Resena


def obtener_dashboard_admin(db: Session):
    total_usuarios = db.query(Usuario).count()

    total_tecnicos = db.query(Tecnico).count()

    total_clientes = db.query(Usuario).filter(
        Usuario.tipo_usuario == "CLIENTE"
    ).count()

    total_admins = db.query(Usuario).filter(
        Usuario.tipo_usuario == "ADMIN"
    ).count()

    tecnicos_verificados = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == True
    ).count()

    tecnicos_pendientes = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == False
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

    total_resenas = db.query(Resena).count()

    resenas_reportadas = db.query(Resena).filter(
        Resena.resena_reportada == "S"
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
        "solicitudes_finalizadas": solicitudes_finalizadas,
        "solicitudes_canceladas": solicitudes_canceladas,
        "total_resenas": total_resenas,
        "resenas_reportadas": resenas_reportadas,
        "promedio_general_calificaciones": round(promedio or 0, 2)
    }