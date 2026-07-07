from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.chat import Chat, MensajeChat
from app.models.cotizacion import Cotizacion
from app.models.notificacion import Notificacion
from app.models.solicitud import Solicitud
from app.models.usuario import Usuario


def crear_chat_para_cotizacion(db: Session, cotizacion, solicitud) -> Chat:
    """Crea (o devuelve si ya existe) el chat privado entre el cliente y el
    técnico de una solicitud. Hay un único chat por solicitud, que se conserva
    aunque cambie la cotización (p. ej. por un cambio de alcance). Idempotente;
    no hace commit por sí solo."""
    # Un solo chat por solicitud: si ya existe (de la cotización original), se reutiliza.
    existente = db.query(Chat).filter(
        Chat.solicitud_id_solicitud == solicitud.id_solicitud
    ).first()
    if existente:
        return existente

    chat = Chat(
        cotizacion_id_cotizacion=cotizacion.id_cotizacion,
        solicitud_id_solicitud=solicitud.id_solicitud,
        cliente_rut=solicitud.usuario_rut,
        tecnico_rut=cotizacion.tecnico_usuario_rut,
        activo=True,
    )
    db.add(chat)
    db.flush()
    return chat


def agregar_mensaje_sistema(db: Session, solicitud_id: int, contenido: str):
    """Inserta un mensaje automático de la plataforma en el chat de la solicitud
    (si existe). No hace commit: lo confirma el flujo que lo invoca."""
    chat = db.query(Chat).filter(
        Chat.solicitud_id_solicitud == solicitud_id
    ).first()
    if not chat:
        return None

    mensaje = MensajeChat(
        chat_id_chat=chat.id_chat,
        emisor_rut=chat.tecnico_rut,
        contenido=contenido[:1000],
        es_sistema=True,
        leido=False,
    )
    db.add(mensaje)
    return mensaje


def _chat_de_participante(db: Session, id_chat: int, usuario_rut: str) -> Chat:
    """Devuelve el chat solo si el usuario es el cliente o el técnico del mismo."""
    chat = db.query(Chat).filter(Chat.id_chat == id_chat).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat no encontrado")

    if usuario_rut not in (chat.cliente_rut, chat.tecnico_rut):
        raise HTTPException(
            status_code=403,
            detail="No participas en este chat"
        )
    return chat


def obtener_chat_por_solicitud(db: Session, solicitud_id: int, usuario_rut: str) -> Chat:
    """Chat de una solicitud (existe solo si hubo una cotización aceptada).
    Solo lo ve el cliente o el técnico involucrados."""
    chat = db.query(Chat).filter(
        Chat.solicitud_id_solicitud == solicitud_id
    ).first()

    # Si no existe pero hay una cotización ACEPTADA, se crea al vuelo. Esto cubre
    # las cotizaciones aceptadas antes de que existiera el chat.
    if not chat:
        cotizacion = db.query(Cotizacion).filter(
            Cotizacion.solicitud_id_solicitud == solicitud_id,
            Cotizacion.estado_cotizacion == "ACEPTADA",
        ).first()

        if not cotizacion:
            raise HTTPException(
                status_code=404,
                detail="Aun no hay un chat para esta solicitud"
            )

        solicitud = db.query(Solicitud).filter(
            Solicitud.id_solicitud == solicitud_id
        ).first()
        chat = crear_chat_para_cotizacion(db, cotizacion, solicitud)
        db.commit()
        db.refresh(chat)

    if usuario_rut not in (chat.cliente_rut, chat.tecnico_rut):
        raise HTTPException(
            status_code=403,
            detail="No participas en este chat"
        )
    return chat


def listar_mensajes(db: Session, id_chat: int, usuario_rut: str):
    chat = _chat_de_participante(db, id_chat, usuario_rut)

    mensajes = db.query(MensajeChat).filter(
        MensajeChat.chat_id_chat == chat.id_chat
    ).order_by(MensajeChat.fecha_envio.asc(), MensajeChat.id_mensaje.asc()).all()

    # Marca como leídos los mensajes recibidos (no enviados por el usuario).
    pendientes = [
        m for m in mensajes if m.emisor_rut != usuario_rut and not m.leido
    ]
    if pendientes:
        for m in pendientes:
            m.leido = True
        db.commit()

    return mensajes


def enviar_mensaje(db: Session, id_chat: int, emisor_rut: str, contenido: str) -> MensajeChat:
    chat = _chat_de_participante(db, id_chat, emisor_rut)

    if not chat.activo:
        raise HTTPException(status_code=409, detail="Este chat esta cerrado")

    mensaje = MensajeChat(
        chat_id_chat=chat.id_chat,
        emisor_rut=emisor_rut,
        contenido=contenido,
        leido=False,
    )
    db.add(mensaje)

    # Notifica al otro participante.
    destinatario = (
        chat.tecnico_rut if emisor_rut == chat.cliente_rut else chat.cliente_rut
    )
    emisor = db.query(Usuario).filter(Usuario.rut == emisor_rut).first()
    nombre_emisor = emisor.nombre_completo if emisor else emisor_rut
    db.add(
        Notificacion(
            usuario_rut=destinatario,
            titulo="Nuevo mensaje",
            mensaje=f"{nombre_emisor}: {contenido[:80]}",
            tipo="CHAT",
        )
    )

    db.commit()
    db.refresh(mensaje)
    return mensaje


def contar_no_leidos(db: Session, id_chat: int, usuario_rut: str) -> int:
    # Los mensajes de sistema no cuentan como "no leídos" (no son de la contraparte).
    return db.query(MensajeChat).filter(
        MensajeChat.chat_id_chat == id_chat,
        MensajeChat.emisor_rut != usuario_rut,
        MensajeChat.es_sistema == False,  # noqa: E712
        MensajeChat.leido == False,  # noqa: E712
    ).count()
