from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import solo_tecnico
from app.schemas.cotizacion_schema import CotizacionCreate, CotizacionUpdate, CotizacionResponse
from app.services import cotizacion_service

router = APIRouter(
    prefix="/cotizaciones",
    tags=["Cotizaciones"]
)

@router.post("/", response_model=CotizacionResponse)
def crear_cotizacion(
    cotizacion: CotizacionCreate,
    db: Session = Depends(get_db),
    usuario=Depends(solo_tecnico)
):
    try:
        return cotizacion_service.crear_cotizacion(db, cotizacion)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/", response_model=List[CotizacionResponse])
def listar_cotizaciones(db: Session = Depends(get_db)):
    return cotizacion_service.listar_cotizaciones(db)

@router.get("/{id_cotizacion}", response_model=CotizacionResponse)
def obtener_cotizacion(id_cotizacion: int, db: Session = Depends(get_db)):
    cotizacion = cotizacion_service.obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    return cotizacion

@router.get("/solicitud/{id_solicitud}", response_model=List[CotizacionResponse])
def listar_por_solicitud(id_solicitud: int, db: Session = Depends(get_db)):
    return cotizacion_service.listar_por_solicitud(db, id_solicitud)

@router.put("/{id_cotizacion}", response_model=CotizacionResponse)
def actualizar_cotizacion(id_cotizacion: int, cotizacion: CotizacionUpdate, db: Session = Depends(get_db)):
    cotizacion_actualizada = cotizacion_service.actualizar_cotizacion(db, id_cotizacion, cotizacion)

    if not cotizacion_actualizada:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    return cotizacion_actualizada

@router.put("/{id_cotizacion}/aceptar", response_model=CotizacionResponse)
def aceptar_cotizacion(id_cotizacion: int, db: Session = Depends(get_db)):
    cotizacion = cotizacion_service.aceptar_cotizacion(db, id_cotizacion)

    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    return cotizacion

@router.put("/{id_cotizacion}/anular", response_model=CotizacionResponse)
def anular_cotizacion(id_cotizacion: int, motivo: str, db: Session = Depends(get_db)):
    cotizacion = cotizacion_service.anular_cotizacion(db, id_cotizacion, motivo)

    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    return cotizacion
