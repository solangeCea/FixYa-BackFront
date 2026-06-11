from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.models.documento_tecnico import DocumentoTecnico
from app.models.tecnico import Tecnico
from app.models.usuario import Usuario
from app.schemas.documento_tecnico_schema import DocumentoTecnicoCreate


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

    admin = db.query(Usuario).filter(
        Usuario.rut == usuario_rut,
        Usuario.tipo_usuario == "ADMIN"
    ).first()

    if not admin:
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede aprobar documentos"
        )

    documento.documento_aprobado = True
    documento.fecha_aprobacion = datetime.utcnow()
    documento.usuario_rut = usuario_rut

    db.commit()
    db.refresh(documento)

    verificar_tecnico_automaticamente(
    db,
    documento.tecnico_usuario_rut
)

    return documento


def rechazar_documento_tecnico(db: Session, id_documento: int, usuario_rut: str):
    documento = db.query(DocumentoTecnico).filter(
        DocumentoTecnico.id_documento == id_documento
    ).first()

    if not documento:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    admin = db.query(Usuario).filter(
        Usuario.rut == usuario_rut,
        Usuario.tipo_usuario == "ADMIN"
    ).first()

    if not admin:
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede rechazar documentos"
        )

    documento.documento_aprobado = False
    documento.fecha_aprobacion = None
    documento.usuario_rut = usuario_rut

    db.commit()
    db.refresh(documento)

    return documento
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
        fecha_aprobacion=None,
        usuario_rut=None
    )

    db.add(nuevo_documento)
    db.commit()
    db.refresh(nuevo_documento)

    return nuevo_documento

def verificar_tecnico_automaticamente(db: Session, tecnico_rut: str):
    
    documentos_requeridos = [
        "CERTIFICADO_TECNICO",
        "ANTECEDENTES"
    ]

    documentos_aprobados = db.query(DocumentoTecnico).filter(
        DocumentoTecnico.tecnico_usuario_rut == tecnico_rut,
        DocumentoTecnico.documento_aprobado == True
    ).all()

    tipos_aprobados = [doc.tipo_documento for doc in documentos_aprobados]

    cumple_requisitos = all(
        tipo in tipos_aprobados
        for tipo in documentos_requeridos
    )

    if cumple_requisitos:
        tecnico = db.query(Tecnico).filter(
            Tecnico.usuario_rut == tecnico_rut
        ).first()

        if tecnico:
            tecnico.tecnico_verificado = True
            db.commit()
            
def listar_tecnicos_pendientes_verificacion(db: Session):
    return db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == False
    ).all()