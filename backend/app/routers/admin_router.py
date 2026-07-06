from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import admin_service
from app.schemas.admin_schema import AdminDashboardResponse
from app.dependencies import solo_admin

from app.models.usuario import Usuario
from app.models.tecnico import Tecnico
from app.models.solicitud import Solicitud
from app.models.resena import Resena
from app.models.cotizacion import Cotizacion
from app.models.reporte_solicitud import ReporteSolicitud


router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)


class TecnicoRevisionRequest(BaseModel):
    estado_verificacion: Literal[
        "EN_REVISION",
        "OBSERVADO",
        "APROBADO",
        "RECHAZADO",
        "SUSPENDIDO",
    ]
    observacion_admin: str | None = None


def _actualizar_revision_tecnico(
    tecnico: Tecnico,
    admin_rut: str | None,
    estado_verificacion: str,
    observacion_admin: str | None = None,
):
    tecnico.estado_verificacion = estado_verificacion
    tecnico.tecnico_verificado = estado_verificacion == "APROBADO"
    tecnico.fecha_revision = datetime.utcnow()
    tecnico.admin_revisor_rut = admin_rut
    tecnico.observacion_admin = observacion_admin


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
        Tecnico.tecnico_verificado == True,
        Tecnico.estado_verificacion == "APROBADO",
    ).count()

    total_solicitudes = db.query(Solicitud).count()
    solicitudes_activas = db.query(Solicitud).filter(
        Solicitud.solicitud_activa == True,
        Solicitud.estado_trabajo.notin_(["FINALIZADO", "CANCELADO"])
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
    reportes_solicitudes_pendientes = db.query(ReporteSolicitud).filter(
        ReporteSolicitud.estado_reporte.in_(["PENDIENTE", "EN_REVISION"])
    ).count()

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
        "reportes_solicitudes": {
            "pendientes": reportes_solicitudes_pendientes
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

    _actualizar_revision_tecnico(
        tecnico,
        current_user.get("rut"),
        "APROBADO",
        "Tecnico aprobado por administrador",
    )

    db.commit()
    db.refresh(tecnico)

    return {
        "mensaje": "Técnico verificado correctamente",
        "usuario_rut": tecnico.usuario_rut,
        "tecnico_verificado": tecnico.tecnico_verificado,
        "estado_verificacion": tecnico.estado_verificacion,
        "fecha_revision": tecnico.fecha_revision,
        "admin_revisor_rut": tecnico.admin_revisor_rut,
    }


@router.put("/tecnicos/{rut}/revision")
def revisar_tecnico(
    rut: str,
    data: TecnicoRevisionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin),
):
    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == rut
    ).first()

    if not tecnico:
        raise HTTPException(
            status_code=404,
            detail="Tecnico no encontrado"
        )

    _actualizar_revision_tecnico(
        tecnico,
        current_user.get("rut"),
        data.estado_verificacion,
        data.observacion_admin,
    )

    db.commit()
    db.refresh(tecnico)

    return {
        "mensaje": "Revision tecnica actualizada correctamente",
        "usuario_rut": tecnico.usuario_rut,
        "tecnico_verificado": tecnico.tecnico_verificado,
        "estado_verificacion": tecnico.estado_verificacion,
        "fecha_revision": tecnico.fecha_revision,
        "admin_revisor_rut": tecnico.admin_revisor_rut,
        "observacion_admin": tecnico.observacion_admin,
    }
