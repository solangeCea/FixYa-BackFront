from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_usuario, solo_admin
from app.schemas.cotizacion_schema import (
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
    if usuario.tipo_usuario.value != "TECNICO":
        from fastapi import HTTPException

        raise HTTPException(
            status_code=403,
            detail="Solo tecnicos pueden crear cotizaciones"
        )

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


@router.get("/{id_cotizacion}", response_model=CotizacionResponse)
def obtener_cotizacion(
    id_cotizacion: int,
    db: Session = Depends(get_db),
):
    cotizacion = cotizacion_service.obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Cotizacion no encontrada")

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
    if usuario.tipo_usuario.value != "CLIENTE":
        from fastapi import HTTPException

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
    if usuario.tipo_usuario.value != "CLIENTE":
        from fastapi import HTTPException

        raise HTTPException(
            status_code=403,
            detail="Solo clientes pueden rechazar cotizaciones"
        )

    return cotizacion_service.rechazar_cotizacion(db, id_cotizacion, usuario.rut)


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
