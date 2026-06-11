from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.models.tecnico import Tecnico
from app.models.comuna import Comuna
from app.models.tecnico_comuna import TecnicoComuna

from app.schemas.tecnico_comuna_schema import (
    TecnicoComunaCreate
)


def asignar_comuna_tecnico(
    db: Session,
    data: TecnicoComunaCreate
):

    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == data.tecnico_usuario_rut
    ).first()

    if not tecnico:
        raise HTTPException(
            status_code=404,
            detail="Técnico no encontrado"
        )

    comuna = db.query(Comuna).filter(
        Comuna.id_comuna == data.comuna_id_comuna
    ).first()

    if not comuna:
        raise HTTPException(
            status_code=404,
            detail="Comuna no encontrada"
        )

    existe = db.query(TecnicoComuna).filter(
        TecnicoComuna.tecnico_usuario_rut == data.tecnico_usuario_rut,
        TecnicoComuna.comuna_id_comuna == data.comuna_id_comuna
    ).first()

    if existe:
        raise HTTPException(
            status_code=400,
            detail="El técnico ya tiene asignada esta comuna"
        )

    nueva = TecnicoComuna(
        tecnico_usuario_rut=data.tecnico_usuario_rut,
        comuna_id_comuna=data.comuna_id_comuna,
        estado_cobertura=True,
        fecha_registro=datetime.utcnow()
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return nueva


def listar_comunas_tecnico(
    db: Session,
    rut: str
):
    return db.query(TecnicoComuna).filter(
        TecnicoComuna.tecnico_usuario_rut == rut
    ).all()