"""Servicio de auditoría de acciones administrativas (Fase B — Audit Log).

Punto único para registrar y consultar la bitácora de acciones sensibles del
admin. `registrar_auditoria` está pensado para llamarse DESPUÉS de que la acción
principal se haya confirmado (commit), de modo que la bitácora refleje el estado
ya persistido. Escribe su propia fila en una transacción independiente y nunca
propaga una excepción: auditar jamás debe tumbar la operación de negocio.
"""

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.usuario import Usuario


def obtener_ip(request) -> str | None:
    """IP de origen de la petición.

    Detrás de un proxy/CDN (Render, Cloudflare) `request.client.host` es la IP
    del proxy; la IP real del cliente viaja en `X-Forwarded-For` (lista
    separada por comas, el primer valor es el cliente original).
    """
    if request is None:
        return None

    reenviada = request.headers.get("x-forwarded-for")
    if reenviada:
        return reenviada.split(",")[0].strip()[:64]

    if request.client and request.client.host:
        return request.client.host[:64]

    return None


def registrar_auditoria(
    db: Session,
    *,
    admin_rut: str | None,
    accion: str,
    entidad_tipo: str,
    entidad_id: str | int | None = None,
    usuario_afectado_rut: str | None = None,
    motivo: str | None = None,
    estado_antes: str | None = None,
    estado_despues: str | None = None,
    detalle: str | None = None,
    ip: str | None = None,
) -> AuditLog | None:
    """Registra una acción administrativa en la bitácora.

    Devuelve la fila creada, o `None` si algo falla (la operación de negocio ya
    se confirmó; no queremos que un error de auditoría la revierta).
    """
    try:
        admin_correo = None
        if admin_rut:
            admin = db.query(Usuario).filter(Usuario.rut == admin_rut).first()
            if admin:
                admin_correo = admin.correo

        entrada = AuditLog(
            admin_rut=admin_rut,
            admin_correo=admin_correo,
            accion=accion,
            entidad_tipo=entidad_tipo,
            entidad_id=str(entidad_id) if entidad_id is not None else None,
            usuario_afectado_rut=usuario_afectado_rut,
            motivo=(motivo or None) and motivo[:1000],
            estado_antes=estado_antes,
            estado_despues=estado_despues,
            detalle=(detalle or None) and detalle[:1000],
            ip=ip,
        )

        db.add(entrada)
        db.commit()
        db.refresh(entrada)
        return entrada
    except Exception as error:  # noqa: BLE001 — auditar nunca debe tumbar la acción
        db.rollback()
        print(f"[audit_service] No se pudo registrar la auditoría: {error}")
        return None


def listar_auditoria(
    db: Session,
    *,
    accion: str | None = None,
    entidad_tipo: str | None = None,
    admin_rut: str | None = None,
    usuario_afectado_rut: str | None = None,
    limite: int = 200,
    offset: int = 0,
):
    """Lista la bitácora, de la más reciente a la más antigua, con filtros
    opcionales y paginación acotada."""
    consulta = db.query(AuditLog)

    if accion:
        consulta = consulta.filter(AuditLog.accion == accion)
    if entidad_tipo:
        consulta = consulta.filter(AuditLog.entidad_tipo == entidad_tipo)
    if admin_rut:
        consulta = consulta.filter(AuditLog.admin_rut == admin_rut)
    if usuario_afectado_rut:
        consulta = consulta.filter(
            AuditLog.usuario_afectado_rut == usuario_afectado_rut
        )

    limite = max(1, min(limite, 500))
    offset = max(0, offset)

    return (
        consulta.order_by(AuditLog.fecha.desc(), AuditLog.id_audit.desc())
        .offset(offset)
        .limit(limite)
        .all()
    )
