import os
import shutil
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, solo_admin, solo_tecnico
from app.schemas.documento_tecnico_schema import (
    DocumentoTecnicoAprobacion,
    DocumentoTecnicoResponse,
    TecnicoPendienteVerificacionResponse,
)
from app.services import documento_tecnico_service


router = APIRouter(
    prefix="/documentos-tecnicos",
    tags=["Documentos Tecnicos"]
)

TIPOS_ARCHIVO_PERMITIDOS = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}


def obtener_rut_usuario_actual(db: Session, current_user: dict) -> str:
    usuario = documento_tecnico_service.obtener_usuario_por_correo(
        db,
        current_user["correo"]
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="No encontramos tu cuenta para asociar la evidencia."
        )

    return usuario.rut


def obtener_admin_rut(db: Session, current_user: dict) -> str:
    rut = obtener_rut_usuario_actual(db, current_user)
    documento_tecnico_service.obtener_admin_por_rut(db, rut)
    return rut


@router.post("/", response_model=DocumentoTecnicoResponse)
def subir_documento_tecnico(
    tecnico_usuario_rut: str = Form(...),
    tipo_documento: str = Form(...),
    archivo: UploadFile = File(...),
    current_user: dict = Depends(solo_tecnico),
    db: Session = Depends(get_db)
):
    rut_actual = obtener_rut_usuario_actual(db, current_user)

    if rut_actual != tecnico_usuario_rut:
        raise HTTPException(
            status_code=403,
            detail="Solo puedes subir evidencias para tu propio perfil tecnico."
        )

    if archivo.content_type not in TIPOS_ARCHIVO_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail="Sube una evidencia en PDF, JPG o PNG para que podamos revisarla."
        )

    carpeta_destino = "uploads/documentos_tecnicos"
    os.makedirs(carpeta_destino, exist_ok=True)

    fecha = datetime.now().strftime("%Y%m%d%H%M%S")
    nombre_original = os.path.basename(archivo.filename or "evidencia")
    nombre_archivo = f"{fecha}_{nombre_original}"
    ruta_archivo = os.path.join(carpeta_destino, nombre_archivo)

    with open(ruta_archivo, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    archivo_url = f"/uploads/documentos_tecnicos/{nombre_archivo}"

    return documento_tecnico_service.crear_documento_tecnico_archivo(
        db=db,
        tecnico_usuario_rut=tecnico_usuario_rut,
        tipo_documento=tipo_documento,
        nombre_archivo=nombre_archivo,
        archivo_url=archivo_url
    )


@router.get("/", response_model=List[DocumentoTecnicoResponse])
def listar_documentos_tecnicos(
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db)
):
    return documento_tecnico_service.listar_documentos_tecnicos(db)


@router.get(
    "/tecnicos/pendientes-verificacion",
    response_model=List[TecnicoPendienteVerificacionResponse]
)
def listar_tecnicos_pendientes_verificacion(
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db)
):
    return documento_tecnico_service.listar_tecnicos_pendientes_verificacion(db)


@router.get("/tecnico/{rut}", response_model=List[DocumentoTecnicoResponse])
def obtener_documentos_por_tecnico(
    rut: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["tipo_usuario"] != "ADMIN":
        rut_actual = obtener_rut_usuario_actual(db, current_user)
        if rut_actual != rut:
            raise HTTPException(
                status_code=403,
                detail="Solo puedes ver las evidencias de tu propio perfil."
            )

    return documento_tecnico_service.obtener_documentos_por_tecnico(db, rut)


@router.put("/{id_documento}/aprobar", response_model=DocumentoTecnicoResponse)
def aprobar_documento_tecnico(
    id_documento: int,
    data: DocumentoTecnicoAprobacion,
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db)
):
    admin_rut = obtener_admin_rut(db, current_user)

    return documento_tecnico_service.aprobar_documento_tecnico(
        db,
        id_documento,
        admin_rut,
        data.observacion
    )


@router.put("/{id_documento}/rechazar", response_model=DocumentoTecnicoResponse)
def rechazar_documento_tecnico(
    id_documento: int,
    data: DocumentoTecnicoAprobacion,
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db)
):
    admin_rut = obtener_admin_rut(db, current_user)

    return documento_tecnico_service.rechazar_documento_tecnico(
        db,
        id_documento,
        admin_rut,
        data.observacion
    )
