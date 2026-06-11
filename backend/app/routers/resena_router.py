from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.resena import Resena
from app.models.solicitud import Solicitud
from app.models.usuario import Usuario
from app.schemas.resena_schema import ResenaCreate, ResenaResponse
from app.dependencies import get_current_user
from app.services.resena_service import generar_resumen_reputacion, preparar_estado_resena
from app.schemas.resena_schema import ResenaCreate, ResenaResponse, ResolverReporteResena
from datetime import datetime


router = APIRouter(prefix="/resenas", tags=["Reseñas"])


@router.post("/", response_model=ResenaResponse)
def crear_resena(
    data: ResenaCreate,
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_current_user)
):
    correo_usuario = usuario_actual.get("correo")
    
    

    usuario = db.query(Usuario).filter(
        Usuario.correo == correo_usuario
    ).first()

    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == data.id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud.usuario_rut != usuario.rut:
        raise HTTPException(status_code=403, detail="No puedes reseñar esta solicitud")

    if solicitud.estado_trabajo != "FINALIZADO":
        raise HTTPException(status_code=400, detail="Solo puedes reseñar solicitudes finalizadas")

    if not solicitud.tecnico_usuario_rut:
        raise HTTPException(status_code=400, detail="La solicitud no tiene técnico asignado")

    resena_existente = db.query(Resena).filter(
        Resena.solicitud_id_solicitud == data.id_solicitud
    ).first()

    if resena_existente:
        raise HTTPException(status_code=400, detail="Esta solicitud ya tiene una reseña")

    estado_resena = preparar_estado_resena(data.comentario)

    nueva_resena = Resena(
        solicitud_id_solicitud=solicitud.id_solicitud,
        usuario_rut=usuario.rut,
        calificacion=data.calificacion,
        comentario=data.comentario,
        **estado_resena
    )

    db.add(nueva_resena)
    db.commit()
    db.refresh(nueva_resena)

    return nueva_resena

@router.get("/", response_model=list[ResenaResponse])
def listar_resenas_activas(db: Session = Depends(get_db)):
    return db.query(Resena).filter(
        Resena.resena_activa == "S"
    ).all()
    
@router.get("/reportadas", response_model=list[ResenaResponse])
def listar_resenas_reportadas(db: Session = Depends(get_db)):
    return db.query(Resena).filter(
        Resena.resena_reportada == "S"
    ).all()
    
@router.put("/{id_resena}/resolver-reporte", response_model=ResenaResponse)
def resolver_reporte_resena(
    id_resena: int,
    data: ResolverReporteResena,
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_current_user)
):
    correo_usuario = usuario_actual.get("correo")

    admin = db.query(Usuario).filter(
        Usuario.correo == correo_usuario
    ).first()

    if not admin:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    if admin.tipo_usuario.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Solo un administrador puede resolver reportes")

    resena = db.query(Resena).filter(
        Resena.id_resena == id_resena
    ).first()

    if not resena:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")

    resena.reporte_resuelto = "S"
    resena.fecha_resolucion = datetime.utcnow()
    resena.admin_rut_resuelve = admin.rut

    if data.motivo_reporte:
        resena.motivo_reporte = data.motivo_reporte

    if data.aprobar_publicacion:
        resena.resena_activa = "S"
    else:
        resena.resena_activa = "N"

    db.commit()
    db.refresh(resena)

    return resena
@router.get("/tecnico/{rut_tecnico}", response_model=list[ResenaResponse])
def listar_resenas_por_tecnico(
    rut_tecnico: str,
    db: Session = Depends(get_db)
):
    return db.query(Resena).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == rut_tecnico,
        Resena.resena_activa == "S"
    ).all()


@router.get("/tecnico/{rut_tecnico}/resumen")
def obtener_resumen_reputacion_tecnico(
    rut_tecnico: str,
    db: Session = Depends(get_db)
):
    resenas = db.query(Resena).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == rut_tecnico,
        Resena.resena_activa == "S"
    ).all()

    return generar_resumen_reputacion(resenas)
