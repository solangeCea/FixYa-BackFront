from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services import servicio_service
from app.schemas.servicio_schema import (
    ServicioCreate,
    ServicioResponse
)

from app.dependencies import solo_admin

router = APIRouter(
    prefix="/servicios",
    tags=["Servicios"]
)


# CREAR SERVICIO - SOLO ADMIN
@router.post("/", response_model=ServicioResponse)
def crear_servicio(
    servicio: ServicioCreate,
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db)
):
    return servicio_service.crear_servicio(db, servicio)


# LISTAR SERVICIOS
@router.get("/", response_model=List[ServicioResponse])
def listar_servicios(db: Session = Depends(get_db)):
    return servicio_service.listar_servicios(db)