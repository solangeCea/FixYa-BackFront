from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime

from app.dependencies import solo_admin, solo_tecnico
from app.database import get_db
from app.services import documento_tecnico_service
from app.schemas.documento_tecnico_schema import (
    DocumentoTecnicoResponse,
    DocumentoTecnicoAprobacion,
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
    carpeta_destino = "uploads/documentos_tecnicos"
    os.makedirs(carpeta_destino, exist_ok=True)

    fecha = datetime.now().strftime("%Y%m%d%H%M%S")
    nombre_archivo = f"{fecha}_{archivo.filename}"
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


# LISTAR TODOS LOS DOCUMENTOS
@router.get("/", response_model=List[DocumentoTecnicoResponse])
def listar_documentos_tecnicos(db: Session = Depends(get_db)):
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
    db: Session = Depends(get_db)
):
    return documento_tecnico_service.obtener_documentos_por_tecnico(db, rut)


# APROBAR DOCUMENTO - SOLO ADMIN
@router.put("/{id_documento}/aprobar", response_model=DocumentoTecnicoResponse)
def aprobar_documento_tecnico(
    id_documento: int,
    data: DocumentoTecnicoAprobacion,
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db)
):
    return documento_tecnico_service.aprobar_documento_tecnico(
        db,
        id_documento,
        data.usuario_rut
    )


# RECHAZAR DOCUMENTO - SOLO ADMIN
@router.put("/{id_documento}/rechazar", response_model=DocumentoTecnicoResponse)
def rechazar_documento_tecnico(
    id_documento: int,
    data: DocumentoTecnicoAprobacion,
    current_user: dict = Depends(solo_admin),
    db: Session = Depends(get_db)
):
    return documento_tecnico_service.rechazar_documento_tecnico(
        db,
        id_documento,
        data.usuario_rut
    )