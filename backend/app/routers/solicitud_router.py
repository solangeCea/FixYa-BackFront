from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_usuario, solo_admin
from app.models.historial_solicitud import HistorialSolicitud
from app.models.solicitud import Solicitud
from app.models.tecnico import Tecnico
from app.schemas.reporte_solicitud_schema import (
    ReporteSolicitudAdminResponse,
    ReporteSolicitudCreate,
    ReporteSolicitudResolver,
    ReporteSolicitudResponse,
    SolicitudDescartadaResponse,
)
from app.schemas.solicitud_schema import (
    SolicitudCreate,
    SolicitudEstadoUpdate,
    SolicitudFinalizar,
    SolicitudResponse,
    SolicitudUpdate,
)
from app.services import solicitud_service


router = APIRouter(
    prefix="/solicitudes",
    tags=["Solicitudes"]
)


def _require_role(usuario, rol: str):
    if usuario.tipo_usuario.value != rol:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para realizar esta accion"
        )


@router.post("/", response_model=SolicitudResponse)
def crear_solicitud(
    solicitud: SolicitudCreate,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    _require_role(usuario_actual, "CLIENTE")
    solicitud.usuario_rut = usuario_actual.rut
    return solicitud_service.crear_solicitud(db, solicitud)


@router.get("/", response_model=List[SolicitudResponse])
def listar_solicitudes(
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_admin),
):
    return solicitud_service.listar_solicitudes(db)


@router.get("/tecnico/disponibles", response_model=List[SolicitudResponse])
def obtener_solicitudes_disponibles_tecnico(
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    _require_role(usuario_actual, "TECNICO")
    return solicitud_service.listar_solicitudes_disponibles_tecnico(
        db,
        usuario_actual.rut,
    )


@router.get("/cliente/{rut}", response_model=List[SolicitudResponse])
def obtener_solicitudes_cliente(
    rut: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    if usuario_actual.tipo_usuario.value == "CLIENTE" and usuario_actual.rut != rut:
        raise HTTPException(
            status_code=403,
            detail="No puedes ver solicitudes de otro cliente"
        )

    return db.query(Solicitud).filter(
        Solicitud.usuario_rut == rut
    ).all()


@router.get("/tecnico/{rut}", response_model=List[SolicitudResponse])
def obtener_solicitudes_tecnico(
    rut: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    if usuario_actual.tipo_usuario.value == "TECNICO" and usuario_actual.rut != rut:
        raise HTTPException(
            status_code=403,
            detail="No puedes ver trabajos de otro tecnico"
        )

    return db.query(Solicitud).filter(
        Solicitud.tecnico_usuario_rut == rut
    ).all()


@router.post(
    "/{id_solicitud}/descartar",
    response_model=SolicitudDescartadaResponse,
)
def descartar_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    _require_role(usuario_actual, "TECNICO")
    return solicitud_service.descartar_solicitud_tecnico(
        db,
        id_solicitud,
        usuario_actual.rut,
    )


@router.post(
    "/{id_solicitud}/reportar",
    response_model=ReporteSolicitudResponse,
)
def reportar_solicitud(
    id_solicitud: int,
    data: ReporteSolicitudCreate,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    _require_role(usuario_actual, "TECNICO")
    return solicitud_service.reportar_solicitud_tecnico(
        db,
        id_solicitud,
        usuario_actual.rut,
        data,
    )


@router.get(
    "/reportes",
    response_model=List[ReporteSolicitudAdminResponse],
)
def listar_reportes_solicitud(
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_admin),
):
    return solicitud_service.listar_reportes_solicitud(db)


@router.put(
    "/reportes/{id_reporte}/resolver",
    response_model=ReporteSolicitudResponse,
)
def resolver_reporte_solicitud(
    id_reporte: int,
    data: ReporteSolicitudResolver,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    _require_role(usuario_actual, "ADMIN")
    return solicitud_service.resolver_reporte_solicitud(
        db,
        id_reporte,
        usuario_actual.rut,
        data,
    )


@router.put("/{id_solicitud}/estado", response_model=SolicitudResponse)
def cambiar_estado_solicitud(
    id_solicitud: int,
    data: SolicitudEstadoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(solo_admin),
):
    solicitud = solicitud_service.cambiar_estado_solicitud(db, id_solicitud, data)

    if solicitud is None:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud == "ESTADO_INVALIDO":
        raise HTTPException(status_code=400, detail="Estado de trabajo invalido")

    return solicitud


@router.put("/{id_solicitud}/asignar-tecnico/{rut_tecnico}")
def asignar_tecnico_solicitud(
    id_solicitud: int,
    rut_tecnico: str,
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(solo_admin),
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
        raise HTTPException(status_code=404, detail="Tecnico no encontrado")

    if solicitud.tecnico_usuario_rut is not None:
        raise HTTPException(
            status_code=400,
            detail="La solicitud ya tiene un tecnico asignado"
        )

    solicitud.tecnico_usuario_rut = rut_tecnico
    solicitud.estado_trabajo = "ASIGNADO"
    solicitud.fecha_asignacion = datetime.utcnow()

    historial = HistorialSolicitud(
        solicitud_id_solicitud=solicitud.id_solicitud,
        usuario_rut=solicitud.usuario_rut,
        estado="ASIGNADO",
        motivo=f"Tecnico asignado manualmente: {rut_tecnico}",
    )

    db.add(historial)
    db.commit()
    db.refresh(solicitud)

    return {
        "mensaje": "Tecnico asignado correctamente",
        "id_solicitud": solicitud.id_solicitud,
        "tecnico_usuario_rut": solicitud.tecnico_usuario_rut,
        "estado": solicitud.estado_trabajo,
    }


@router.put("/{id_solicitud}/iniciar")
def iniciar_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    _require_role(usuario_actual, "TECNICO")

    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if not solicitud.tecnico_usuario_rut:
        raise HTTPException(
            status_code=400,
            detail="La solicitud no tiene tecnico asignado"
        )

    if solicitud.tecnico_usuario_rut != usuario_actual.rut:
        raise HTTPException(
            status_code=403,
            detail="No puedes iniciar un trabajo asignado a otro tecnico"
        )

    if solicitud.estado_trabajo != "ASIGNADO":
        raise HTTPException(
            status_code=400,
            detail="Solo se puede iniciar una solicitud asignada"
        )

    solicitud.estado_trabajo = "EN_PROCESO"
    solicitud.fecha_inicio = datetime.utcnow()

    historial = HistorialSolicitud(
        solicitud_id_solicitud=solicitud.id_solicitud,
        usuario_rut=usuario_actual.rut,
        estado="EN_PROCESO",
        motivo="Trabajo iniciado por el tecnico",
    )

    db.add(historial)
    db.commit()
    db.refresh(solicitud)

    return {
        "mensaje": "Solicitud iniciada correctamente",
        "id_solicitud": solicitud.id_solicitud,
        "estado": solicitud.estado_trabajo,
    }


@router.put("/{id_solicitud}/finalizar")
def finalizar_solicitud(
    id_solicitud: int,
    data: SolicitudFinalizar,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    _require_role(usuario_actual, "TECNICO")

    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud.tecnico_usuario_rut != usuario_actual.rut:
        raise HTTPException(
            status_code=403,
            detail="No puedes finalizar un trabajo asignado a otro tecnico"
        )

    if solicitud.estado_trabajo != "EN_PROCESO":
        raise HTTPException(
            status_code=400,
            detail="Solo se puede finalizar una solicitud en proceso"
        )

    solicitud.estado_trabajo = "FINALIZADO"
    solicitud.fecha_real = datetime.utcnow()
    solicitud.costo_final = data.costo_final

    historial = HistorialSolicitud(
        solicitud_id_solicitud=solicitud.id_solicitud,
        usuario_rut=usuario_actual.rut,
        estado="FINALIZADO",
        motivo=f"Solicitud finalizada con costo final: {data.costo_final}",
    )

    db.add(historial)
    db.commit()
    db.refresh(solicitud)

    return {
        "mensaje": "Solicitud finalizada correctamente",
        "id_solicitud": solicitud.id_solicitud,
        "estado": solicitud.estado_trabajo,
        "costo_final": solicitud.costo_final,
    }


@router.put("/{id_solicitud}/cancelar")
def cancelar_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_usuario),
):
    _require_role(usuario_actual, "CLIENTE")

    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == id_solicitud
    ).first()

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud.usuario_rut != usuario_actual.rut:
        raise HTTPException(
            status_code=403,
            detail="No puedes cancelar una solicitud de otro cliente"
        )

    if solicitud.estado_trabajo == "FINALIZADO":
        raise HTTPException(
            status_code=400,
            detail="No se puede cancelar una solicitud finalizada"
        )

    solicitud.estado_trabajo = "CANCELADO"
    solicitud.solicitud_activa = False

    historial = HistorialSolicitud(
        solicitud_id_solicitud=solicitud.id_solicitud,
        usuario_rut=usuario_actual.rut,
        estado="CANCELADO",
        motivo="Solicitud cancelada",
    )

    db.add(historial)
    db.commit()
    db.refresh(solicitud)

    return {
        "mensaje": "Solicitud cancelada correctamente",
        "id_solicitud": solicitud.id_solicitud,
        "estado": solicitud.estado_trabajo,
    }


@router.get("/{id_solicitud}", response_model=SolicitudResponse)
def obtener_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
):
    solicitud = solicitud_service.obtener_solicitud(db, id_solicitud)

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    return solicitud


@router.put("/{id_solicitud}", response_model=SolicitudResponse)
def actualizar_solicitud(
    id_solicitud: int,
    solicitud: SolicitudUpdate,
    db: Session = Depends(get_db),
):
    solicitud_actualizada = solicitud_service.actualizar_solicitud(
        db,
        id_solicitud,
        solicitud,
    )

    if not solicitud_actualizada:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    return solicitud_actualizada


@router.delete("/{id_solicitud}")
def eliminar_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
):
    solicitud_eliminada = solicitud_service.eliminar_solicitud(db, id_solicitud)

    if not solicitud_eliminada:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    return {"mensaje": "Solicitud desactivada correctamente"}
