from sqlalchemy.orm import Session
from app.models.historial_solicitud import HistorialSolicitud
from app.schemas.historial_solicitud_schema import HistorialCreate

def crear_historial(db: Session, data: HistorialCreate):
    nuevo = HistorialSolicitud(
        motivo=data.motivo,
        estado=data.estado,
        solicitud_id_solicitud=data.solicitud_id_solicitud,
        usuario_rut=data.usuario_rut
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo

def listar_historial(db: Session):
    return db.query(HistorialSolicitud).all()

def listar_por_solicitud(db: Session, id_solicitud: int):
    return db.query(HistorialSolicitud).filter(
        HistorialSolicitud.solicitud_id_solicitud == id_solicitud
    ).order_by(HistorialSolicitud.fecha_historial.desc()).all()