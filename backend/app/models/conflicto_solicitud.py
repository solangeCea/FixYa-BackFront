from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class ConflictoSolicitud(Base):
    """Reporte de conflicto levantado DURANTE el trabajo por el cliente o el
    técnico (trabajo deficiente, cobro indebido, daños, no se presentó, etc.).

    Distinto de `reporte_solicitud`, que es un reporte del técnico sobre una
    solicitud sospechosa antes de tomarla. Aquí ambas partes pueden reportar y
    se admite evidencia (fotos/archivos) como respaldo.
    """

    __tablename__ = "conflicto_solicitud"

    id_conflicto = Column(Integer, primary_key=True, index=True)
    solicitud_id_solicitud = Column(
        Integer,
        ForeignKey("solicitud.id_solicitud", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Quién reporta y con qué rol (snapshot legible aunque cambie después).
    reportante_rut = Column(
        String(12), ForeignKey("usuario.rut"), nullable=False, index=True
    )
    reportante_rol = Column(String(10), nullable=False)  # CLIENTE / TECNICO

    tipo = Column(String(40), nullable=False)
    descripcion = Column(String(1000), nullable=False)

    estado = Column(String(15), nullable=False, default="PENDIENTE", index=True)

    fecha_reporte = Column(DateTime, server_default=func.now(), nullable=False)
    fecha_revision = Column(DateTime, nullable=True)
    admin_rut_resuelve = Column(String(12), ForeignKey("usuario.rut"), nullable=True)
    observacion_admin = Column(String(1000), nullable=True)

    evidencias = relationship(
        "ConflictoEvidencia",
        back_populates="conflicto",
        cascade="all, delete-orphan",
        order_by="ConflictoEvidencia.id_evidencia",
    )


class ConflictoEvidencia(Base):
    """Archivo de evidencia (foto/PDF) asociado a un conflicto. Se almacena vía
    storage_service (R2 en prod, disco local en dev)."""

    __tablename__ = "conflicto_evidencia"

    id_evidencia = Column(Integer, primary_key=True, index=True)
    conflicto_id = Column(
        Integer,
        ForeignKey("conflicto_solicitud.id_conflicto", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre_archivo = Column(String(200), nullable=False)
    archivo_url = Column(String(300), nullable=False)
    fecha_subida = Column(DateTime, server_default=func.now(), nullable=False)

    conflicto = relationship("ConflictoSolicitud", back_populates="evidencias")
