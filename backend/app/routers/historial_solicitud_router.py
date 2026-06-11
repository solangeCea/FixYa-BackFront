from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.historial_solicitud_schema import HistorialCreate, HistorialResponse
from app.services import historial_solicitud_service

router = APIRouter(
    prefix="/historial-solicitudes",
    tags=["Historial Solicitudes"]
)

@router.post("/", response_model=HistorialResponse)
def crear_historial(historial: HistorialCreate, db: Session = Depends(get_db)):
    return historial_solicitud_service.crear_historial(db, historial)

@router.get("/", response_model=List[HistorialResponse])
def listar_historial(db: Session = Depends(get_db)):
    return historial_solicitud_service.listar_historial(db)

@router.get("/solicitud/{id_solicitud}", response_model=List[HistorialResponse])
def listar_por_solicitud(id_solicitud: int, db: Session = Depends(get_db)):
    return historial_solicitud_service.listar_por_solicitud(db, id_solicitud)