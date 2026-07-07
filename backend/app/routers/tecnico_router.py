from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func
from app.models.resena import Resena
from app.models.solicitud import Solicitud
from sqlalchemy import desc
from app.models.tecnico import Tecnico
from app.models.tecnico_comuna import TecnicoComuna
from app.models.comuna import Comuna
from app.models.servicio import Servicio
from app.models.tecnico_servicio import TecnicoServicio
from app.models.usuario import Usuario

from app.database import get_db
from app.dependencies import get_current_usuario, solo_admin, usuario_tiene_rol
from app.schemas.tecnico_schema import TecnicoCreate, TecnicoUpdate, TecnicoResponse
from app.services import tecnico_service
from app.services import audit_service
from app.services.resena_service import generar_resumen_reputacion

router = APIRouter(
    prefix="/tecnicos",
    tags=["Técnicos"]
)

@router.post("/", response_model=TecnicoResponse)
def crear_tecnico(
    tecnico: TecnicoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin),
):
    nuevo_tecnico = tecnico_service.crear_tecnico(db, tecnico)

    if not nuevo_tecnico:
        raise HTTPException(status_code=400, detail="El técnico ya existe")

    return nuevo_tecnico


@router.get("/", response_model=List[TecnicoResponse])
def listar_tecnicos(
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin),
):
    return tecnico_service.listar_tecnicos(db)


@router.get("/buscar")
def buscar_tecnicos_por_servicio_comuna(
    servicio_id: int,
    comuna_id: int,
    db: Session = Depends(get_db)
):
    tecnicos = db.query(Tecnico).join(
        TecnicoServicio,
        Tecnico.usuario_rut == TecnicoServicio.tecnico_usuario_rut
    ).join(
        TecnicoComuna,
        Tecnico.usuario_rut == TecnicoComuna.tecnico_usuario_rut
    ).filter(
        TecnicoServicio.servicio_id_servicio == servicio_id,
        TecnicoComuna.comuna_id_comuna == comuna_id,
        Tecnico.tecnico_verificado == True,
        Tecnico.estado_verificacion == "APROBADO",
    ).all()

    return tecnicos


def obtener_reputacion_tecnico(db: Session, rut: str):
    promedio = db.query(
        func.avg(Resena.calificacion)
    ).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Resena.resena_activa == "S"
    ).scalar()

    total = db.query(Resena).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Resena.resena_activa == "S"
    ).count()

    return {
        "promedio_calificacion": round(float(promedio), 1) if promedio else 0,
        "total_resenas": total
    }


def serializar_tecnico_publico(db: Session, tecnico: Tecnico):
    usuario = db.query(Usuario).filter(
        Usuario.rut == tecnico.usuario_rut
    ).first()

    servicios = db.query(Servicio.nombre_servicio).join(
        TecnicoServicio,
        Servicio.id_servicio == TecnicoServicio.servicio_id_servicio
    ).filter(
        TecnicoServicio.tecnico_usuario_rut == tecnico.usuario_rut
    ).all()

    comunas = db.query(Comuna.nombre_comuna).join(
        TecnicoComuna,
        Comuna.id_comuna == TecnicoComuna.comuna_id_comuna
    ).filter(
        TecnicoComuna.tecnico_usuario_rut == tecnico.usuario_rut
    ).all()

    reputacion = obtener_reputacion_tecnico(db, tecnico.usuario_rut)
    resenas = db.query(Resena).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == tecnico.usuario_rut,
        Resena.resena_activa == "S"
    ).all()

    return {
        "usuario_rut": tecnico.usuario_rut,
        "descripcion_perfil": tecnico.descripcion_perfil,
        "experiencia_anios": tecnico.experiencia_anios,
        "nivel_tecnico": tecnico.nivel_tecnico,
        "tecnico_verificado": tecnico.tecnico_verificado,
        "estado_verificacion": tecnico.estado_verificacion,
        "nombre_completo": usuario.nombre_completo if usuario else "Tecnico FixYa",
        "correo": usuario.correo if usuario else None,
        "telefono": usuario.telefono if usuario else None,
        "promedio_calificacion": reputacion["promedio_calificacion"],
        "total_resenas": reputacion["total_resenas"],
        "resumen_reputacion": generar_resumen_reputacion(resenas),
        "servicios": [servicio.nombre_servicio for servicio in servicios],
        "comunas": [comuna.nombre_comuna for comuna in comunas]
    }


@router.get("/top-rating")
def obtener_top_tecnicos(
    db: Session = Depends(get_db)
):
    resultados = db.query(
        Solicitud.tecnico_usuario_rut,
        func.avg(Resena.calificacion).label("promedio"),
        func.count(Resena.id_resena).label("total_resenas")
    ).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).join(
        Tecnico,
        Tecnico.usuario_rut == Solicitud.tecnico_usuario_rut
    ).filter(
        Resena.resena_activa == "S",
        Tecnico.tecnico_verificado == True,
        Tecnico.estado_verificacion == "APROBADO",
    ).group_by(
        Solicitud.tecnico_usuario_rut
    ).order_by(
        desc("promedio")
    ).limit(10).all()

    return [
        {
            "tecnico_usuario_rut": r.tecnico_usuario_rut,
            "promedio_calificacion": round(float(r.promedio), 1),
            "total_resenas": r.total_resenas
        }
        for r in resultados
    ]


@router.get("/publicos/perfiles")
def listar_perfiles_publicos_tecnicos(db: Session = Depends(get_db)):
    tecnicos = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == True,
        Tecnico.estado_verificacion == "APROBADO",
    ).all()

    return [
        serializar_tecnico_publico(db, tecnico)
        for tecnico in tecnicos
    ]


@router.get("/{rut}", response_model=TecnicoResponse)
def obtener_tecnico(
    rut: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin),
):
    tecnico = tecnico_service.obtener_tecnico(db, rut)

    if not tecnico:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")

    return tecnico


@router.put("/{rut}", response_model=TecnicoResponse)
def actualizar_tecnico(
    rut: str,
    tecnico: TecnicoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin),
):
    tecnico_actualizado = tecnico_service.actualizar_tecnico(db, rut, tecnico)

    if not tecnico_actualizado:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")

    return tecnico_actualizado


@router.delete("/{rut}")
def eliminar_tecnico(
    rut: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin),
):
    tecnico_previo = db.query(Tecnico).filter(Tecnico.usuario_rut == rut).first()
    estado_antes = tecnico_previo.estado_verificacion if tecnico_previo else None

    tecnico_eliminado = tecnico_service.eliminar_tecnico(db, rut)

    if not tecnico_eliminado:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")

    audit_service.registrar_auditoria(
        db,
        admin_rut=current_user.get("rut"),
        accion="ELIMINAR_TECNICO",
        entidad_tipo="TECNICO",
        entidad_id=rut,
        usuario_afectado_rut=rut,
        estado_antes=estado_antes,
        estado_despues="ELIMINADO",
        ip=audit_service.obtener_ip(request),
    )

    return {"mensaje": "Técnico eliminado correctamente"}
@router.get("/{rut}/rating")
def obtener_rating_tecnico(
    rut: str,
    db: Session = Depends(get_db)
):
    promedio = db.query(
        func.avg(Resena.calificacion)
    ).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Resena.resena_activa == "S"
    ).scalar()

    total = db.query(Resena).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Resena.resena_activa == "S"
    ).count()

    return {
        "tecnico_usuario_rut": rut,
        "promedio_calificacion": round(float(promedio), 1) if promedio else 0,
        "total_resenas": total
    }
@router.get("/{rut}/perfil")
def obtener_perfil_tecnico(
    rut: str,
    db: Session = Depends(get_db)
):
    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == rut
    ).first()

    if not tecnico:
        raise HTTPException(
            status_code=404,
            detail="Técnico no encontrado"
        )

    promedio = db.query(
        func.avg(Resena.calificacion)
    ).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Resena.resena_activa == "S"
    ).scalar()

    total = db.query(Resena).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Resena.resena_activa == "S"
    ).count()

    return {
        "usuario_rut": tecnico.usuario_rut,
        "descripcion_perfil": tecnico.descripcion_perfil,
        "experiencia_anios": tecnico.experiencia_anios,
        "nivel_tecnico": tecnico.nivel_tecnico,
        "tecnico_verificado": tecnico.tecnico_verificado,
        "promedio_calificacion": round(float(promedio), 1) if promedio else 0,
        "total_resenas": total
    }
@router.post("/{rut}/comunas/{id_comuna}")
def asignar_comuna_tecnico(
    rut: str,
    id_comuna: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin),
):
    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == rut
    ).first()

    if not tecnico:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")

    comuna = db.query(Comuna).filter(
        Comuna.id_comuna == id_comuna
    ).first()

    if not comuna:
        raise HTTPException(status_code=404, detail="Comuna no encontrada")

    existe = db.query(TecnicoComuna).filter(
        TecnicoComuna.tecnico_usuario_rut == rut,
        TecnicoComuna.comuna_id_comuna == id_comuna
    ).first()

    if existe:
        raise HTTPException(status_code=400, detail="El técnico ya atiende esta comuna")

    nueva = TecnicoComuna(
        tecnico_usuario_rut=rut,
        comuna_id_comuna=id_comuna
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return {
        "mensaje": "Comuna asignada correctamente",
        "tecnico_usuario_rut": rut,
        "comuna_id_comuna": id_comuna
    }  
@router.get("/{rut}/comunas")
def listar_comunas_tecnico(
    rut: str,
    db: Session = Depends(get_db)
):
    comunas = db.query(Comuna).join(
        TecnicoComuna,
        Comuna.id_comuna == TecnicoComuna.comuna_id_comuna
    ).filter(
        TecnicoComuna.tecnico_usuario_rut == rut
    ).all()

    return comunas

@router.delete("/{rut}/comunas/{id_comuna}")
def eliminar_comuna_tecnico(
    rut: str,
    id_comuna: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin),
):
    tecnico_comuna = db.query(TecnicoComuna).filter(
        TecnicoComuna.tecnico_usuario_rut == rut,
        TecnicoComuna.comuna_id_comuna == id_comuna
    ).first()

    if not tecnico_comuna:
        raise HTTPException(
            status_code=404,
            detail="Comuna no asignada al técnico"
        )

    db.delete(tecnico_comuna)
    db.commit()

    return {
        "mensaje": "Comuna eliminada del técnico correctamente",
        "tecnico_usuario_rut": rut,
        "comuna_id_comuna": id_comuna
    }
    
@router.get("/{rut}/dashboard")
def obtener_dashboard_tecnico(
    rut: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    es_admin = usuario_tiene_rol(db, usuario_actual.rut, "ADMIN")

    if not es_admin and not usuario_tiene_rol(db, usuario_actual.rut, "TECNICO"):
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para ver dashboard tecnico"
        )

    if not es_admin and usuario_actual.rut != rut:
        raise HTTPException(
            status_code=403,
            detail="No puedes ver el dashboard de otro tecnico"
        )

    solicitudes_asignadas = db.query(Solicitud).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Solicitud.estado_trabajo == "ASIGNADO"
    ).count()

    solicitudes_en_proceso = db.query(Solicitud).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Solicitud.estado_trabajo == "EN_PROCESO"
    ).count()

    solicitudes_finalizadas = db.query(Solicitud).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Solicitud.estado_trabajo == "FINALIZADO"
    ).count()

    ingresos_totales = db.query(
        func.sum(Solicitud.costo_final)
    ).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Solicitud.estado_trabajo == "FINALIZADO"
    ).scalar()

    promedio = db.query(
        func.avg(Resena.calificacion)
    ).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Resena.resena_activa == "S"
    ).scalar()

    total_resenas = db.query(Resena).join(
        Solicitud,
        Solicitud.id_solicitud == Resena.solicitud_id_solicitud
    ).filter(
        Solicitud.tecnico_usuario_rut == rut,
        Resena.resena_activa == "S"
    ).count()

    return {
        "tecnico_usuario_rut": rut,
        "solicitudes_asignadas": solicitudes_asignadas,
        "solicitudes_en_proceso": solicitudes_en_proceso,
        "solicitudes_finalizadas": solicitudes_finalizadas,
        "ingresos_totales": float(ingresos_totales) if ingresos_totales else 0,
        "promedio_calificacion": round(float(promedio), 1) if promedio else 0,
        "total_resenas": total_resenas
    }
