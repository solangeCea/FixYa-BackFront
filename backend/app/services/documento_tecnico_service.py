from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.documento_tecnico import DocumentoTecnico
from app.models.tecnico import Tecnico
from app.models.usuario import Usuario
from app.schemas.documento_tecnico_schema import DocumentoTecnicoCreate


TIPOS_EVIDENCIA_PERMITIDOS = {
    "CERTIFICADO",
    "TITULO",
    "CURSO",
    "LICENCIA",
    "FOTO_TRABAJO",
    "REFERENCIA_LABORAL",
    "PORTAFOLIO",
    "EXPERIENCIA_OFICIO",
    "OTRO",
    # Compatibilidad con datos antiguos.
    "CERTIFICADO_TECNICO",
    "ANTECEDENTES",
}


def obtener_usuario_por_correo(db: Session, correo: str) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.correo == correo).first()


def obtener_admin_por_rut(db: Session, usuario_rut: str) -> Usuario:
    admin = db.query(Usuario).filter(
        Usuario.rut == usuario_rut,
        Usuario.tipo_usuario == "ADMIN"
    ).first()

    if not admin:
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede revisar evidencias."
        )

    return admin


def validar_tipo_evidencia(tipo_documento: str):
    if tipo_documento not in TIPOS_EVIDENCIA_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail="Selecciona un tipo de evidencia válido para revisar tu perfil."
        )


def crear_documento_tecnico(db: Session, documento: DocumentoTecnicoCreate):
    return crear_documento_tecnico_archivo(
        db=db,
        tecnico_usuario_rut=documento.tecnico_usuario_rut,
        tipo_documento=documento.tipo_documento,
        nombre_archivo=documento.nombre_archivo,
        archivo_url=documento.archivo_url
    )


def listar_documentos_tecnicos(db: Session):
    return db.query(DocumentoTecnico).order_by(
        DocumentoTecnico.fecha_subida.desc()
    ).all()


def obtener_documentos_por_tecnico(db: Session, rut: str):
    return db.query(DocumentoTecnico).filter(
        DocumentoTecnico.tecnico_usuario_rut == rut
    ).order_by(DocumentoTecnico.fecha_subida.desc()).all()


def crear_documento_tecnico_archivo(
    db: Session,
    tecnico_usuario_rut: str,
    tipo_documento: str,
    nombre_archivo: str,
    archivo_url: str
):
    validar_tipo_evidencia(tipo_documento)

    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == tecnico_usuario_rut
    ).first()

    if not tecnico:
        raise HTTPException(
            status_code=404,
            detail="No encontramos el perfil técnico asociado a esta evidencia."
        )

    nuevo_documento = DocumentoTecnico(
        tecnico_usuario_rut=tecnico_usuario_rut,
        tipo_documento=tipo_documento,
        nombre_archivo=nombre_archivo,
        archivo_url=archivo_url,
        fecha_subida=datetime.utcnow(),
        documento_aprobado=False,
        estado_revision="PENDIENTE_REVISION",
        observacion_revision=None,
        fecha_aprobacion=None,
        fecha_revision=None,
        usuario_rut=None,
        revisado_por_rut=None
    )

    if not tecnico.tecnico_verificado:
        tecnico.estado_verificacion = "EN_REVISION"
        tecnico.observacion_verificacion = (
            "Tu evidencia fue enviada y está pendiente de revisión."
        )

    db.add(nuevo_documento)
    db.commit()
    db.refresh(nuevo_documento)

    return nuevo_documento


def aprobar_documento_tecnico(
    db: Session,
    id_documento: int,
    usuario_rut: str,
    observacion: str | None = None
):
    documento = db.query(DocumentoTecnico).filter(
        DocumentoTecnico.id_documento == id_documento
    ).first()

    if not documento:
        raise HTTPException(
            status_code=404,
            detail="No encontramos esta evidencia para revisarla."
        )

    obtener_admin_por_rut(db, usuario_rut)

    documento.documento_aprobado = True
    documento.estado_revision = "APROBADO"
    documento.observacion_revision = (
        observacion or "Este documento fue aprobado por el administrador."
    )
    documento.fecha_revision = datetime.utcnow()
    documento.fecha_aprobacion = documento.fecha_revision
    documento.usuario_rut = usuario_rut
    documento.revisado_por_rut = usuario_rut

    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == documento.tecnico_usuario_rut
    ).first()

    if tecnico and not tecnico.tecnico_verificado:
        tecnico.estado_verificacion = "EN_REVISION"
        tecnico.observacion_verificacion = (
            "Ya hay evidencia aprobada. El administrador aún debe aprobar el perfil."
        )

    db.commit()
    db.refresh(documento)

    return documento


def rechazar_documento_tecnico(
    db: Session,
    id_documento: int,
    usuario_rut: str,
    observacion: str | None = None
):
    if not observacion or not observacion.strip():
        raise HTTPException(
            status_code=400,
            detail="Escribe una observación para que el técnico sepa qué corregir."
        )

    documento = db.query(DocumentoTecnico).filter(
        DocumentoTecnico.id_documento == id_documento
    ).first()

    if not documento:
        raise HTTPException(
            status_code=404,
            detail="No encontramos esta evidencia para revisarla."
        )

    obtener_admin_por_rut(db, usuario_rut)

    documento.documento_aprobado = False
    documento.estado_revision = "RECHAZADO"
    documento.observacion_revision = observacion.strip()
    documento.fecha_revision = datetime.utcnow()
    documento.fecha_aprobacion = None
    documento.usuario_rut = usuario_rut
    documento.revisado_por_rut = usuario_rut

    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == documento.tecnico_usuario_rut
    ).first()

    if tecnico and not tecnico.tecnico_verificado:
        tecnico.estado_verificacion = "OBSERVADO"
        tecnico.observacion_verificacion = (
            "Necesitamos más información para verificar tu perfil."
        )

    db.commit()
    db.refresh(documento)

    return documento


def listar_tecnicos_pendientes_verificacion(db: Session):
    return db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == False
    ).all()


def obtener_resumen_evidencias(db: Session, tecnico_rut: str):
    documentos = obtener_documentos_por_tecnico(db, tecnico_rut)

    return {
        "total": len(documentos),
        "pendientes": len([
            doc for doc in documentos
            if doc.estado_revision == "PENDIENTE_REVISION"
        ]),
        "aprobadas": len([
            doc for doc in documentos
            if doc.estado_revision == "APROBADO" or doc.documento_aprobado
        ]),
        "rechazadas": len([
            doc for doc in documentos
            if doc.estado_revision == "RECHAZADO"
        ]),
        "revisadas": len([
            doc for doc in documentos
            if doc.estado_revision in {"APROBADO", "RECHAZADO"}
            or doc.documento_aprobado
        ]),
    }
