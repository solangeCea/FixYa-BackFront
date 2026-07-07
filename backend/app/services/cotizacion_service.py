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
from app.schemas.cotizacion_schema import (
    CambioAlcanceCreate,
    CotizacionCreate,
    CotizacionUpdate,
)
from app.services.chat_service import (
    agregar_mensaje_sistema,
    crear_chat_para_cotizacion,
)
from app.dependencies import usuario_tiene_rol
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

    if tecnico.estado_verificacion != "APROBADO" or not tecnico.tecnico_verificado:
        raise HTTPException(
            status_code=403,
            detail="Tu perfil tecnico debe estar aprobado para cotizar"
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
        materiales_incluidos=bool(data.materiales_incluidos),
        mensaje_cotizacion=data.mensaje_cotizacion,
        fecha_vigencia=data.fecha_vigencia,
        estado_cotizacion="ENVIADA",
    )

    try:
        db.add(nueva)
        db.flush()

        nueva.archivo_pdf_url = generar_pdf_cotizacion(db, nueva, solicitud)
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


def obtener_solicitud_de_cotizacion(db: Session, cotizacion):
    return db.query(Solicitud).filter(
        Solicitud.id_solicitud == cotizacion.solicitud_id_solicitud
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

    es_admin = usuario_tiene_rol(db, usuario.rut, "ADMIN")
    es_cliente = usuario_tiene_rol(db, usuario.rut, "CLIENTE")
    es_tecnico = usuario_tiene_rol(db, usuario.rut, "TECNICO")

    if es_admin:
        return listar_por_solicitud(db, id_solicitud)

    if es_cliente and solicitud.usuario_rut == usuario.rut:
        return listar_por_solicitud(db, id_solicitud)

    if es_tecnico:
        return db.query(Cotizacion).filter(
            Cotizacion.solicitud_id_solicitud == id_solicitud,
            Cotizacion.tecnico_usuario_rut == usuario.rut,
        ).all()

    if es_cliente:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para ver cotizaciones de esta solicitud"
        )

    raise HTTPException(
        status_code=403,
        detail="No tienes permisos para ver cotizaciones de esta solicitud"
    )


def listar_cotizaciones_tecnico(db: Session, tecnico_rut: str):
    return db.query(Cotizacion).filter(
        Cotizacion.tecnico_usuario_rut == tecnico_rut
    ).order_by(Cotizacion.id_cotizacion.desc()).all()


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

    # Las cotizaciones de cambio de alcance las emite el mismo técnico ya asignado,
    # por lo que la solicitud no está "cotizable" (INICIADO); se permiten cuando la
    # solicitud está en CAMBIO_ALCANCE. El resto exige que la solicitud sea cotizable.
    es_cambio_alcance = cotizacion.cotizacion_origen_id is not None
    if es_cambio_alcance:
        if solicitud.estado_trabajo != "CAMBIO_ALCANCE":
            raise HTTPException(
                status_code=409,
                detail="Esta cotizacion de cambio de alcance ya no puede aceptarse"
            )
    elif not solicitud_permite_cotizaciones(solicitud):
        raise HTTPException(
            status_code=409,
            detail="La solicitud ya no permite aceptar cotizaciones"
        )

    if cotizacion.estado_cotizacion != "ENVIADA":
        raise HTTPException(
            status_code=409,
            detail="Esta cotizacion ya no puede aceptarse"
        )

    # Una cotizacion cuya vigencia ya paso no puede aceptarse: se marca EXPIRADA.
    if cotizacion.fecha_vigencia and datetime.utcnow() > cotizacion.fecha_vigencia:
        cotizacion.estado_cotizacion = "EXPIRADA"
        db.commit()
        raise HTTPException(
            status_code=409,
            detail="Esta cotizacion expiro y ya no puede aceptarse"
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

        # Regenera el PDF ya con estado ACEPTADA y la firma del cliente.
        cotizacion.archivo_pdf_url = generar_pdf_cotizacion(
            db, cotizacion, solicitud
        )

        # Habilita el chat privado cliente-tecnico (solo al aceptar). Es único por
        # solicitud, así que si venía de un cambio de alcance se reutiliza.
        crear_chat_para_cotizacion(db, cotizacion, solicitud)

        # Si es una cotización de cambio de alcance, deja constancia en el chat.
        if es_cambio_alcance:
            agregar_mensaje_sistema(
                db,
                solicitud.id_solicitud,
                "El cliente acepto la nueva cotizacion por cambio de alcance. "
                "El trabajo continua con las nuevas condiciones.",
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
    # Regenera el PDF para reflejar el estado Rechazada en el documento.
    cotizacion.archivo_pdf_url = generar_pdf_cotizacion(db, cotizacion, solicitud)

    # Si se rechaza una cotización de CAMBIO DE ALCANCE, el trabajo no puede
    # continuar (la original ya fue anulada): la solicitud queda CANCELADA.
    if cotizacion.cotizacion_origen_id is not None:
        solicitud.estado_trabajo = "CANCELADO"
        solicitud.solicitud_activa = False
        db.add(
            HistorialSolicitud(
                solicitud_id_solicitud=solicitud.id_solicitud,
                usuario_rut=cliente_rut,
                estado="CANCELADO",
                motivo="Nueva cotizacion por cambio de alcance rechazada",
            )
        )
        db.add(
            Notificacion(
                usuario_rut=cotizacion.tecnico_usuario_rut,
                titulo="Nueva cotizacion rechazada",
                mensaje=(
                    "El cliente rechazo la nueva cotizacion por cambio de alcance. "
                    "El trabajo quedo cancelado."
                ),
                tipo="CAMBIO_ALCANCE",
            )
        )
        agregar_mensaje_sistema(
            db,
            solicitud.id_solicitud,
            "El cliente rechazo la nueva cotizacion por cambio de alcance. "
            "El trabajo quedo cancelado.",
        )
    else:
        # Cotización normal rechazada: avisar al técnico (antes no se enteraba).
        db.add(
            Notificacion(
                usuario_rut=cotizacion.tecnico_usuario_rut,
                titulo="Cotizacion rechazada",
                mensaje=(
                    f"El cliente rechazo tu cotizacion para: "
                    f"{solicitud.titulo_solicitud}"
                ),
                tipo="COTIZACION_RECHAZADA",
            )
        )

    db.commit()
    db.refresh(cotizacion)
    return cotizacion


def solicitar_cambio_alcance(
    db: Session,
    id_cotizacion: int,
    tecnico_rut: str,
    data: CambioAlcanceCreate,
):
    """El técnico, ya en terreno, detecta que el trabajo es mucho mayor que lo
    cotizado. Anula la cotización aceptada (conservándola) y genera una nueva
    cotización vinculada para que el cliente la revise. Trazabilidad completa."""
    original = obtener_cotizacion(db, id_cotizacion)
    if not original:
        raise HTTPException(status_code=404, detail="Cotizacion no encontrada")

    if original.tecnico_usuario_rut != tecnico_rut:
        raise HTTPException(
            status_code=403,
            detail="Solo el tecnico de la cotizacion puede solicitar el cambio"
        )

    if original.estado_cotizacion != "ACEPTADA":
        raise HTTPException(
            status_code=409,
            detail="Solo puedes solicitar un cambio de alcance sobre una cotizacion aceptada"
        )

    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == original.solicitud_id_solicitud
    ).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud.estado_trabajo not in ("ASIGNADO", "EN_PROCESO"):
        raise HTTPException(
            status_code=409,
            detail="El trabajo no esta en una etapa que permita cambio de alcance"
        )

    motivo = (data.motivo or "").strip()
    if not motivo:
        raise HTTPException(status_code=400, detail="Debes indicar el motivo del cambio")

    try:
        # 1) Anula la cotización original (se conserva para trazabilidad).
        original.estado_cotizacion = "ANULADA_CAMBIO_ALCANCE"
        original.motivo_anulacion = motivo[:300]
        original.archivo_pdf_url = generar_pdf_cotizacion(db, original, solicitud)

        # 2) Nueva cotización vinculada, en estado ENVIADA.
        nueva = Cotizacion(
            solicitud_id_solicitud=solicitud.id_solicitud,
            tecnico_usuario_rut=tecnico_rut,
            monto_estimado=data.monto_estimado,
            materiales_incluidos=bool(data.materiales_incluidos),
            mensaje_cotizacion=data.mensaje_cotizacion,
            plazo_estimado=data.plazo_estimado,
            fecha_vigencia=data.fecha_vigencia,
            estado_cotizacion="ENVIADA",
            cotizacion_origen_id=original.id_cotizacion,
        )
        db.add(nueva)
        db.flush()
        nueva.archivo_pdf_url = generar_pdf_cotizacion(db, nueva, solicitud)

        # 3) La solicitud pasa a CAMBIO_ALCANCE (a la espera del cliente).
        solicitud.estado_trabajo = "CAMBIO_ALCANCE"

        db.add(
            HistorialSolicitud(
                solicitud_id_solicitud=solicitud.id_solicitud,
                usuario_rut=tecnico_rut,
                estado="CAMBIO_ALCANCE",
                motivo=f"Cambio de alcance: {motivo}",
            )
        )
        db.add(
            Notificacion(
                usuario_rut=solicitud.usuario_rut,
                titulo="Cambio de alcance del trabajo",
                mensaje=(
                    "El tecnico informo un cambio de alcance y envio una nueva "
                    f"cotizacion. Motivo: {motivo[:120]}"
                ),
                tipo="CAMBIO_ALCANCE",
            )
        )
        # 4) Aviso automatico dentro del chat (se conserva la conversacion).
        agregar_mensaje_sistema(
            db,
            solicitud.id_solicitud,
            "El tecnico ha informado que el alcance del trabajo cambio y ha "
            "generado una nueva cotizacion para su revision.",
        )

        db.commit()
        db.refresh(nueva)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    return nueva


def anular_cotizacion(db: Session, id_cotizacion: int, motivo: str):
    cotizacion = obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        return None

    cotizacion.estado_cotizacion = "ANULADA"
    cotizacion.motivo_anulacion = motivo

    db.commit()
    db.refresh(cotizacion)
    return cotizacion
