from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.usuario import Usuario
from app.models.tecnico import Tecnico
from app.models.solicitud import Solicitud
from app.models.resena import Resena

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/admin")
def obtener_dashboard_admin(db: Session = Depends(get_db)):
    total_usuarios = db.query(Usuario).count()

    total_tecnicos = db.query(Tecnico).count()

    tecnicos_verificados = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == True
    ).count()

    tecnicos_pendientes = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == False
    ).count()

    solicitudes_activas = db.query(Solicitud).filter(
        Solicitud.estado_trabajo != "FINALIZADO"
    ).count()

    solicitudes_finalizadas = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "FINALIZADO"
    ).count()

    resenas_activas = db.query(Resena).filter(
        Resena.resena_activa == "S"
    ).count()

    resenas_reportadas = db.query(Resena).filter(
        Resena.resena_reportada == "S",
        Resena.reporte_resuelto != "S"
    ).count()

    promedio_calificaciones = db.query(
        func.avg(Resena.calificacion)
    ).scalar()

    return {
        "total_usuarios": total_usuarios,
        "total_tecnicos": total_tecnicos,
        "tecnicos_verificados": tecnicos_verificados,
        "tecnicos_pendientes": tecnicos_pendientes,
        "solicitudes_activas": solicitudes_activas,
        "solicitudes_finalizadas": solicitudes_finalizadas,
        "resenas_activas": resenas_activas,
        "resenas_reportadas": resenas_reportadas,
        "promedio_calificaciones": round(float(promedio_calificaciones or 0), 1),
    }