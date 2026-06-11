from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.dependencies import get_db, get_current_user, solo_admin
from app.models.usuario import Usuario
from app.security import hash_password, verify_password
from app.auth import crear_token
from app.schemas.usuario_schema import UsuarioCreate

from app.dependencies import get_current_user
from app.models.usuario import Usuario

from sqlalchemy import func
from app.models.solicitud import Solicitud
from app.models.resena import Resena

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

# ---------------------------------------------------
# SCHEMAS AUXILIARES
# ---------------------------------------------------

class LoginRequest(BaseModel):
    correo: str
    contrasena: str


class UsuarioOut(BaseModel):
    rut: str
    nombre_completo: str
    correo: str
    telefono: str
    tipo_usuario: str

    class Config:
        from_attributes = True


# ---------------------------------------------------
# LISTAR USUARIOS (PROTEGIDO)
# ---------------------------------------------------
@router.get("/", response_model=list[UsuarioOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    usuario=Depends(solo_admin)
):
    return db.query(Usuario).all()


# ---------------------------------------------------
# CREAR USUARIO
# ---------------------------------------------------
@router.post("/")
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db)
):

    nuevo_usuario = Usuario(
        rut=usuario.rut,
        nombre_completo=usuario.nombre_completo,
        fecha_nacimiento=usuario.fecha_nacimiento,
        genero=usuario.genero,
        correo=usuario.correo,
        telefono=usuario.telefono,
        contrasena=hash_password(usuario.contrasena),
        comuna_id_comuna=usuario.comuna_id_comuna,
        tipo_usuario=usuario.tipo_usuario
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return {"mensaje": "Usuario creado correctamente"}


# ---------------------------------------------------
# LOGIN
# ---------------------------------------------------
@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):

    usuario = db.query(Usuario).filter(
        Usuario.correo == data.correo
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="Correo incorrecto"
        )

    if not verify_password(data.contrasena, usuario.contrasena):
        raise HTTPException(
            status_code=401,
            detail="Contraseña incorrecta"
        )

    token = crear_token({
        "sub": usuario.correo,
        "tipo_usuario": usuario.tipo_usuario
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# ---------------------------------------------------
# PERFIL (PROTEGIDO REAL)
# ---------------------------------------------------
@router.get("/perfil")
def perfil(
    usuario_token=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    usuario = db.query(Usuario).filter(
        Usuario.correo == usuario_token["correo"]
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return {
        "id": usuario.rut,
        "nombre": usuario.nombre_completo,
        "correo": usuario.correo,
        "telefono": usuario.telefono,
        "tipo_usuario": usuario.tipo_usuario
    }
    
@router.get("/me")
def obtener_usuario_actual(
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(get_current_user)
):
    usuario = db.query(Usuario).filter(
        Usuario.correo == usuario_actual["correo"]
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "rut": usuario.rut,
        "nombre_completo": usuario.nombre_completo,
        "correo": usuario.correo,
        "telefono": usuario.telefono,
        "tipo_usuario": usuario.tipo_usuario.value,
        "comuna_id_comuna": usuario.comuna_id_comuna,
        "estado_usuario": usuario.estado_usuario
    }
    
@router.get("/{rut}/dashboard")
def obtener_dashboard_cliente(
    rut: str,
    db: Session = Depends(get_db)
):
    solicitudes_activas = db.query(Solicitud).filter(
        Solicitud.usuario_rut == rut,
        Solicitud.solicitud_activa == True
    ).count()

    solicitudes_finalizadas = db.query(Solicitud).filter(
        Solicitud.usuario_rut == rut,
        Solicitud.estado_trabajo == "FINALIZADO"
    ).count()

    solicitudes_canceladas = db.query(Solicitud).filter(
        Solicitud.usuario_rut == rut,
        Solicitud.estado_trabajo == "CANCELADO"
    ).count()

    total_gastado = db.query(
        func.sum(Solicitud.costo_final)
    ).filter(
        Solicitud.usuario_rut == rut,
        Solicitud.estado_trabajo == "FINALIZADO"
    ).scalar()

    total_resenas = db.query(Resena).filter(
        Resena.usuario_rut == rut
    ).count()

    return {
        "usuario_rut": rut,
        "solicitudes_activas": solicitudes_activas,
        "solicitudes_finalizadas": solicitudes_finalizadas,
        "solicitudes_canceladas": solicitudes_canceladas,
        "total_gastado": float(total_gastado) if total_gastado else 0,
        "total_resenas": total_resenas
    }
