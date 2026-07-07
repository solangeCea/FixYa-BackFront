import os

from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.models.documento_tecnico import DocumentoTecnico
from app.models.tecnico import Tecnico
from app.models.usuario import Usuario
from app.schemas.documento_tecnico_schema import DocumentoTecnicoCreate
from app.dependencies import usuario_tiene_rol


def crear_documento_tecnico(db: Session, documento: DocumentoTecnicoCreate):
    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == documento.tecnico_usuario_rut
    ).first()

    if not tecnico:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")

    nuevo_documento = DocumentoTecnico(
        tecnico_usuario_rut=documento.tecnico_usuario_rut,
        tipo_documento=documento.tipo_documento,
        nombre_archivo=documento.nombre_archivo,
        archivo_url=documento.archivo_url,
        fecha_subida=datetime.utcnow(),
        documento_aprobado=False,
        estado_documento="PENDIENTE",
        motivo_rechazo=None,
        fecha_aprobacion=None,
        usuario_rut=None
    )

    db.add(nuevo_documento)
    db.commit()
    db.refresh(nuevo_documento)

    return nuevo_documento


def listar_documentos_tecnicos(db: Session):
    return db.query(DocumentoTecnico).all()


def obtener_documentos_por_tecnico(db: Session, rut: str):
    return db.query(DocumentoTecnico).filter(
        DocumentoTecnico.tecnico_usuario_rut == rut
    ).all()


def aprobar_documento_tecnico(db: Session, id_documento: int, usuario_rut: str):
    documento = db.query(DocumentoTecnico).filter(
        DocumentoTecnico.id_documento == id_documento
    ).first()

    if not documento:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    admin = db.query(Usuario).filter(Usuario.rut == usuario_rut).first()

    if not admin or not usuario_tiene_rol(db, usuario_rut, "ADMIN"):
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede aprobar documentos"
        )

    documento.documento_aprobado = True
    documento.estado_documento = "APROBADO"
    documento.motivo_rechazo = None
    documento.fecha_aprobacion = datetime.utcnow()
    documento.usuario_rut = usuario_rut

    db.commit()
    db.refresh(documento)

    verificar_tecnico_automaticamente(
    db,
    documento.tecnico_usuario_rut
)

    return documento


def rechazar_documento_tecnico(
    db: Session,
    id_documento: int,
    usuario_rut: str,
    motivo_rechazo: str,
):
    documento = db.query(DocumentoTecnico).filter(
        DocumentoTecnico.id_documento == id_documento
    ).first()

    if not documento:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    admin = db.query(Usuario).filter(Usuario.rut == usuario_rut).first()

    if not admin or not usuario_tiene_rol(db, usuario_rut, "ADMIN"):
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede rechazar documentos"
        )

    motivo = (motivo_rechazo or "").strip()
    if not motivo:
        raise HTTPException(
            status_code=400,
            detail="Debes indicar el motivo del rechazo"
        )

    documento.documento_aprobado = False
    documento.estado_documento = "RECHAZADO"
    documento.motivo_rechazo = motivo[:500]
    documento.fecha_aprobacion = None
    documento.usuario_rut = usuario_rut

    db.commit()
    db.refresh(documento)

    return documento


def eliminar_documento_tecnico(db: Session, id_documento: int, tecnico_rut: str):
    """El técnico dueño elimina uno de sus documentos (para reemplazarlo o
    reenviarlo). No se permite borrar un documento ya APROBADO para no
    romper la verificación del técnico."""
    documento = db.query(DocumentoTecnico).filter(
        DocumentoTecnico.id_documento == id_documento
    ).first()

    if not documento:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    if documento.tecnico_usuario_rut != tecnico_rut:
        raise HTTPException(
            status_code=403,
            detail="No puedes eliminar documentos de otro tecnico"
        )

    if documento.estado_documento == "APROBADO" or documento.documento_aprobado:
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminar un documento ya aprobado"
        )

    # Borra el archivo físico (best-effort): la URL es /uploads/<sub>/<archivo>.
    ruta_relativa = (documento.archivo_url or "").lstrip("/")
    if ruta_relativa.startswith("uploads/"):
        try:
            if os.path.isfile(ruta_relativa):
                os.remove(ruta_relativa)
        except OSError:
            # Si el archivo no existe o no se puede borrar, igual quitamos la fila.
            pass

    db.delete(documento)
    db.commit()

    return {"mensaje": "Documento eliminado correctamente"}


def crear_documento_tecnico_archivo(
    db: Session,
    tecnico_usuario_rut: str,
    tipo_documento: str,
    nombre_archivo: str,
    archivo_url: str
):
    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == tecnico_usuario_rut
    ).first()

    if not tecnico:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")

    nuevo_documento = DocumentoTecnico(
        tecnico_usuario_rut=tecnico_usuario_rut,
        tipo_documento=tipo_documento,
        nombre_archivo=nombre_archivo,
        archivo_url=archivo_url,
        fecha_subida=datetime.utcnow(),
        documento_aprobado=False,
        estado_documento="PENDIENTE",
        motivo_rechazo=None,
        fecha_aprobacion=None,
        usuario_rut=None
    )

    db.add(nuevo_documento)
    db.commit()
    db.refresh(nuevo_documento)

    return nuevo_documento

def verificar_tecnico_automaticamente(db: Session, tecnico_rut: str):
    """Verifica al técnico automáticamente cuando tiene al menos un documento y
    TODOS sus documentos están aprobados.

    Antes exigía tipos fijos (CERTIFICADO_TECNICO y ANTECEDENTES), pero el registro
    sube un único documento (CERTIFICADO_TECNICO), por lo que la verificación nunca
    se disparaba al aprobar el documento. Ahora se basa en el estado real de los
    documentos subidos.
    """
    documentos = db.query(DocumentoTecnico).filter(
        DocumentoTecnico.tecnico_usuario_rut == tecnico_rut
    ).all()

    total = len(documentos)
    aprobados = sum(1 for doc in documentos if doc.documento_aprobado)
    cumple_requisitos = total > 0 and aprobados == total

    print(
        f"[verificar_tecnico_automaticamente] tecnico={tecnico_rut} "
        f"documentos={total} aprobados={aprobados} -> verifica={cumple_requisitos}"
    )

    if cumple_requisitos:
        tecnico = db.query(Tecnico).filter(
            Tecnico.usuario_rut == tecnico_rut
        ).first()

        if tecnico:
            tecnico.tecnico_verificado = True
            tecnico.estado_verificacion = "APROBADO"
            tecnico.fecha_revision = datetime.utcnow()
            db.commit()
            print(
                f"[verificar_tecnico_automaticamente] tecnico={tecnico_rut} "
                f"marcado como APROBADO / verificado=True"
            )
            
def listar_tecnicos_pendientes_verificacion(db: Session):
    return db.query(Tecnico).filter(
        Tecnico.estado_verificacion != "APROBADO"
    ).all()
