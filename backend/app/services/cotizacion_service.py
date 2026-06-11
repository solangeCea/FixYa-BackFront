from sqlalchemy.orm import Session
from datetime import datetime

from app.models.cotizacion import Cotizacion
from app.models.solicitud import Solicitud
from app.schemas.cotizacion_schema import CotizacionCreate, CotizacionUpdate
from app.pdf.cotizacion_pdf import generar_pdf_cotizacion


def crear_cotizacion(db: Session, data: CotizacionCreate):
    nueva = Cotizacion(
        solicitud_id_solicitud=data.solicitud_id_solicitud,
        tecnico_usuario_rut=data.tecnico_usuario_rut,
        monto_estimado=data.monto_estimado,
        mensaje_cotizacion=data.mensaje_cotizacion,
        fecha_vigencia=data.fecha_vigencia,
        estado_cotizacion="ENVIADA"
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == data.solicitud_id_solicitud
    ).first()

    if solicitud:
        pdf_url = generar_pdf_cotizacion(nueva, solicitud)
        nueva.archivo_pdf_url = pdf_url

        db.commit()
        db.refresh(nueva)

    return nueva


def listar_cotizaciones(db: Session):
    return db.query(Cotizacion).all()


def obtener_cotizacion(db: Session, id_cotizacion: int):
    return db.query(Cotizacion).filter(
        Cotizacion.id_cotizacion == id_cotizacion
    ).first()


def listar_por_solicitud(db: Session, id_solicitud: int):
    return db.query(Cotizacion).filter(
        Cotizacion.solicitud_id_solicitud == id_solicitud
    ).all()


def actualizar_cotizacion(db: Session, id_cotizacion: int, data: CotizacionUpdate):
    cotizacion = obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        return None

    datos = data.model_dump(exclude_unset=True)

    for campo, valor in datos.items():
        setattr(cotizacion, campo, valor)

    db.commit()
    db.refresh(cotizacion)
    return cotizacion


def aceptar_cotizacion(db: Session, id_cotizacion: int):
    cotizacion = obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        return None

    cotizacion.estado_cotizacion = "ACEPTADA"
    cotizacion.fecha_aceptacion = datetime.now()

    solicitud = db.query(Solicitud).filter(
        Solicitud.id_solicitud == cotizacion.solicitud_id_solicitud
    ).first()

    if solicitud:
        solicitud.tecnico_usuario_rut = cotizacion.tecnico_usuario_rut
        solicitud.estado_trabajo = "ASIGNADO"
        solicitud.fecha_asignacion = datetime.now()

    db.commit()
    db.refresh(cotizacion)
    return cotizacion


def anular_cotizacion(db: Session, id_cotizacion: int, motivo: str):
    cotizacion = obtener_cotizacion(db, id_cotizacion)

    if not cotizacion:
        return None

    cotizacion.estado_cotizacion = "ANULADA"
    cotizacion.motivo_anulacion = motivo

    db.commit()
    db.refresh(cotizacion)
    return cotizacion