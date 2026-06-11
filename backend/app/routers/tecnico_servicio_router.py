from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services import tecnico_servicio_service
from app.schemas.tecnico_servicio_schema import (
    TecnicoServicioCreate,
    TecnicoServicioResponse
)
from app.dependencies import solo_tecnico


router = APIRouter(
    prefix="/tecnico-servicios",
    tags=["Técnico Servicios"]
)


@router.post("/", response_model=TecnicoServicioResponse)
def asignar_servicio_tecnico(
    data: TecnicoServicioCreate,
    current_user: dict = Depends(solo_tecnico),
    db: Session = Depends(get_db)
):
    return tecnico_servicio_service.asignar_servicio_tecnico(db, data)


@router.get("/tecnico/{rut}", response_model=List[TecnicoServicioResponse])
def listar_servicios_tecnico(
    rut: str,
    db: Session = Depends(get_db)
):
    return tecnico_servicio_service.listar_servicios_tecnico(db, rut)