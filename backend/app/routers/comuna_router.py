from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services import comuna_service
from app.schemas.comuna_schema import ComunaResponse


router = APIRouter(
    prefix="/comunas",
    tags=["Comunas"]
)


@router.get("/", response_model=List[ComunaResponse])
def listar_comunas(db: Session = Depends(get_db)):
    return comuna_service.listar_comunas(db)


@router.get("/region/{id_region}", response_model=List[ComunaResponse])
def listar_comunas_por_region(
    id_region: int,
    db: Session = Depends(get_db)
):
    return comuna_service.listar_comunas_por_region(db, id_region)