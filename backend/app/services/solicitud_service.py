from sqlalchemy.orm import Session
from app.models.solicitud import Solicitud
from app.schemas.solicitud_schema import SolicitudCreate, SolicitudUpdate
from app.models.historial_solicitud import HistorialSolicitud
from datetime import datetime
from fastapi import HTTPException
from app.models.servicio import Servicio
from app.models.comuna import Comuna
from app.models.usuario import Usuario

def crear_solicitud(db: Session, data: SolicitudCreate):
    ###validar servicio existente
    servicio_existente = db.query(Servicio).filter(
        Servicio.id_servicio == data.servicio_id_servicio
    ).first()

    if not servicio_existente:
        raise HTTPException(
            status_code=404,
            detail=f"Servicio no encontrado con id {data.servicio_id_servicio}"
        )
    if servicio_existente.estado_servicio is False:
        raise HTTPException(
            status_code=400,
            detail="El servicio se encuentra inactivo"
        )
    
    ###Validar comuna existente
    comuna_existente = db.query(Comuna).filter(
        Comuna.id_comuna == data.comuna_id_comuna
    ).first()
    

    if not comuna_existente:
        raise HTTPException(
            status_code=404,
            detail=f"Comuna no encontrada con id {data.comuna_id_comuna}"
        )
    
    ###Validar usuario existente
    usuario_existente = db.query(Usuario).filter(
        Usuario.rut == data.usuario_rut
    ).first()

    if not usuario_existente:
        raise HTTPException(
            status_code=404,
            detail=f"Usuario no encontrado con rut {data.usuario_rut}"
        )

    nueva = Solicitud(
        usuario_rut=data.usuario_rut,
        servicio_id_servicio=data.servicio_id_servicio,
        comuna_id_comuna=data.comuna_id_comuna,
        titulo_solicitud=data.titulo_solicitud,
        descripcion_problema=data.descripcion_problema,
        urgencia=data.urgencia,
        direccion=data.direccion,
        tipo_problema=data.tipo_problema,
        foto_problema=data.foto_problema,
        ubicacion_problema_referencia=data.ubicacion_problema_referencia,
        estado_trabajo="INICIADO",
        solicitud_activa=True
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

def listar_solicitudes(db: Session):
    return db.query(Solicitud).all()

def obtener_solicitud(db: Session, id_solicitud: int):
    return db.query(Solicitud).filter(Solicitud.id_solicitud == id_solicitud).first()

def actualizar_solicitud(db: Session, id_solicitud: int, data: SolicitudUpdate):
    solicitud = obtener_solicitud(db, id_solicitud)

    if not solicitud:
        return None

    datos = data.model_dump(exclude_unset=True)

    for campo, valor in datos.items():
        setattr(solicitud, campo, valor)

    db.commit()
    db.refresh(solicitud)
    return solicitud

def eliminar_solicitud(db: Session, id_solicitud: int):
    solicitud = obtener_solicitud(db, id_solicitud)

    if not solicitud:
        return None

    solicitud.solicitud_activa = False
    db.commit()
    db.refresh(solicitud)
    return solicitud

def cambiar_estado_solicitud(db: Session, id_solicitud: int, data):
    solicitud = obtener_solicitud(db, id_solicitud)

    if not solicitud:
        return None

    estados_validos = [
        "INICIADO",
        "ASIGNADO",
        "EN_EJECUCION",
        "FINALIZADO",
        "CANCELADO"
    ]

    if data.estado_trabajo not in estados_validos:
        return "ESTADO_INVALIDO"

    solicitud.estado_trabajo = data.estado_trabajo

    if data.estado_trabajo == "EN_EJECUCION":
        solicitud.fecha_inicio = datetime.now()

    if data.estado_trabajo == "FINALIZADO":
        solicitud.fecha_real = datetime.now()

    historial = HistorialSolicitud(
        motivo=data.motivo,
        estado=data.estado_trabajo,
        solicitud_id_solicitud=id_solicitud,
        usuario_rut=data.usuario_rut
    )

    db.add(historial)
    db.commit()
    db.refresh(solicitud)

    return solicitud