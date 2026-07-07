from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_usuario, solo_admin, usuario_tiene_rol
from app.models.solicitud import Solicitud
from app.schemas.conflicto_schema import (
    ConflictoAdminResponse,
    ConflictoResolver,
    ConflictoResponse,
)
from app.schemas.cancelacion_schema import (
    CancelacionAdminResponse,
    CancelacionResolver,
    CancelacionResponse,
)
from app.services import audit_service, cancelacion_service, conflicto_service
from app.services.archivo_service import guardar_archivo

router = APIRouter(prefix="/solicitudes", tags=["Conflictos y Cancelaciones"])

MAX_EVIDENCIAS = 5
TIPOS_EVIDENCIA_PERMITIDOS = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}

TIPOS_CONFLICTO_VALIDOS = {
    "TRABAJO_INCOMPLETO",
    "TRABAJO_DEFICIENTE",
    "NO_SE_PRESENTO",
    "COBRO_INDEBIDO",
    "DANOS_PROPIEDAD",
    "COMPORTAMIENTO_INADECUADO",
    "MATERIALES_NO_ACORDADOS",
    "INCUMPLIMIENTO_ACUERDO",
    "OTRO",
}


def _solicitud_y_rol(db: Session, usuario_actual, id_solicitud: int):
    """Devuelve (solicitud, rol) validando que el usuario sea parte de ella."""
    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == id_solicitud
    ).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    es_dueno = solicitud.usuario_rut == usuario_actual.rut
    es_tecnico_asignado = solicitud.tecnico_usuario_rut == usuario_actual.rut
    es_admin = usuario_tiene_rol(db, usuario_actual.rut, "ADMIN")

    if not (es_dueno or es_tecnico_asignado or es_admin):
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso sobre esta solicitud",
        )

    rol = "CLIENTE" if es_dueno else ("TECNICO" if es_tecnico_asignado else "ADMIN")
    return solicitud, rol


# ------------------------- CONFLICTOS -------------------------

@router.post("/{id_solicitud}/conflictos", response_model=ConflictoResponse)
def crear_conflicto(
    id_solicitud: int,
    tipo: str = Form(...),
    descripcion: str = Form(...),
    archivos: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    solicitud, rol = _solicitud_y_rol(db, usuario_actual, id_solicitud)

    if rol == "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="El conflicto lo reporta el cliente o el técnico de la solicitud",
        )

    if tipo not in TIPOS_CONFLICTO_VALIDOS:
        raise HTTPException(status_code=422, detail="Tipo de conflicto no válido")

    descripcion = (descripcion or "").strip()
    if len(descripcion) < 10:
        raise HTTPException(
            status_code=422,
            detail="La descripción debe tener al menos 10 caracteres",
        )

    archivos = [a for a in (archivos or []) if a and a.filename]
    if len(archivos) > MAX_EVIDENCIAS:
        raise HTTPException(
            status_code=422,
            detail=f"Máximo {MAX_EVIDENCIAS} archivos de evidencia",
        )

    evidencias = []
    for archivo in archivos:
        if archivo.content_type not in TIPOS_EVIDENCIA_PERMITIDOS:
            raise HTTPException(
                status_code=422,
                detail="Solo se permiten imágenes (JPG/PNG/WEBP) o PDF como evidencia",
            )
        nombre, url = guardar_archivo(archivo, "conflictos")
        evidencias.append((nombre, url))

    return conflicto_service.crear_conflicto(
        db, solicitud, usuario_actual, rol, tipo, descripcion, evidencias
    )


@router.get("/{id_solicitud}/conflictos", response_model=List[ConflictoResponse])
def listar_conflictos_de_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    _solicitud_y_rol(db, usuario_actual, id_solicitud)
    return conflicto_service.listar_conflictos_por_solicitud(db, id_solicitud)


@router.get("/conflictos", response_model=List[ConflictoAdminResponse])
def listar_conflictos_admin(
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_admin),
):
    return conflicto_service.listar_conflictos(db, estado)


@router.put("/conflictos/{id_conflicto}/resolver", response_model=ConflictoResponse)
def resolver_conflicto(
    id_conflicto: int,
    data: ConflictoResolver,
    request: Request,
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_admin),
):
    return conflicto_service.resolver_conflicto(
        db,
        id_conflicto,
        usuario_actual.get("rut"),
        data.estado,
        data.observacion_admin,
        audit_service.obtener_ip(request),
    )


# ------------------------- CANCELACIONES -------------------------

@router.get("/cancelaciones", response_model=List[CancelacionAdminResponse])
def listar_cancelaciones_admin(
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_admin),
):
    return cancelacion_service.listar_cancelaciones(db, estado)


@router.put(
    "/cancelaciones/{id_cancelacion}/resolver",
    response_model=CancelacionResponse,
)
def resolver_cancelacion(
    id_cancelacion: int,
    data: CancelacionResolver,
    request: Request,
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_admin),
):
    return cancelacion_service.resolver_cancelacion(
        db,
        id_cancelacion,
        usuario_actual.get("rut"),
        data.aprobar,
        data.observacion_admin,
        audit_service.obtener_ip(request),
    )
