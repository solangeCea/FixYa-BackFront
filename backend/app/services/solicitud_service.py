from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.solicitud import Solicitud, SolicitudDisponibilidad
from app.schemas.solicitud_schema import SolicitudCreate, SolicitudUpdate
from app.schemas.reporte_solicitud_schema import ReporteSolicitudCreate, ReporteSolicitudResolver
from app.models.historial_solicitud import HistorialSolicitud
from datetime import datetime
from fastapi import HTTPException
from app.models.servicio import Servicio
from app.models.comuna import Comuna
from app.models.usuario import Usuario
from app.models.tecnico import Tecnico
from app.models.tecnico_comuna import TecnicoComuna
from app.models.tecnico_servicio import TecnicoServicio
from app.models.tecnico_solicitud_descartada import TecnicoSolicitudDescartada
from app.models.reporte_solicitud import ReporteSolicitud
from app.models.cotizacion import Cotizacion


ESTADOS_SOLICITUD_VALIDOS = {
    "INICIADO",
    "ASIGNADO",
    "EN_PROCESO",
    "FINALIZADO",
    "CANCELADO",
}
ESTADOS_SOLICITUD_COTIZABLE = {"INICIADO"}
ESTADOS_SOLICITUD_TERMINALES = {"FINALIZADO", "CANCELADO"}

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
        tipo_inmueble=data.tipo_inmueble,
        detalle_inmueble=data.detalle_inmueble,
        piso=data.piso,
        numero_departamento=data.numero_departamento,
        tiene_conserjeria=data.tiene_conserjeria,
        requiere_autorizacion=data.requiere_autorizacion,
        horario_disponible=data.horario_disponible,
        condiciones_acceso=data.condiciones_acceso,
        instrucciones_acceso=data.instrucciones_acceso,
        persona_contacto=data.persona_contacto,
        telefono_contacto=data.telefono_contacto,
        estacionamiento_disponible=data.estacionamiento_disponible,
        tiene_mascotas=data.tiene_mascotas,
        estado_trabajo="INICIADO",
        solicitud_activa=True
    )

    db.add(nueva)
    db.flush()

    for disponibilidad in data.disponibilidad_horaria or []:
        db.add(
            SolicitudDisponibilidad(
                solicitud_id_solicitud=nueva.id_solicitud,
                dia=disponibilidad.dia,
                hora_inicio=disponibilidad.hora_inicio,
                hora_fin=disponibilidad.hora_fin,
            )
        )

    db.commit()
    db.refresh(nueva)
    return nueva

def listar_solicitudes(db: Session):
    return db.query(Solicitud).all()


def _obtener_tecnico_verificado(db: Session, rut: str):
    tecnico = db.query(Tecnico).filter(Tecnico.usuario_rut == rut).first()

    if not tecnico:
        raise HTTPException(status_code=404, detail="Tecnico no encontrado")

    if tecnico.estado_verificacion != "APROBADO" or not tecnico.tecnico_verificado:
        raise HTTPException(
            status_code=403,
            detail="Tu perfil tecnico debe estar aprobado para realizar esta accion"
        )

    return tecnico


def solicitud_permite_cotizaciones(solicitud: Solicitud):
    return (
        solicitud.solicitud_activa
        and solicitud.tecnico_usuario_rut is None
        and solicitud.estado_trabajo in ESTADOS_SOLICITUD_COTIZABLE
    )


def listar_solicitudes_disponibles_tecnico(db: Session, tecnico_rut: str):
    _obtener_tecnico_verificado(db, tecnico_rut)

    return db.query(Solicitud).join(
        TecnicoServicio,
        Solicitud.servicio_id_servicio == TecnicoServicio.servicio_id_servicio
    ).join(
        TecnicoComuna,
        Solicitud.comuna_id_comuna == TecnicoComuna.comuna_id_comuna
    ).outerjoin(
        TecnicoSolicitudDescartada,
        and_(
            TecnicoSolicitudDescartada.solicitud_id_solicitud == Solicitud.id_solicitud,
            TecnicoSolicitudDescartada.tecnico_usuario_rut == tecnico_rut,
        )
    ).outerjoin(
        ReporteSolicitud,
        and_(
            ReporteSolicitud.solicitud_id_solicitud == Solicitud.id_solicitud,
            ReporteSolicitud.tecnico_usuario_rut == tecnico_rut,
        )
    ).outerjoin(
        Cotizacion,
        and_(
            Cotizacion.solicitud_id_solicitud == Solicitud.id_solicitud,
            Cotizacion.tecnico_usuario_rut == tecnico_rut,
        )
    ).filter(
        TecnicoServicio.tecnico_usuario_rut == tecnico_rut,
        TecnicoComuna.tecnico_usuario_rut == tecnico_rut,
        TecnicoComuna.estado_cobertura == True,
        Solicitud.solicitud_activa == True,
        Solicitud.tecnico_usuario_rut.is_(None),
        Solicitud.estado_trabajo.in_(ESTADOS_SOLICITUD_COTIZABLE),
        TecnicoSolicitudDescartada.id_descarte.is_(None),
        ReporteSolicitud.id_reporte.is_(None),
        Cotizacion.id_cotizacion.is_(None),
    ).order_by(Solicitud.fecha_creacion.desc()).all()


def descartar_solicitud_tecnico(db: Session, id_solicitud: int, tecnico_rut: str):
    _obtener_tecnico_verificado(db, tecnico_rut)

    solicitud = obtener_solicitud(db, id_solicitud)

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    existente = db.query(TecnicoSolicitudDescartada).filter(
        TecnicoSolicitudDescartada.solicitud_id_solicitud == id_solicitud,
        TecnicoSolicitudDescartada.tecnico_usuario_rut == tecnico_rut,
    ).first()

    if existente:
        raise HTTPException(status_code=409, detail="Ya descartaste esta solicitud")

    descarte = TecnicoSolicitudDescartada(
        solicitud_id_solicitud=id_solicitud,
        tecnico_usuario_rut=tecnico_rut,
    )

    db.add(descarte)
    db.add(
        HistorialSolicitud(
            solicitud_id_solicitud=id_solicitud,
            usuario_rut=tecnico_rut,
            estado="DESCARTADA_TECNICO",
            motivo="Solicitud descartada por el tecnico",
        )
    )
    db.commit()
    db.refresh(descarte)

    return descarte


def reportar_solicitud_tecnico(
    db: Session,
    id_solicitud: int,
    tecnico_rut: str,
    data: ReporteSolicitudCreate
):
    _obtener_tecnico_verificado(db, tecnico_rut)

    solicitud = obtener_solicitud(db, id_solicitud)

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    existente = db.query(ReporteSolicitud).filter(
        ReporteSolicitud.solicitud_id_solicitud == id_solicitud,
        ReporteSolicitud.tecnico_usuario_rut == tecnico_rut,
    ).first()

    if existente:
        raise HTTPException(status_code=409, detail="Ya reportaste esta solicitud")

    comentario = data.comentario
    if data.motivo == "OTRO_MOTIVO":
        comentario = data.descripcion_otro
        if data.comentario:
            comentario = f"{data.descripcion_otro}\n\nComentario adicional: {data.comentario}"

    reporte = ReporteSolicitud(
        solicitud_id_solicitud=id_solicitud,
        tecnico_usuario_rut=tecnico_rut,
        motivo=data.motivo,
        comentario=comentario,
        estado_reporte="PENDIENTE",
    )

    db.add(reporte)
    db.add(
        HistorialSolicitud(
            solicitud_id_solicitud=id_solicitud,
            usuario_rut=tecnico_rut,
            estado="REPORTE_PENDIENTE",
            motivo=f"Solicitud reportada por tecnico: {data.motivo}",
        )
    )
    db.commit()
    db.refresh(reporte)

    return reporte


def listar_reportes_solicitud(db: Session):
    rows = db.query(ReporteSolicitud, Solicitud).join(
        Solicitud,
        Solicitud.id_solicitud == ReporteSolicitud.solicitud_id_solicitud
    ).order_by(ReporteSolicitud.fecha_reporte.desc()).all()

    return [
        {
            "id_reporte": reporte.id_reporte,
            "solicitud_id_solicitud": reporte.solicitud_id_solicitud,
            "tecnico_usuario_rut": reporte.tecnico_usuario_rut,
            "motivo": reporte.motivo,
            "comentario": reporte.comentario,
            "estado_reporte": reporte.estado_reporte,
            "fecha_reporte": reporte.fecha_reporte,
            "fecha_revision": reporte.fecha_revision,
            "admin_rut_resuelve": reporte.admin_rut_resuelve,
            "observacion_admin": reporte.observacion_admin,
            "solicitud_titulo": solicitud.titulo_solicitud,
            "solicitud_estado": solicitud.estado_trabajo,
            "solicitud_activa": solicitud.solicitud_activa,
            "cliente_usuario_rut": solicitud.usuario_rut,
        }
        for reporte, solicitud in rows
    ]


def resolver_reporte_solicitud(
    db: Session,
    id_reporte: int,
    admin_rut: str,
    data: ReporteSolicitudResolver
):
    reporte = db.query(ReporteSolicitud).filter(
        ReporteSolicitud.id_reporte == id_reporte
    ).first()

    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    solicitud = obtener_solicitud(db, reporte.solicitud_id_solicitud)

    reporte.estado_reporte = data.estado_reporte
    reporte.fecha_revision = datetime.utcnow()
    reporte.admin_rut_resuelve = admin_rut
    reporte.observacion_admin = data.observacion_admin

    if solicitud and data.solicitud_activa is not None:
        solicitud.solicitud_activa = data.solicitud_activa
        db.add(
            HistorialSolicitud(
                solicitud_id_solicitud=solicitud.id_solicitud,
                usuario_rut=admin_rut,
                estado="MODERACION_SOLICITUD",
                motivo=(
                    data.observacion_admin
                    or f"Reporte resuelto como {data.estado_reporte}"
                ),
            )
        )

    db.commit()
    db.refresh(reporte)
    return reporte

def obtener_solicitud(db: Session, id_solicitud: int):
    return db.query(Solicitud).filter(Solicitud.id_solicitud == id_solicitud).first()

def actualizar_solicitud(db: Session, id_solicitud: int, data: SolicitudUpdate):
    solicitud = obtener_solicitud(db, id_solicitud)

    if not solicitud:
        return None

    datos = data.model_dump(exclude_unset=True)
    disponibilidad_horaria = datos.pop("disponibilidad_horaria", None)

    for campo, valor in datos.items():
        setattr(solicitud, campo, valor)

    if disponibilidad_horaria is not None:
        db.query(SolicitudDisponibilidad).filter(
            SolicitudDisponibilidad.solicitud_id_solicitud == id_solicitud
        ).delete()

        for disponibilidad in disponibilidad_horaria:
            db.add(
                SolicitudDisponibilidad(
                    solicitud_id_solicitud=id_solicitud,
                    dia=disponibilidad["dia"],
                    hora_inicio=disponibilidad["hora_inicio"],
                    hora_fin=disponibilidad["hora_fin"],
                )
            )

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

    if data.estado_trabajo not in ESTADOS_SOLICITUD_VALIDOS:
        return "ESTADO_INVALIDO"

    solicitud.estado_trabajo = data.estado_trabajo

    if data.estado_trabajo == "EN_PROCESO":
        solicitud.fecha_inicio = datetime.utcnow()

    if data.estado_trabajo == "FINALIZADO":
        solicitud.fecha_real = datetime.utcnow()

    if data.estado_trabajo in ESTADOS_SOLICITUD_TERMINALES:
        solicitud.solicitud_activa = False

    historial = HistorialSolicitud(
        motivo=data.motivo,
        estado=data.estado_trabajo,
        solicitud_id_solicitud=id_solicitud,
        usuario_rut=data.usuario_rut or solicitud.usuario_rut
    )

    db.add(historial)
    db.commit()
    db.refresh(solicitud)

    return solicitud
