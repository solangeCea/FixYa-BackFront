from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services import region_service
from app.schemas.region_schema import RegionResponse


router = APIRouter(
    prefix="/regiones",
    tags=["Regiones"]
)


@router.get("/", response_model=List[RegionResponse])
def listar_regiones(db: Session = Depends(get_db)):
    return region_service.listar_regiones(db)