from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import admin_service
from app.services import audit_service
from app.schemas.admin_schema import AdminDashboardResponse, AdminAnaliticaResponse
from app.schemas.audit_log_schema import AuditLogResponse
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
    request: Request,
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

    estado_antes = tecnico.estado_verificacion

    _actualizar_revision_tecnico(
        tecnico,
        current_user.get("rut"),
        "APROBADO",
        "Tecnico aprobado por administrador",
    )

    db.commit()
    db.refresh(tecnico)

    audit_service.registrar_auditoria(
        db,
        admin_rut=current_user.get("rut"),
        accion="APROBAR_TECNICO",
        entidad_tipo="TECNICO",
        entidad_id=tecnico.usuario_rut,
        usuario_afectado_rut=tecnico.usuario_rut,
        motivo="Tecnico aprobado por administrador",
        estado_antes=estado_antes,
        estado_despues=tecnico.estado_verificacion,
        ip=audit_service.obtener_ip(request),
    )

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
    request: Request,
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

    estado_antes = tecnico.estado_verificacion

    _actualizar_revision_tecnico(
        tecnico,
        current_user.get("rut"),
        data.estado_verificacion,
        data.observacion_admin,
    )

    db.commit()
    db.refresh(tecnico)

    # La acción concreta depende del nuevo estado (aprobar / observar / suspender
    # / rechazar), lo que hace la bitácora más legible que un genérico "revisión".
    accion_por_estado = {
        "APROBADO": "APROBAR_TECNICO",
        "OBSERVADO": "OBSERVAR_TECNICO",
        "SUSPENDIDO": "SUSPENDER_TECNICO",
        "RECHAZADO": "RECHAZAR_TECNICO",
        "EN_REVISION": "REVISAR_TECNICO",
    }

    audit_service.registrar_auditoria(
        db,
        admin_rut=current_user.get("rut"),
        accion=accion_por_estado.get(data.estado_verificacion, "REVISAR_TECNICO"),
        entidad_tipo="TECNICO",
        entidad_id=tecnico.usuario_rut,
        usuario_afectado_rut=tecnico.usuario_rut,
        motivo=data.observacion_admin,
        estado_antes=estado_antes,
        estado_despues=tecnico.estado_verificacion,
        ip=audit_service.obtener_ip(request),
    )

    return {
        "mensaje": "Revision tecnica actualizada correctamente",
        "usuario_rut": tecnico.usuario_rut,
        "tecnico_verificado": tecnico.tecnico_verificado,
        "estado_verificacion": tecnico.estado_verificacion,
        "fecha_revision": tecnico.fecha_revision,
        "admin_revisor_rut": tecnico.admin_revisor_rut,
        "observacion_admin": tecnico.observacion_admin,
    }


@router.get("/auditoria", response_model=list[AuditLogResponse])
def listar_auditoria(
    accion: str | None = None,
    entidad_tipo: str | None = None,
    admin_rut: str | None = None,
    usuario_afectado_rut: str | None = None,
    limite: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin),
):
    """Bitácora de acciones administrativas, de la más reciente a la más antigua."""
    return audit_service.listar_auditoria(
        db,
        accion=accion,
        entidad_tipo=entidad_tipo,
        admin_rut=admin_rut,
        usuario_afectado_rut=usuario_afectado_rut,
        limite=limite,
        offset=offset,
    )
