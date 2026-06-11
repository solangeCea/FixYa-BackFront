from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.tecnico import Tecnico
from app.models.tecnico_servicio import TecnicoServicio
from app.models.tecnico_comuna import TecnicoComuna
from app.schemas.tecnico_schema import TecnicoCreate, TecnicoUpdate
from app.models.servicio import Servicio
from app.models.comuna import Comuna

def crear_tecnico(db: Session, tecnico_data: TecnicoCreate):
    tecnico_existente = db.query(Tecnico).filter(
        Tecnico.usuario_rut == tecnico_data.usuario_rut
    ).first()

    if tecnico_existente:
        return None
    
    for servicio_id in tecnico_data.servicios:
        servicio_existente = db.query(Servicio).filter(
            Servicio.id_servicio == servicio_id
        ).first()

        if not servicio_existente:
                raise HTTPException(
                    status_code=404,
                    detail=f"Servicio no encontrado: {servicio_id}"
                )
    
    for comuna_id in tecnico_data.comunas:
        comuna_existente = db.query(Comuna).filter(
            Comuna.id_comuna == comuna_id
        ).first()

        if not comuna_existente:
            raise HTTPException(
                status_code=404,
                detail=f"Comuna no encontrada: {comuna_id}"
            )

    nuevo_tecnico = Tecnico(
        usuario_rut=tecnico_data.usuario_rut,
        descripcion_perfil=tecnico_data.descripcion_perfil,
        experiencia_anios=tecnico_data.experiencia_anios,
        nivel_tecnico=tecnico_data.nivel_tecnico,
        tecnico_verificado=False
    )

    db.add(nuevo_tecnico)
    db.commit()
    db.refresh(nuevo_tecnico)

    for servicio_id in tecnico_data.servicios:
        db.add(TecnicoServicio(
            tecnico_usuario_rut=tecnico_data.usuario_rut,
            servicio_id_servicio=servicio_id
        ))

    for comuna_id in tecnico_data.comunas:
        comuna_existente = db.query(Comuna).filter(
            Comuna.id_comuna == comuna_id
        ).first()

        if not comuna_existente:
            raise HTTPException(
                status_code=404,
                detail=f"Comuna no encontrada: {comuna_id}"
            )

        db.add(TecnicoComuna(
            tecnico_usuario_rut=tecnico_data.usuario_rut,
            comuna_id_comuna=comuna_id
        ))
    db.commit()

    return nuevo_tecnico


def listar_tecnicos(db: Session):
    return db.query(Tecnico).all()


def obtener_tecnico(db: Session, rut: str):
    return db.query(Tecnico).filter(Tecnico.usuario_rut == rut).first()


def actualizar_tecnico(db: Session, rut: str, tecnico_data: TecnicoUpdate):
    tecnico = obtener_tecnico(db, rut)

    if not tecnico:
        return None

    datos = tecnico_data.model_dump(exclude_unset=True)

    for campo, valor in datos.items():
        setattr(tecnico, campo, valor)

    db.commit()
    db.refresh(tecnico)

    return tecnico


def eliminar_tecnico(db: Session, rut: str):
    tecnico = obtener_tecnico(db, rut)

    if not tecnico:
        return None

    db.delete(tecnico)
    db.commit()

    return tecnico