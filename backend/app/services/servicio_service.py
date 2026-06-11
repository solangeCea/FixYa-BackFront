from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.servicio import Servicio
from app.schemas.servicio_schema import ServicioCreate


def crear_servicio(db: Session, servicio: ServicioCreate):

    existe = db.query(Servicio).filter(
        Servicio.nombre_servicio == servicio.nombre_servicio
    ).first()

    if existe:
        raise HTTPException(
            status_code=400,
            detail="El servicio ya existe"
        )

    nuevo_servicio = Servicio(
        nombre_servicio=servicio.nombre_servicio,
        descripcion_servicio=servicio.descripcion_servicio,
        estado_servicio=True
    )

    db.add(nuevo_servicio)
    db.commit()
    db.refresh(nuevo_servicio)

    return nuevo_servicio


def listar_servicios(db: Session):
    return db.query(Servicio).filter(
        Servicio.estado_servicio == True
    ).all()