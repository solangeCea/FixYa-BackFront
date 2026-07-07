from datetime import datetime

from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.tecnico import Tecnico
from app.models.tecnico_servicio import TecnicoServicio
from app.models.tecnico_comuna import TecnicoComuna
from app.schemas.tecnico_schema import TecnicoCreate, TecnicoUpdate
from app.models.servicio import Servicio
from app.models.comuna import Comuna
from app.models.usuario import Usuario
from app.models.documento_tecnico import DocumentoTecnico
from app.models.cotizacion import Cotizacion
from app.models.solicitud import Solicitud
from app.models.usuario_rol import UsuarioRol

def crear_tecnico(db: Session, tecnico_data: TecnicoCreate):
    tecnico_existente = db.query(Tecnico).filter(
        Tecnico.usuario_rut == tecnico_data.usuario_rut
    ).first()

    if tecnico_existente:
        return None
    
    usuario_existente = db.query(Usuario).filter(
        Usuario.rut == tecnico_data.usuario_rut
    ).first()

    if not usuario_existente:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    if usuario_existente.tipo_usuario != "TECNICO":
        raise HTTPException(
            status_code=403,
            detail="Solo usuarios con rol TECNICO pueden crear perfil técnico"
        )
    
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
        tecnico_verificado=False,
        estado_verificacion="PENDIENTE",
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

    if "tecnico_verificado" in datos:
        tecnico.estado_verificacion = "APROBADO" if tecnico.tecnico_verificado else "PENDIENTE"
        tecnico.fecha_revision = datetime.utcnow()

    db.commit()
    db.refresh(tecnico)

    return tecnico


def eliminar_tecnico(db: Session, rut: str):
    """Elimina el perfil técnico y sus asociaciones. Preserva las solicitudes
    (desvinculándolas) y la cuenta de usuario; solo se quita el rol TECNICO.

    Es necesario limpiar las dependencias porque la tabla `tecnico` es
    referenciada por varias FK sin ON DELETE CASCADE (servicios, comunas,
    documentos, cotizaciones y solicitudes)."""
    tecnico = obtener_tecnico(db, rut)

    if not tecnico:
        return None

    # Desvincular solicitudes para conservar el historial y sus reseñas.
    db.query(Solicitud).filter(
        Solicitud.tecnico_usuario_rut == rut
    ).update({Solicitud.tecnico_usuario_rut: None}, synchronize_session=False)

    # Borrar datos propios del técnico que bloquearían el DELETE por FK.
    db.query(Cotizacion).filter(
        Cotizacion.tecnico_usuario_rut == rut
    ).delete(synchronize_session=False)

    db.query(DocumentoTecnico).filter(
        DocumentoTecnico.tecnico_usuario_rut == rut
    ).delete(synchronize_session=False)

    db.query(TecnicoServicio).filter(
        TecnicoServicio.tecnico_usuario_rut == rut
    ).delete(synchronize_session=False)

    db.query(TecnicoComuna).filter(
        TecnicoComuna.tecnico_usuario_rut == rut
    ).delete(synchronize_session=False)

    # Quitar el rol TECNICO (la cuenta de usuario permanece).
    db.query(UsuarioRol).filter(
        UsuarioRol.usuario_rut == rut,
        UsuarioRol.rol == "TECNICO",
    ).delete(synchronize_session=False)

    # reporte_solicitud y tecnico_solicitud_descartada caen por ON DELETE CASCADE.
    db.delete(tecnico)
    db.commit()

    return tecnico
