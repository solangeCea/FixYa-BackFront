from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import (
    get_current_usuario,
    require_approved_technician_usuario,
    solo_admin,
    usuario_tiene_rol,
)
from app.schemas.cotizacion_schema import (
    CambioAlcanceCreate,
    CotizacionCreate,
    CotizacionResponse,
    CotizacionUpdate,
)
from app.services import cotizacion_service


router = APIRouter(
    prefix="/cotizaciones",
    tags=["Cotizaciones"]
)


@router.post("/", response_model=CotizacionResponse)
def crear_cotizacion(
    cotizacion: CotizacionCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    require_approved_technician_usuario(db, usuario)

    return cotizacion_service.crear_cotizacion(db, cotizacion, usuario.rut)


@router.get("/", response_model=List[CotizacionResponse])
def listar_cotizaciones(
    db: Session = Depends(get_db),
    usuario=Depends(solo_admin),
):
    return cotizacion_service.listar_cotizaciones(db)


@router.get("/solicitud/{id_solicitud}", response_model=List[CotizacionResponse])
def listar_por_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    return cotizacion_service.listar_por_solicitud_autorizado(
        db,
        id_solicitud,
        usuario,
    )


@router.get("/mias", response_model=List[CotizacionResponse])
def listar_mis_cotizaciones(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    if not usuario_tiene_rol(db, usuario.rut, "TECNICO"):
        raise HTTPException(
            status_code=403,
            detail="Solo los técnicos tienen cotizaciones propias",
        )

    return cotizacion_service.listar_cotizaciones_tecnico(db, usuario.rut)


@router.get("/{id_cotizacion}", response_model=CotizacionResponse)
def obtener_cotizacion(
    id_cotizacion: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    cotizacion = cotizacion_service.obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotizacion no encontrada")

    # Solo el técnico dueño, el cliente de la solicitud o un admin pueden verla.
    solicitud = cotizacion_service.obtener_solicitud_de_cotizacion(db, cotizacion)
    es_admin = usuario_tiene_rol(db, usuario.rut, "ADMIN")
    es_dueno = usuario.rut in (
        cotizacion.tecnico_usuario_rut,
        solicitud.usuario_rut if solicitud else None,
    )
    if not es_admin and not es_dueno:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para ver esta cotizacion",
        )

    return cotizacion


@router.put("/{id_cotizacion}", response_model=CotizacionResponse)
def actualizar_cotizacion(
    id_cotizacion: int,
    cotizacion: CotizacionUpdate,
    db: Session = Depends(get_db),
    usuario=Depends(solo_admin),
):
    cotizacion_actualizada = cotizacion_service.actualizar_cotizacion(
        db,
        id_cotizacion,
        cotizacion,
    )

    if not cotizacion_actualizada:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Cotizacion no encontrada")

    return cotizacion_actualizada


@router.put("/{id_cotizacion}/aceptar", response_model=CotizacionResponse)
def aceptar_cotizacion(
    id_cotizacion: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    if not usuario_tiene_rol(db, usuario.rut, "CLIENTE"):
        raise HTTPException(
            status_code=403,
            detail="Solo clientes pueden aceptar cotizaciones"
        )

    return cotizacion_service.aceptar_cotizacion(db, id_cotizacion, usuario.rut)


@router.put("/{id_cotizacion}/rechazar", response_model=CotizacionResponse)
def rechazar_cotizacion(
    id_cotizacion: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    if not usuario_tiene_rol(db, usuario.rut, "CLIENTE"):
        raise HTTPException(
            status_code=403,
            detail="Solo clientes pueden rechazar cotizaciones"
        )

    return cotizacion_service.rechazar_cotizacion(db, id_cotizacion, usuario.rut)


@router.post("/{id_cotizacion}/cambio-alcance", response_model=CotizacionResponse)
def solicitar_cambio_alcance(
    id_cotizacion: int,
    data: CambioAlcanceCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    if not usuario_tiene_rol(db, usuario.rut, "TECNICO"):
        raise HTTPException(
            status_code=403,
            detail="Solo el tecnico puede solicitar un cambio de alcance"
        )

    return cotizacion_service.solicitar_cambio_alcance(
        db, id_cotizacion, usuario.rut, data
    )


@router.put("/{id_cotizacion}/anular", response_model=CotizacionResponse)
def anular_cotizacion(
    id_cotizacion: int,
    motivo: str,
    db: Session = Depends(get_db),
    usuario=Depends(solo_admin),
):
    cotizacion = cotizacion_service.anular_cotizacion(db, id_cotizacion, motivo)

    if not cotizacion:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Cotizacion no encontrada")

    return cotizacion
