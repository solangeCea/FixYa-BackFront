"""Cancelación de solicitudes según su estado (Fase D).

- Antes de empezar el trabajo (INICIADO / ASIGNADO / CAMBIO_ALCANCE) la
  cancelación es **directa**.
- Con el trabajo EN_PROCESO se crea una **solicitud de cancelación** que deja la
  solicitud en `EN_REVISION_ADMIN` hasta que el administrador la apruebe
  (→ CANCELADO) o la rechace (→ se restaura el estado previo).
"""

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.solicitud import Solicitud
from app.models.cancelacion_solicitud import CancelacionSolicitud
from app.models.historial_solicitud import HistorialSolicitud
from app.models.notificacion import Notificacion
from app.models.cotizacion import Cotizacion
from app.models.usuario import Usuario
from app.services import audit_service

ESTADOS_CANCELACION_DIRECTA = {"INICIADO", "ASIGNADO", "CAMBIO_ALCANCE"}


def _anular_cotizaciones_vivas(db: Session, solicitud: Solicitud, motivo: str):
    cotizaciones = db.query(Cotizacion).filter(
        Cotizacion.solicitud_id_solicitud == solicitud.id_solicitud,
        Cotizacion.estado_cotizacion.in_(["ENVIADA", "ACEPTADA"]),
    ).all()
    for cot in cotizaciones:
        cot.estado_cotizacion = "ANULADA"
        cot.motivo_anulacion = motivo


def _notificar(db: Session, rut: str | None, titulo: str, mensaje: str, tipo: str):
    if rut:
        db.add(
            Notificacion(usuario_rut=rut, titulo=titulo, mensaje=mensaje, tipo=tipo)
        )


def _contraparte_rut(solicitud: Solicitud, solicitante_rut: str) -> str | None:
    """El otro actor de la solicitud (para notificarlo)."""
    if solicitante_rut == solicitud.usuario_rut:
        return solicitud.tecnico_usuario_rut
    return solicitud.usuario_rut


def solicitar_cancelacion(
    db: Session,
    solicitud: Solicitud,
    solicitante: Usuario,
    rol: str,
    motivo: str,
):
    estado = solicitud.estado_trabajo

    if estado in {"FINALIZADO", "CANCELADO"}:
        raise HTTPException(
            status_code=400,
            detail="No se puede cancelar una solicitud finalizada o ya cancelada",
        )
    if estado == "EN_REVISION_ADMIN":
        raise HTTPException(
            status_code=400,
            detail="Ya hay una solicitud de cancelación en revisión del administrador",
        )

    contraparte = _contraparte_rut(solicitud, solicitante.rut)

    # --- Cancelación directa (trabajo aún no iniciado) ---
    if estado in ESTADOS_CANCELACION_DIRECTA:
        solicitud.estado_trabajo = "CANCELADO"
        solicitud.solicitud_activa = False
        _anular_cotizaciones_vivas(db, solicitud, f"Solicitud cancelada por {rol.lower()}")

        db.add(
            HistorialSolicitud(
                solicitud_id_solicitud=solicitud.id_solicitud,
                usuario_rut=solicitante.rut,
                estado="CANCELADO",
                motivo=f"Cancelación directa ({rol}): {motivo}",
            )
        )
        _notificar(
            db,
            contraparte,
            "Solicitud cancelada",
            f"La solicitud '{solicitud.titulo_solicitud}' fue cancelada.",
            "SOLICITUD_CANCELADA",
        )
        db.commit()
        db.refresh(solicitud)

        return {
            "resultado": "CANCELADA_DIRECTA",
            "mensaje": "La solicitud fue cancelada correctamente.",
            "id_solicitud": solicitud.id_solicitud,
            "estado": solicitud.estado_trabajo,
            "id_cancelacion": None,
        }

    # --- Cancelación con revisión admin (trabajo EN_PROCESO) ---
    cancelacion = CancelacionSolicitud(
        solicitud_id_solicitud=solicitud.id_solicitud,
        solicitante_rut=solicitante.rut,
        solicitante_rol=rol,
        motivo=motivo,
        estado="PENDIENTE",
        estado_previo=estado,
    )
    db.add(cancelacion)

    solicitud.estado_trabajo = "EN_REVISION_ADMIN"
    db.add(
        HistorialSolicitud(
            solicitud_id_solicitud=solicitud.id_solicitud,
            usuario_rut=solicitante.rut,
            estado="EN_REVISION_ADMIN",
            motivo=f"Cancelación solicitada por {rol}: {motivo}",
        )
    )
    _notificar(
        db,
        contraparte,
        "Cancelación en revisión",
        (
            f"Se solicitó cancelar el trabajo '{solicitud.titulo_solicitud}'. "
            "Un administrador lo revisará."
        ),
        "CANCELACION_EN_REVISION",
    )

    db.commit()
    db.refresh(cancelacion)

    return {
        "resultado": "EN_REVISION_ADMIN",
        "mensaje": (
            "El trabajo está en proceso: tu solicitud de cancelación quedó en "
            "revisión del administrador."
        ),
        "id_solicitud": solicitud.id_solicitud,
        "estado": solicitud.estado_trabajo,
        "id_cancelacion": cancelacion.id_cancelacion,
    }


def listar_cancelaciones(db: Session, estado: str | None = None):
    consulta = db.query(CancelacionSolicitud)
    if estado:
        consulta = consulta.filter(CancelacionSolicitud.estado == estado)

    cancelaciones = consulta.order_by(
        CancelacionSolicitud.fecha_solicitud.desc()
    ).all()

    # Enriquecimiento (título/estado de la solicitud, nombre del solicitante).
    solicitud_ids = {c.solicitud_id_solicitud for c in cancelaciones}
    ruts = {c.solicitante_rut for c in cancelaciones}

    solicitudes = {}
    if solicitud_ids:
        for s in db.query(Solicitud).filter(Solicitud.id_solicitud.in_(solicitud_ids)):
            solicitudes[s.id_solicitud] = s

    usuarios = {}
    if ruts:
        for u in db.query(Usuario).filter(Usuario.rut.in_(ruts)):
            usuarios[u.rut] = u

    resultado = []
    for c in cancelaciones:
        s = solicitudes.get(c.solicitud_id_solicitud)
        u = usuarios.get(c.solicitante_rut)
        resultado.append(
            {
                "id_cancelacion": c.id_cancelacion,
                "solicitud_id_solicitud": c.solicitud_id_solicitud,
                "solicitante_rut": c.solicitante_rut,
                "solicitante_rol": c.solicitante_rol,
                "motivo": c.motivo,
                "estado": c.estado,
                "estado_previo": c.estado_previo,
                "fecha_solicitud": c.fecha_solicitud,
                "fecha_resolucion": c.fecha_resolucion,
                "admin_rut_resuelve": c.admin_rut_resuelve,
                "observacion_admin": c.observacion_admin,
                "solicitud_titulo": s.titulo_solicitud if s else None,
                "solicitud_estado": s.estado_trabajo if s else None,
                "solicitante_nombre": u.nombre_completo if u else None,
            }
        )
    return resultado


def resolver_cancelacion(
    db: Session,
    id_cancelacion: int,
    admin_rut: str,
    aprobar: bool,
    observacion: str | None,
    ip: str | None,
):
    cancelacion = db.query(CancelacionSolicitud).filter(
        CancelacionSolicitud.id_cancelacion == id_cancelacion
    ).first()

    if not cancelacion:
        raise HTTPException(status_code=404, detail="Solicitud de cancelación no encontrada")

    if cancelacion.estado != "PENDIENTE":
        raise HTTPException(
            status_code=400,
            detail="Esta solicitud de cancelación ya fue resuelta",
        )

    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == cancelacion.solicitud_id_solicitud
    ).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    estado_antes = solicitud.estado_trabajo
    cancelacion.fecha_resolucion = datetime.utcnow()
    cancelacion.admin_rut_resuelve = admin_rut
    cancelacion.observacion_admin = observacion

    contraparte = _contraparte_rut(solicitud, cancelacion.solicitante_rut)

    if aprobar:
        cancelacion.estado = "APROBADA"
        solicitud.estado_trabajo = "CANCELADO"
        solicitud.solicitud_activa = False
        _anular_cotizaciones_vivas(db, solicitud, "Cancelación aprobada por administrador")

        db.add(
            HistorialSolicitud(
                solicitud_id_solicitud=solicitud.id_solicitud,
                usuario_rut=admin_rut,
                estado="CANCELADO",
                motivo="Cancelación aprobada por el administrador",
            )
        )
        for rut in {cancelacion.solicitante_rut, contraparte}:
            _notificar(
                db,
                rut,
                "Cancelación aprobada",
                f"El administrador aprobó la cancelación de '{solicitud.titulo_solicitud}'.",
                "CANCELACION_APROBADA",
            )
    else:
        cancelacion.estado = "RECHAZADA"
        solicitud.estado_trabajo = cancelacion.estado_previo or "EN_PROCESO"
        solicitud.solicitud_activa = True

        db.add(
            HistorialSolicitud(
                solicitud_id_solicitud=solicitud.id_solicitud,
                usuario_rut=admin_rut,
                estado=solicitud.estado_trabajo,
                motivo="Cancelación rechazada por el administrador; el trabajo continúa",
            )
        )
        _notificar(
            db,
            cancelacion.solicitante_rut,
            "Cancelación rechazada",
            (
                f"El administrador rechazó la cancelación de '{solicitud.titulo_solicitud}'. "
                "El trabajo continúa."
            ),
            "CANCELACION_RECHAZADA",
        )

    db.commit()
    db.refresh(cancelacion)

    audit_service.registrar_auditoria(
        db,
        admin_rut=admin_rut,
        accion="APROBAR_CANCELACION" if aprobar else "RECHAZAR_CANCELACION",
        entidad_tipo="SOLICITUD",
        entidad_id=solicitud.id_solicitud,
        usuario_afectado_rut=cancelacion.solicitante_rut,
        motivo=observacion,
        estado_antes=estado_antes,
        estado_despues=solicitud.estado_trabajo,
        detalle=f"Cancelación #{cancelacion.id_cancelacion} solicitada por {cancelacion.solicitante_rol}",
        ip=ip,
    )

    return cancelacion
