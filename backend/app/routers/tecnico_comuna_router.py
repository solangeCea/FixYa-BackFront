from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db

from app.services import tecnico_comuna_service

from app.schemas.tecnico_comuna_schema import (
    TecnicoComunaCreate,
    TecnicoComunaResponse
)

from app.dependencies import solo_tecnico

router = APIRouter(
    prefix="/tecnico-comunas",
    tags=["Técnico Comunas"]
)


# ASIGNAR COMUNA A TÉCNICO
@router.post("/", response_model=TecnicoComunaResponse)
def asignar_comuna_tecnico(
    data: TecnicoComunaCreate,
    current_user: dict = Depends(solo_tecnico),
    db: Session = Depends(get_db)
):
    return tecnico_comuna_service.asignar_comuna_tecnico(
        db,
        data
    )


# LISTAR COMUNAS DE UN TÉCNICO
@router.get(
    "/tecnico/{rut}",
    response_model=List[TecnicoComunaResponse]
)
def listar_comunas_tecnico(
    rut: str,
    db: Session = Depends(get_db)
):
    return tecnico_comuna_service.listar_comunas_tecnico(
        db,
        rut
    )