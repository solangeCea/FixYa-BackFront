from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_usuario, solo_admin, usuario_tiene_rol
from app.models.solicitud import Solicitud
from app.schemas.historial_solicitud_schema import (
    HistorialCreate,
    HistorialResponse,
    TimelineEventoResponse,
)
from app.services import historial_solicitud_service

router = APIRouter(
    prefix="/historial-solicitudes",
    tags=["Historial Solicitudes"]
)


def _autorizar_ver_solicitud(db: Session, usuario_actual, id_solicitud: int):
    """Solo el cliente dueño, el técnico asignado o un admin pueden ver el
    historial/línea de tiempo de una solicitud."""
    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    es_admin = usuario_tiene_rol(db, usuario_actual.rut, "ADMIN")
    es_dueno = solicitud.usuario_rut == usuario_actual.rut
    es_tecnico_asignado = solicitud.tecnico_usuario_rut == usuario_actual.rut

    if not (es_admin or es_dueno or es_tecnico_asignado):
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para ver el historial de esta solicitud",
        )

    return solicitud


@router.post("/", response_model=HistorialResponse)
def crear_historial(
    historial: HistorialCreate,
    db: Session = Depends(get_db),
    usuario_actual=Depends(solo_admin),
):
    return historial_solicitud_service.crear_historial(db, historial)

@router.get("/", response_model=List[HistorialResponse])
def listar_historial(
    db: Session = Depends(get_db),
    usuario_actual=Depends(solo_admin),
):
    return historial_solicitud_service.listar_historial(db)

@router.get("/solicitud/{id_solicitud}", response_model=List[HistorialResponse])
def listar_por_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    _autorizar_ver_solicitud(db, usuario_actual, id_solicitud)
    return historial_solicitud_service.listar_por_solicitud(db, id_solicitud)


@router.get(
    "/solicitud/{id_solicitud}/timeline",
    response_model=List[TimelineEventoResponse],
)
def obtener_timeline_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    """Línea de tiempo enriquecida (cronológica, con actor) de una solicitud."""
    _autorizar_ver_solicitud(db, usuario_actual, id_solicitud)
    return historial_solicitud_service.listar_timeline_por_solicitud(
        db, id_solicitud
    )
