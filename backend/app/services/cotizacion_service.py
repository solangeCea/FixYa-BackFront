from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.cotizacion import Cotizacion
from app.models.historial_solicitud import HistorialSolicitud
from app.models.notificacion import Notificacion
from app.models.reporte_solicitud import ReporteSolicitud
from app.models.solicitud import Solicitud
from app.models.tecnico import Tecnico
from app.models.tecnico_comuna import TecnicoComuna
from app.models.tecnico_servicio import TecnicoServicio
from app.models.tecnico_solicitud_descartada import TecnicoSolicitudDescartada
from app.pdf.cotizacion_pdf import generar_pdf_cotizacion
from app.schemas.cotizacion_schema import CotizacionCreate, CotizacionUpdate
from app.services.solicitud_service import solicitud_permite_cotizaciones


def _validar_tecnico_para_solicitud(
    db: Session,
    solicitud: Solicitud,
    tecnico_rut: str
):
    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == tecnico_rut
    ).first()

    if not tecnico:
        raise HTTPException(status_code=404, detail="Tecnico no encontrado")

    if not tecnico.tecnico_verificado:
        raise HTTPException(
            status_code=403,
            detail="Tu perfil tecnico debe estar verificado para cotizar"
        )

    presta_servicio = db.query(TecnicoServicio).filter(
        TecnicoServicio.tecnico_usuario_rut == tecnico_rut,
        TecnicoServicio.servicio_id_servicio == solicitud.servicio_id_servicio,
    ).first()

    if not presta_servicio:
        raise HTTPException(
            status_code=403,
            detail="No puedes cotizar solicitudes de servicios que no prestas"
        )

    cubre_comuna = db.query(TecnicoComuna).filter(
        TecnicoComuna.tecnico_usuario_rut == tecnico_rut,
        TecnicoComuna.comuna_id_comuna == solicitud.comuna_id_comuna,
        TecnicoComuna.estado_cobertura == True,
    ).first()

    if not cubre_comuna:
        raise HTTPException(
            status_code=403,
            detail="No tienes cobertura activa en la comuna de esta solicitud"
        )


def crear_cotizacion(
    db: Session,
    data: CotizacionCreate,
    tecnico_rut: str
):
    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == data.solicitud_id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud.usuario_rut == tecnico_rut:
        raise HTTPException(
            status_code=403,
            detail="El tecnico no puede cotizar su propia solicitud"
        )

    if not solicitud_permite_cotizaciones(solicitud):
        raise HTTPException(
            status_code=409,
            detail="La solicitud ya no permite recibir cotizaciones"
        )

    _validar_tecnico_para_solicitud(db, solicitud, tecnico_rut)

    solicitud_descartada = db.query(TecnicoSolicitudDescartada).filter(
        TecnicoSolicitudDescartada.solicitud_id_solicitud
        == data.solicitud_id_solicitud,
        TecnicoSolicitudDescartada.tecnico_usuario_rut == tecnico_rut,
    ).first()

    if solicitud_descartada:
        raise HTTPException(
            status_code=409,
            detail="No puedes cotizar una solicitud que descartaste"
        )

    solicitud_reportada = db.query(ReporteSolicitud).filter(
        ReporteSolicitud.solicitud_id_solicitud == data.solicitud_id_solicitud,
        ReporteSolicitud.tecnico_usuario_rut == tecnico_rut,
    ).first()

    if solicitud_reportada:
        raise HTTPException(
            status_code=409,
            detail="No puedes cotizar una solicitud que reportaste"
        )

    cotizacion_existente = db.query(Cotizacion).filter(
        Cotizacion.solicitud_id_solicitud == data.solicitud_id_solicitud,
        Cotizacion.tecnico_usuario_rut == tecnico_rut,
    ).first()

    if cotizacion_existente:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una cotizacion para esta solicitud y tecnico"
        )

    nueva = Cotizacion(
        solicitud_id_solicitud=data.solicitud_id_solicitud,
        tecnico_usuario_rut=tecnico_rut,
        monto_estimado=data.monto_estimado,
        mensaje_cotizacion=data.mensaje_cotizacion,
        fecha_vigencia=data.fecha_vigencia,
        estado_cotizacion="ENVIADA",
    )

    try:
        db.add(nueva)
        db.flush()

        nueva.archivo_pdf_url = generar_pdf_cotizacion(nueva, solicitud)
        db.add(
            Notificacion(
                usuario_rut=solicitud.usuario_rut,
                titulo="Nueva cotizacion recibida",
                mensaje=(
                    f"Recibiste una cotizacion para: "
                    f"{solicitud.titulo_solicitud}"
                ),
                tipo="COTIZACION",
            )
        )
        db.add(
            HistorialSolicitud(
                solicitud_id_solicitud=solicitud.id_solicitud,
                usuario_rut=tecnico_rut,
                estado="COTIZACION_ENVIADA",
                motivo="Tecnico envio una cotizacion",
            )
        )
        db.commit()
        db.refresh(nueva)
    except Exception:
        db.rollback()
        raise

    return nueva


def listar_cotizaciones(db: Session):
    return db.query(Cotizacion).all()


def obtener_cotizacion(db: Session, id_cotizacion: int):
    return db.query(Cotizacion).filter(
        Cotizacion.id_cotizacion == id_cotizacion
    ).first()


def listar_por_solicitud(db: Session, id_solicitud: int):
    return db.query(Cotizacion).filter(
        Cotizacion.solicitud_id_solicitud == id_solicitud
    ).all()


def listar_por_solicitud_autorizado(db: Session, id_solicitud: int, usuario):
    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    tipo_usuario = usuario.tipo_usuario.value

    if tipo_usuario == "CLIENTE" and solicitud.usuario_rut != usuario.rut:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para ver cotizaciones de esta solicitud"
        )

    if tipo_usuario == "TECNICO":
        return db.query(Cotizacion).filter(
            Cotizacion.solicitud_id_solicitud == id_solicitud,
            Cotizacion.tecnico_usuario_rut == usuario.rut,
        ).all()

    return listar_por_solicitud(db, id_solicitud)


def actualizar_cotizacion(
    db: Session,
    id_cotizacion: int,
    data: CotizacionUpdate
):
    cotizacion = obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        return None

    datos = data.model_dump(exclude_unset=True)

    for campo, valor in datos.items():
        setattr(cotizacion, campo, valor)

    db.commit()
    db.refresh(cotizacion)
    return cotizacion


def aceptar_cotizacion(db: Session, id_cotizacion: int, cliente_rut: str):
    cotizacion = obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotizacion no encontrada")

    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == cotizacion.solicitud_id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud.usuario_rut != cliente_rut:
        raise HTTPException(
            status_code=403,
            detail="Solo el cliente dueno de la solicitud puede aceptar cotizaciones"
        )

    if not solicitud_permite_cotizaciones(solicitud):
        raise HTTPException(
            status_code=409,
            detail="La solicitud ya no permite aceptar cotizaciones"
        )

    if cotizacion.estado_cotizacion != "ENVIADA":
        raise HTTPException(
            status_code=409,
            detail="Esta cotizacion ya no puede aceptarse"
        )

    cotizacion_aceptada = db.query(Cotizacion).filter(
        Cotizacion.solicitud_id_solicitud == cotizacion.solicitud_id_solicitud,
        Cotizacion.estado_cotizacion == "ACEPTADA",
    ).first()

    if cotizacion_aceptada:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una cotizacion aceptada para esta solicitud"
        )

    try:
        cotizacion.estado_cotizacion = "ACEPTADA"
        cotizacion.fecha_aceptacion = datetime.utcnow()

        otras_cotizaciones = db.query(Cotizacion).filter(
            Cotizacion.solicitud_id_solicitud
            == cotizacion.solicitud_id_solicitud,
            Cotizacion.id_cotizacion != cotizacion.id_cotizacion,
            Cotizacion.estado_cotizacion == "ENVIADA",
        ).all()

        solicitud.tecnico_usuario_rut = cotizacion.tecnico_usuario_rut
        solicitud.estado_trabajo = "ASIGNADO"
        solicitud.fecha_asignacion = datetime.utcnow()

        for item in otras_cotizaciones:
            item.estado_cotizacion = "RECHAZADA"
            item.motivo_anulacion = (
                "Cerrada por aceptacion de otra cotizacion"
            )

        db.add(
            HistorialSolicitud(
                solicitud_id_solicitud=solicitud.id_solicitud,
                usuario_rut=cliente_rut,
                estado="ASIGNADO",
                motivo=f"Cotizacion aceptada: {cotizacion.id_cotizacion}",
            )
        )
        db.add(
            Notificacion(
                usuario_rut=cotizacion.tecnico_usuario_rut,
                titulo="Cotizacion aceptada",
                mensaje=(
                    f"Tu cotizacion fue aceptada para: "
                    f"{solicitud.titulo_solicitud}"
                ),
                tipo="COTIZACION_ACEPTADA",
            )
        )
        db.add(
            Notificacion(
                usuario_rut=cliente_rut,
                titulo="Tecnico asignado",
                mensaje=(
                    "Asignamos al tecnico de la cotizacion "
                    f"#{cotizacion.id_cotizacion}"
                ),
                tipo="SOLICITUD_ASIGNADA",
            )
        )
        db.commit()
        db.refresh(cotizacion)
    except Exception:
        db.rollback()
        raise

    return cotizacion


def rechazar_cotizacion(db: Session, id_cotizacion: int, cliente_rut: str):
    cotizacion = obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotizacion no encontrada")

    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == cotizacion.solicitud_id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud.usuario_rut != cliente_rut:
        raise HTTPException(
            status_code=403,
            detail="Solo el cliente dueno de la solicitud puede rechazar cotizaciones"
        )

    if cotizacion.estado_cotizacion != "ENVIADA":
        raise HTTPException(
            status_code=409,
            detail="Esta cotizacion ya no puede rechazarse"
        )

    cotizacion.estado_cotizacion = "RECHAZADA"
    cotizacion.motivo_anulacion = "Rechazada por el cliente"

    db.commit()
    db.refresh(cotizacion)
    return cotizacion


def anular_cotizacion(db: Session, id_cotizacion: int, motivo: str):
    cotizacion = obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        return None

    cotizacion.estado_cotizacion = "ANULADA"
    cotizacion.motivo_anulacion = motivo

    db.commit()
    db.refresh(cotizacion)
    return cotizacion
