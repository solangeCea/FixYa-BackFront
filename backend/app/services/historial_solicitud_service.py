from sqlalchemy.orm import Session
from app.models.historial_solicitud import HistorialSolicitud
from app.models.usuario import Usuario
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


def listar_timeline_por_solicitud(db: Session, id_solicitud: int):
    """Línea de tiempo enriquecida de una solicitud, en orden cronológico
    (del evento más antiguo al más reciente) y con el nombre y rol del actor
    resueltos en un solo lote (evita N+1)."""
    eventos = (
        db.query(HistorialSolicitud)
        .filter(HistorialSolicitud.solicitud_id_solicitud == id_solicitud)
        .order_by(
            HistorialSolicitud.fecha_historial.asc(),
            HistorialSolicitud.id_historial.asc(),
        )
        .all()
    )

    ruts = {e.usuario_rut for e in eventos if e.usuario_rut}
    usuarios = {}
    if ruts:
        for usuario in db.query(Usuario).filter(Usuario.rut.in_(ruts)).all():
            usuarios[usuario.rut] = usuario

    resultado = []
    for evento in eventos:
        usuario = usuarios.get(evento.usuario_rut)
        resultado.append(
            {
                "id_historial": evento.id_historial,
                "fecha_historial": evento.fecha_historial,
                "estado": evento.estado,
                "motivo": evento.motivo,
                "solicitud_id_solicitud": evento.solicitud_id_solicitud,
                "usuario_rut": evento.usuario_rut,
                "usuario_nombre": usuario.nombre_completo if usuario else None,
                "usuario_rol": usuario.tipo_usuario.value if usuario else None,
            }
        )

    return resultado