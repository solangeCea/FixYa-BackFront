from sqlalchemy.orm import Session

from app.models.region import Region


def listar_regiones(db: Session):
    return db.query(Region).order_by(Region.id_region.asc()).all()