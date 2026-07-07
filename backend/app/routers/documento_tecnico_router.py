from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_current_usuario, solo_admin, solo_tecnico, usuario_tiene_rol
from app.database import get_db
from app.services import documento_tecnico_service
from app.services import audit_service
from app.services.archivo_service import guardar_archivo
from app.models.documento_tecnico import DocumentoTecnico
from app.schemas.documento_tecnico_schema import (
    DocumentoTecnicoResponse,
    DocumentoTecnicoAprobacion,
    DocumentoTecnicoRechazo,
    TecnicoPendienteVerificacionResponse
)

router = APIRouter(
    prefix="/documentos-tecnicos",
    tags=["Documentos Técnicos"]
)


# SUBIR DOCUMENTO TÉCNICO REAL - SOLO TÉCNICO
@router.post("/", response_model=DocumentoTecnicoResponse)
def subir_documento_tecnico(
    tecnico_usuario_rut: str = Form(...),
    tipo_documento: str = Form(...),
    archivo: UploadFile = File(...),
    current_user: dict = Depends(solo_tecnico),
    db: Session = Depends(get_db)
):
    if current_user.get("rut") != tecnico_usuario_rut:
        raise HTTPException(
            status_code=403,
            detail="No puedes subir documentos para otro tecnico"
        )

    nombre_archivo, archivo_url = guardar_archivo(archivo, "documentos_tecnicos")

    return documento_tecnico_service.crear_documento_tecnico_archivo(
        db=db,
        tecnico_usuario_rut=tecnico_usuario_rut,
        tipo_documento=tipo_documento,
        nombre_archivo=nombre_archivo,
        archivo_url=archivo_url
    )


# LISTAR TODOS LOS DOCUMENTOS
@router.get("/", response_model=List[DocumentoTecnicoResponse])
def listar_documentos_tecnicos(
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db),
):
    return documento_tecnico_service.listar_documentos_tecnicos(db)


# LISTAR TÉCNICOS PENDIENTES DE VERIFICACIÓN - SOLO ADMIN
@router.get(
    "/tecnicos/pendientes-verificacion",
    response_model=List[TecnicoPendienteVerificacionResponse]
)
def listar_tecnicos_pendientes_verificacion(
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db)
):
    return documento_tecnico_service.listar_tecnicos_pendientes_verificacion(db)


# LISTAR DOCUMENTOS DE UN TÉCNICO
@router.get("/tecnico/{rut}", response_model=List[DocumentoTecnicoResponse])
def obtener_documentos_por_tecnico(
    rut: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    es_admin = usuario_tiene_rol(db, usuario_actual.rut, "ADMIN")
    if not es_admin and usuario_actual.rut != rut:
        raise HTTPException(
            status_code=403,
            detail="No puedes ver documentos de otro tecnico"
        )

    return documento_tecnico_service.obtener_documentos_por_tecnico(db, rut)


# APROBAR DOCUMENTO - SOLO ADMIN
@router.put("/{id_documento}/aprobar", response_model=DocumentoTecnicoResponse)
def aprobar_documento_tecnico(
    id_documento: int,
    data: DocumentoTecnicoAprobacion,
    request: Request,
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db)
):
    documento_previo = db.query(DocumentoTecnico).filter(
        DocumentoTecnico.id_documento == id_documento
    ).first()
    estado_antes = documento_previo.estado_documento if documento_previo else None

    documento = documento_tecnico_service.aprobar_documento_tecnico(
        db,
        id_documento,
        current_user.get("rut")
    )

    audit_service.registrar_auditoria(
        db,
        admin_rut=current_user.get("rut"),
        accion="APROBAR_DOCUMENTO",
        entidad_tipo="DOCUMENTO",
        entidad_id=documento.id_documento,
        usuario_afectado_rut=documento.tecnico_usuario_rut,
        estado_antes=estado_antes,
        estado_despues=documento.estado_documento,
        detalle=f"Documento: {documento.tipo_documento}",
        ip=audit_service.obtener_ip(request),
    )

    return documento


# RECHAZAR DOCUMENTO - SOLO ADMIN
@router.put("/{id_documento}/rechazar", response_model=DocumentoTecnicoResponse)
def rechazar_documento_tecnico(
    id_documento: int,
    data: DocumentoTecnicoRechazo,
    request: Request,
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db)
):
    documento_previo = db.query(DocumentoTecnico).filter(
        DocumentoTecnico.id_documento == id_documento
    ).first()
    estado_antes = documento_previo.estado_documento if documento_previo else None

    documento = documento_tecnico_service.rechazar_documento_tecnico(
        db,
        id_documento,
        current_user.get("rut"),
        data.motivo_rechazo
    )

    audit_service.registrar_auditoria(
        db,
        admin_rut=current_user.get("rut"),
        accion="RECHAZAR_DOCUMENTO",
        entidad_tipo="DOCUMENTO",
        entidad_id=documento.id_documento,
        usuario_afectado_rut=documento.tecnico_usuario_rut,
        motivo=documento.motivo_rechazo,
        estado_antes=estado_antes,
        estado_despues=documento.estado_documento,
        detalle=f"Documento: {documento.tipo_documento}",
        ip=audit_service.obtener_ip(request),
    )

    return documento


# ELIMINAR DOCUMENTO - SOLO TÉCNICO DUEÑO (para reemplazar/reenviar)
@router.delete("/{id_documento}")
def eliminar_documento_tecnico(
    id_documento: int,
    current_user: dict = Depends(solo_tecnico),
    db: Session = Depends(get_db)
):
    return documento_tecnico_service.eliminar_documento_tecnico(
        db,
        id_documento,
        current_user.get("rut")
    )
