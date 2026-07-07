from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import admin_service
from app.schemas.admin_schema import AdminDashboardResponse, AdminAnaliticaResponse
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


@router.get("/analitica", response_model=AdminAnaliticaResponse)
def obtener_analitica_admin(
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin)
):
    return admin_service.obtener_analitica_admin(db)


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
