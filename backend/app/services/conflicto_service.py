"""Reportes de conflicto durante el trabajo (Fase D).

Cliente o técnico pueden reportar un conflicto (trabajo deficiente, cobro
indebido, daños, etc.) con evidencia adjunta. El administrador lo revisa y lo
marca CONFIRMADO o DESCARTADO. Crear el reporte es una acción de usuario
(queda en el historial + notifica); resolverlo es una acción admin (se audita).
"""

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.solicitud import Solicitud
from app.models.conflicto_solicitud import ConflictoSolicitud, ConflictoEvidencia
from app.models.historial_solicitud import HistorialSolicitud
from app.models.notificacion import Notificacion
from app.models.usuario import Usuario
from app.services import audit_service

# Solo tiene sentido reportar un conflicto sobre un trabajo en marcha.
ESTADOS_CONFLICTO_PERMITIDOS = {"EN_PROCESO", "CAMBIO_ALCANCE", "EN_REVISION_ADMIN"}


def _contraparte_rut(solicitud: Solicitud, reportante_rut: str) -> str | None:
    if reportante_rut == solicitud.usuario_rut:
        return solicitud.tecnico_usuario_rut
    return solicitud.usuario_rut


def crear_conflicto(
    db: Session,
    solicitud: Solicitud,
    reportante: Usuario,
    rol: str,
    tipo: str,
    descripcion: str,
    evidencias: list[tuple[str, str]],
):
    if solicitud.estado_trabajo not in ESTADOS_CONFLICTO_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail="Solo se puede reportar un conflicto sobre un trabajo en curso",
        )

    conflicto = ConflictoSolicitud(
        solicitud_id_solicitud=solicitud.id_solicitud,
        reportante_rut=reportante.rut,
        reportante_rol=rol,
        tipo=tipo,
        descripcion=descripcion,
        estado="PENDIENTE",
    )
    db.add(conflicto)
    db.flush()

    for nombre_archivo, archivo_url in evidencias:
        db.add(
            ConflictoEvidencia(
                conflicto_id=conflicto.id_conflicto,
                nombre_archivo=nombre_archivo,
                archivo_url=archivo_url,
            )
        )

    db.add(
        HistorialSolicitud(
            solicitud_id_solicitud=solicitud.id_solicitud,
            usuario_rut=reportante.rut,
            estado="CONFLICTO_REPORTADO",
            motivo=f"Conflicto reportado por {rol.lower()} ({tipo})",
        )
    )

    contraparte = _contraparte_rut(solicitud, reportante.rut)
    if contraparte:
        db.add(
            Notificacion(
                usuario_rut=contraparte,
                titulo="Se reportó un conflicto",
                mensaje=(
                    f"Se reportó un conflicto en el trabajo "
                    f"'{solicitud.titulo_solicitud}'. Un administrador lo revisará."
                ),
                tipo="CONFLICTO_REPORTADO",
            )
        )

    db.commit()
    db.refresh(conflicto)
    return conflicto


def listar_conflictos_por_solicitud(db: Session, id_solicitud: int):
    return (
        db.query(ConflictoSolicitud)
        .filter(ConflictoSolicitud.solicitud_id_solicitud == id_solicitud)
        .order_by(ConflictoSolicitud.fecha_reporte.desc())
        .all()
    )


def listar_conflictos(db: Session, estado: str | None = None):
    consulta = db.query(ConflictoSolicitud)
    if estado:
        consulta = consulta.filter(ConflictoSolicitud.estado == estado)

    conflictos = consulta.order_by(ConflictoSolicitud.fecha_reporte.desc()).all()

    solicitud_ids = {c.solicitud_id_solicitud for c in conflictos}
    ruts = {c.reportante_rut for c in conflictos}

    solicitudes = {}
    if solicitud_ids:
        for s in db.query(Solicitud).filter(Solicitud.id_solicitud.in_(solicitud_ids)):
            solicitudes[s.id_solicitud] = s

    usuarios = {}
    if ruts:
        for u in db.query(Usuario).filter(Usuario.rut.in_(ruts)):
            usuarios[u.rut] = u

    resultado = []
    for c in conflictos:
        s = solicitudes.get(c.solicitud_id_solicitud)
        u = usuarios.get(c.reportante_rut)
        resultado.append(
            {
                "id_conflicto": c.id_conflicto,
                "solicitud_id_solicitud": c.solicitud_id_solicitud,
                "reportante_rut": c.reportante_rut,
                "reportante_rol": c.reportante_rol,
                "tipo": c.tipo,
                "descripcion": c.descripcion,
                "estado": c.estado,
                "fecha_reporte": c.fecha_reporte,
                "fecha_revision": c.fecha_revision,
                "admin_rut_resuelve": c.admin_rut_resuelve,
                "observacion_admin": c.observacion_admin,
                "evidencias": c.evidencias,
                "solicitud_titulo": s.titulo_solicitud if s else None,
                "solicitud_estado": s.estado_trabajo if s else None,
                "reportante_nombre": u.nombre_completo if u else None,
            }
        )
    return resultado


def resolver_conflicto(
    db: Session,
    id_conflicto: int,
    admin_rut: str,
    estado: str,
    observacion: str | None,
    ip: str | None,
):
    conflicto = db.query(ConflictoSolicitud).filter(
        ConflictoSolicitud.id_conflicto == id_conflicto
    ).first()

    if not conflicto:
        raise HTTPException(status_code=404, detail="Conflicto no encontrado")

    if conflicto.estado in {"CONFIRMADO", "DESCARTADO"}:
        raise HTTPException(status_code=400, detail="Este conflicto ya fue resuelto")

    estado_antes = conflicto.estado
    conflicto.estado = estado
    conflicto.fecha_revision = datetime.utcnow()
    conflicto.admin_rut_resuelve = admin_rut
    conflicto.observacion_admin = observacion

    db.add(
        Notificacion(
            usuario_rut=conflicto.reportante_rut,
            titulo="Conflicto revisado",
            mensaje=(
                "El administrador revisó tu reporte de conflicto y lo marcó como "
                f"{'confirmado' if estado == 'CONFIRMADO' else 'descartado'}."
            ),
            tipo="CONFLICTO_RESUELTO",
        )
    )

    db.commit()
    db.refresh(conflicto)

    audit_service.registrar_auditoria(
        db,
        admin_rut=admin_rut,
        accion="RESOLVER_CONFLICTO",
        entidad_tipo="CONFLICTO",
        entidad_id=conflicto.id_conflicto,
        usuario_afectado_rut=conflicto.reportante_rut,
        motivo=observacion,
        estado_antes=estado_antes,
        estado_despues=conflicto.estado,
        detalle=f"Solicitud #{conflicto.solicitud_id_solicitud} · tipo {conflicto.tipo}",
        ip=ip,
    )

    return conflicto
