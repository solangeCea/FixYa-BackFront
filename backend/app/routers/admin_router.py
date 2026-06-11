from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.services import admin_service
from app.schemas.admin_schema import AdminDashboardResponse
from app.dependencies import solo_admin

from app.models.usuario import Usuario
from app.models.tecnico import Tecnico
from app.models.solicitud import Solicitud
from app.models.resena import Resena
from app.models.cotizacion import Cotizacion


router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)


@router.get("/dashboard", response_model=AdminDashboardResponse)
def obtener_dashboard_admin(
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin)
):
    return admin_service.obtener_dashboard_admin(db)


@router.get("/estadisticas")
def obtener_estadisticas_admin(
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin)
):
    total_usuarios = db.query(Usuario).count()

    total_tecnicos = db.query(Tecnico).count()
    tecnicos_verificados = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == True
    ).count()

    total_solicitudes = db.query(Solicitud).count()
    solicitudes_activas = db.query(Solicitud).filter(
        Solicitud.solicitud_activa == True
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

    promedio_calificaciones = db.query(
        func.avg(Resena.calificacion)
    ).filter(
        Resena.resena_activa == "S"
    ).scalar()

    total_cotizaciones = db.query(Cotizacion).count()

    ingresos_estimados = db.query(
        func.sum(Solicitud.costo_final)
    ).filter(
        Solicitud.estado_trabajo == "FINALIZADO"
    ).scalar()

    return {
        "usuarios": {
            "total": total_usuarios
        },
        "tecnicos": {
            "total": total_tecnicos,
            "verificados": tecnicos_verificados,
            "pendientes": total_tecnicos - tecnicos_verificados
        },
        "solicitudes": {
            "total": total_solicitudes,
            "activas": solicitudes_activas,
            "finalizadas": solicitudes_finalizadas,
            "canceladas": solicitudes_canceladas
        },
        "resenas": {
            "total": total_resenas,
            "reportadas": resenas_reportadas,
            "promedio_calificaciones": round(float(promedio_calificaciones), 1) if promedio_calificaciones else 0
        },
        "cotizaciones": {
            "total": total_cotizaciones
        },
        "ingresos": {
            "total_finalizado": float(ingresos_estimados) if ingresos_estimados else 0
        }
    }


@router.put("/tecnicos/{rut}/verificar")
def verificar_tecnico(
    rut: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin)
):
    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == rut
    ).first()

    if not tecnico:
        raise HTTPException(
            status_code=404,
            detail="Técnico no encontrado"
        )

    tecnico.tecnico_verificado = True

    db.commit()
    db.refresh(tecnico)

    return {
        "mensaje": "Técnico verificado correctamente",
        "usuario_rut": tecnico.usuario_rut,
        "tecnico_verificado": tecnico.tecnico_verificado
    }