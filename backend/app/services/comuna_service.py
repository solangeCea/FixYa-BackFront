from sqlalchemy.orm import Session

from app.models.comuna import Comuna


def listar_comunas(db: Session):
    return db.query(Comuna).order_by(Comuna.nombre_comuna.asc()).all()


def listar_comunas_por_region(db: Session, id_region: int):
    return db.query(Comuna).filter(
        Comuna.region_id_region == id_region
    ).order_by(Comuna.nombre_comuna.asc()).all()