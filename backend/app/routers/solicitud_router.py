from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.dependencies import solo_admin, solo_tecnico, solo_cliente

from app.database import get_db
from app.services import solicitud_service

from app.models.solicitud import Solicitud
from app.models.historial_solicitud import HistorialSolicitud
from app.models.tecnico import Tecnico

from app.schemas.solicitud_schema import (
    SolicitudCreate,
    SolicitudUpdate,
    SolicitudResponse,
    SolicitudEstadoUpdate,
    SolicitudFinalizar
)


router = APIRouter(
    prefix="/solicitudes",
    tags=["Solicitudes"]
)


@router.post("/", response_model=SolicitudResponse)
def crear_solicitud(
    solicitud: SolicitudCreate,
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_cliente)
):
    return solicitud_service.crear_solicitud(db, solicitud)

@router.get("/", response_model=List[SolicitudResponse])
def listar_solicitudes(db: Session = Depends(get_db)):
    return solicitud_service.listar_solicitudes(db)


@router.get("/cliente/{rut}", response_model=List[SolicitudResponse])
def obtener_solicitudes_cliente(
    rut: str,
    db: Session = Depends(get_db)
):
    return db.query(Solicitud).filter(
        Solicitud.usuario_rut == rut
    ).all()


@router.get("/tecnico/{rut}", response_model=List[SolicitudResponse])
def obtener_solicitudes_tecnico(
    rut: str,
    db: Session = Depends(get_db)
):
    return db.query(Solicitud).filter(
        Solicitud.tecnico_usuario_rut == rut
    ).all()


@router.put("/{id_solicitud}/estado", response_model=SolicitudResponse)
def cambiar_estado_solicitud(
    id_solicitud: int,
    data: SolicitudEstadoUpdate,
    db: Session = Depends(get_db)
):
    solicitud = solicitud_service.cambiar_estado_solicitud(db, id_solicitud, data)

    if solicitud is None:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud == "ESTADO_INVALIDO":
        raise HTTPException(status_code=400, detail="Estado de trabajo inválido")

    return solicitud


@router.put("/{id_solicitud}/asignar-tecnico/{rut_tecnico}")
def asignar_tecnico_solicitud(
    id_solicitud: int,
    rut_tecnico: str,
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_admin)
):
    
    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == rut_tecnico
    ).first()

    if not tecnico:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")

    if solicitud.tecnico_usuario_rut is not None:
        raise HTTPException(status_code=400, detail="La solicitud ya tiene un técnico asignado")

    solicitud.tecnico_usuario_rut = rut_tecnico
    solicitud.estado_trabajo = "ASIGNADO"
    solicitud.fecha_asignacion = datetime.utcnow()

    historial = HistorialSolicitud(
        solicitud_id_solicitud=solicitud.id_solicitud,
        usuario_rut=solicitud.usuario_rut,
        estado="ASIGNADO",
        motivo=f"Técnico asignado: {rut_tecnico}"
    )

    db.add(historial)
    db.commit()
    db.refresh(solicitud)

    return {
        "mensaje": "Técnico asignado correctamente",
        "id_solicitud": solicitud.id_solicitud,
        "tecnico_usuario_rut": solicitud.tecnico_usuario_rut,
        "estado": solicitud.estado_trabajo
    }


@router.put("/{id_solicitud}/iniciar")
def iniciar_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_tecnico)
):
    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if not solicitud.tecnico_usuario_rut:
        raise HTTPException(status_code=400, detail="La solicitud no tiene técnico asignado")

    if solicitud.estado_trabajo != "ASIGNADO":
        raise HTTPException(status_code=400, detail="Solo se puede iniciar una solicitud asignada")

    solicitud.estado_trabajo = "EN_PROCESO"
    solicitud.fecha_inicio = datetime.utcnow()

    historial = HistorialSolicitud(
        solicitud_id_solicitud=solicitud.id_solicitud,
        usuario_rut=solicitud.usuario_rut,
        estado="EN_PROCESO",
        motivo="Trabajo iniciado por el técnico"
    )

    db.add(historial)
    db.commit()
    db.refresh(solicitud)

    return {
        "mensaje": "Solicitud iniciada correctamente",
        "id_solicitud": solicitud.id_solicitud,
        "estado": solicitud.estado_trabajo
    }


@router.put("/{id_solicitud}/finalizar")
def finalizar_solicitud(
    id_solicitud: int,
    data: SolicitudFinalizar,
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_tecnico)
):
    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud.estado_trabajo != "EN_PROCESO":
        raise HTTPException(status_code=400, detail="Solo se puede finalizar una solicitud en proceso")

    solicitud.estado_trabajo = "FINALIZADO"
    solicitud.fecha_real = datetime.utcnow()
    solicitud.costo_final = data.costo_final

    historial = HistorialSolicitud(
        solicitud_id_solicitud=solicitud.id_solicitud,
        usuario_rut=solicitud.usuario_rut,
        estado="FINALIZADO",
        motivo=f"Solicitud finalizada con costo final: {data.costo_final}"
    )

    db.add(historial)
    db.commit()
    db.refresh(solicitud)

    return {
        "mensaje": "Solicitud finalizada correctamente",
        "id_solicitud": solicitud.id_solicitud,
        "estado": solicitud.estado_trabajo,
        "costo_final": solicitud.costo_final
    }


@router.put("/{id_solicitud}/cancelar")
def cancelar_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_cliente)
):
    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud.estado_trabajo == "FINALIZADO":
        raise HTTPException(status_code=400, detail="No se puede cancelar una solicitud finalizada")

    solicitud.estado_trabajo = "CANCELADO"
    solicitud.solicitud_activa = False

    historial = HistorialSolicitud(
        solicitud_id_solicitud=solicitud.id_solicitud,
        usuario_rut=solicitud.usuario_rut,
        estado="CANCELADO",
        motivo="Solicitud cancelada"
    )

    db.add(historial)
    db.commit()
    db.refresh(solicitud)

    return {
        "mensaje": "Solicitud cancelada correctamente",
        "id_solicitud": solicitud.id_solicitud,
        "estado": solicitud.estado_trabajo
    }


@router.get("/{id_solicitud}", response_model=SolicitudResponse)
def obtener_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db)
):
    solicitud = solicitud_service.obtener_solicitud(db, id_solicitud)

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    return solicitud


@router.put("/{id_solicitud}", response_model=SolicitudResponse)
def actualizar_solicitud(
    id_solicitud: int,
    solicitud: SolicitudUpdate,
    db: Session = Depends(get_db)
):
    solicitud_actualizada = solicitud_service.actualizar_solicitud(
        db,
        id_solicitud,
        solicitud
    )

    if not solicitud_actualizada:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    return solicitud_actualizada


@router.delete("/{id_solicitud}")
def eliminar_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db)
):
    solicitud_eliminada = solicitud_service.eliminar_solicitud(db, id_solicitud)

    if not solicitud_eliminada:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    return {"mensaje": "Solicitud desactivada correctamente"}