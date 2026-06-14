from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import solo_admin
from app.models.cotizacion import Cotizacion
from app.models.resena import Resena
from app.models.solicitud import Solicitud
from app.models.tecnico import Tecnico
from app.models.usuario import Usuario
from app.schemas.admin_schema import AdminDashboardResponse
from app.schemas.tecnico_schema import TecnicoVerificacionDecision
from app.services import admin_service
from app.services.documento_tecnico_service import obtener_resumen_evidencias


router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)


def obtener_admin_rut(
    db: Session,
    current_user: dict,
    usuario_rut: Optional[str] = None
):
    if usuario_rut:
        admin = db.query(Usuario).filter(
            Usuario.rut == usuario_rut,
            Usuario.tipo_usuario == "ADMIN"
        ).first()
    else:
        admin = db.query(Usuario).filter(
            Usuario.correo == current_user["correo"],
            Usuario.tipo_usuario == "ADMIN"
        ).first()

    if not admin:
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede revisar técnicos."
        )

    return admin.rut


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
    data: Optional[TecnicoVerificacionDecision] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin)
):
    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == rut
    ).first()

    if not tecnico:
        raise HTTPException(
            status_code=404,
            detail="No encontramos este perfil técnico."
        )

    resumen_evidencias = obtener_resumen_evidencias(db, rut)
    observacion = (data.observacion if data else None) or ""

    if resumen_evidencias["total"] == 0:
        tecnico.tecnico_verificado = False
        tecnico.estado_verificacion = "DOCUMENTOS_PENDIENTES"
        tecnico.observacion_verificacion = (
            "Para aprobar este técnico, primero debe subir al menos una evidencia."
        )
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Para aprobar este técnico, primero debe subir al menos una evidencia."
        )

    if resumen_evidencias["aprobadas"] == 0 and resumen_evidencias["revisadas"] == 0:
        tecnico.tecnico_verificado = False
        tecnico.estado_verificacion = "EN_REVISION"
        tecnico.observacion_verificacion = (
            "Para aprobar este técnico, primero debes revisar al menos una evidencia."
        )
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Para aprobar este técnico, primero debes revisar al menos una evidencia."
        )

    if resumen_evidencias["aprobadas"] == 0 and not observacion.strip():
        tecnico.tecnico_verificado = False
        tecnico.estado_verificacion = "OBSERVADO"
        tecnico.observacion_verificacion = (
            "Necesitamos una justificación administrativa para aprobar este perfil."
        )
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Registra una justificación si aprobarás el perfil sin evidencia aprobada."
        )

    admin_rut = obtener_admin_rut(db, current_user)

    tecnico.tecnico_verificado = True
    tecnico.estado_verificacion = "APROBADO"
    tecnico.observacion_verificacion = (
        observacion.strip()
        or "Perfil verificado con evidencia revisada por administración."
    )
    tecnico.fecha_verificacion = datetime.utcnow()
    tecnico.verificado_por_rut = admin_rut

    db.commit()
    db.refresh(tecnico)

    return {
        "mensaje": "Técnico verificado correctamente.",
        "usuario_rut": tecnico.usuario_rut,
        "tecnico_verificado": tecnico.tecnico_verificado,
        "estado_verificacion": tecnico.estado_verificacion,
        "observacion_verificacion": tecnico.observacion_verificacion
    }


@router.put("/tecnicos/{rut}/rechazar")
def rechazar_tecnico(
    rut: str,
    data: TecnicoVerificacionDecision,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin)
):
    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == rut
    ).first()

    if not tecnico:
        raise HTTPException(
            status_code=404,
            detail="No encontramos este perfil técnico."
        )

    if not data.observacion or not data.observacion.strip():
        raise HTTPException(
            status_code=400,
            detail="Escribe una observación para que el técnico sepa qué corregir."
        )

    admin_rut = obtener_admin_rut(db, current_user)

    tecnico.tecnico_verificado = False
    tecnico.estado_verificacion = "RECHAZADO"
    tecnico.observacion_verificacion = data.observacion.strip()
    tecnico.fecha_verificacion = datetime.utcnow()
    tecnico.verificado_por_rut = admin_rut

    db.commit()
    db.refresh(tecnico)

    return {
        "mensaje": "Técnico rechazado con observación registrada.",
        "usuario_rut": tecnico.usuario_rut,
        "tecnico_verificado": tecnico.tecnico_verificado,
        "estado_verificacion": tecnico.estado_verificacion,
        "observacion_verificacion": tecnico.observacion_verificacion
    }
