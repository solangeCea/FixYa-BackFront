from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.tecnico import Tecnico
from app.models.servicio import Servicio
from app.models.tecnico_servicio import TecnicoServicio

from app.schemas.tecnico_servicio_schema import (
    TecnicoServicioCreate
)


def asignar_servicio_tecnico(
    db: Session,
    data: TecnicoServicioCreate
):

    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == data.tecnico_usuario_rut
    ).first()

    if not tecnico:
        raise HTTPException(
            status_code=404,
            detail="Técnico no encontrado"
        )

    servicio = db.query(Servicio).filter(
        Servicio.id_servicio == data.servicio_id_servicio
    ).first()

    if not servicio:
        raise HTTPException(
            status_code=404,
            detail="Servicio no encontrado"
        )

    existe = db.query(TecnicoServicio).filter(
        TecnicoServicio.tecnico_usuario_rut == data.tecnico_usuario_rut,
        TecnicoServicio.servicio_id_servicio == data.servicio_id_servicio
    ).first()

    if existe:
        raise HTTPException(
            status_code=400,
            detail="El técnico ya tiene asignado este servicio"
        )

    nuevo = TecnicoServicio(
        tecnico_usuario_rut=data.tecnico_usuario_rut,
        servicio_id_servicio=data.servicio_id_servicio
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


def listar_servicios_tecnico(
    db: Session,
    rut: str
):
    return db.query(TecnicoServicio).filter(
        TecnicoServicio.tecnico_usuario_rut == rut
    ).all()