from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import crear_token
from app.database import get_db
from app.dependencies import (
    get_current_user,
    get_current_usuario,
    obtener_roles_usuario,
    solo_admin,
)
from app.enums.usuario_enum import TipoUsuario
from app.models.comuna import Comuna
from app.models.resena import Resena
from app.models.servicio import Servicio
from app.models.solicitud import Solicitud
from app.models.tecnico import Tecnico
from app.models.tecnico_comuna import TecnicoComuna
from app.models.tecnico_servicio import TecnicoServicio
from app.models.usuario import Usuario
from app.models.usuario_rol import UsuarioRol
from app.schemas.tecnico_schema import TecnicoCreate, TecnicoUpdate
from app.schemas.usuario_schema import (
    RegistroTecnicoCreate,
    SolicitudRolTecnicoCreate,
    UsuarioCreate,
)
from app.security import hash_password, verify_password


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
)


class LoginRequest(BaseModel):
    correo: str
    contrasena: str


class UsuarioOut(BaseModel):
    rut: str
    nombre_completo: str
    correo: str
    telefono: str | None = None
    tipo_usuario: str
    comuna_id_comuna: int
    estado_usuario: bool
    roles: list[str] = []

    class Config:
        from_attributes = True


def _normalizar_correo(correo: str) -> str:
    return correo.strip().lower()


def _validar_identidad_disponible(db: Session, rut: str, correo: str):
    if db.query(Usuario).filter(Usuario.rut == rut).first():
        raise HTTPException(
            status_code=409,
            detail="Este RUT ya tiene una cuenta. Inicia sesion para agregar un nuevo rol.",
        )

    if db.query(Usuario).filter(func.lower(Usuario.correo) == correo).first():
        raise HTTPException(
            status_code=409,
            detail="El correo ya esta registrado",
        )


def _validar_servicios_y_comunas(db: Session, servicios: list[int], comunas: list[int]):
    for servicio_id in servicios:
        if not db.query(Servicio).filter(Servicio.id_servicio == servicio_id).first():
            raise HTTPException(
                status_code=404,
                detail=f"Servicio no encontrado: {servicio_id}",
            )

    for comuna_id in comunas:
        if not db.query(Comuna).filter(Comuna.id_comuna == comuna_id).first():
            raise HTTPException(
                status_code=404,
                detail=f"Comuna no encontrada: {comuna_id}",
            )


def _crear_usuario_base(db: Session, usuario: UsuarioCreate, correo_normalizado: str):
    nuevo_usuario = Usuario(
        rut=usuario.rut,
        nombre_completo=usuario.nombre_completo,
        fecha_nacimiento=usuario.fecha_nacimiento,
        genero=usuario.genero,
        correo=correo_normalizado,
        telefono=usuario.telefono,
        contrasena=hash_password(usuario.contrasena),
        comuna_id_comuna=usuario.comuna_id_comuna,
        tipo_usuario=usuario.tipo_usuario,
    )
    db.add(nuevo_usuario)
    return nuevo_usuario


def _crear_rol(db: Session, rut: str, rol: str):
    rol_existente = db.query(UsuarioRol).filter(
        UsuarioRol.usuario_rut == rut,
        UsuarioRol.rol == rol,
        UsuarioRol.activo == True,
    ).first()

    if rol_existente:
        raise HTTPException(
            status_code=409,
            detail="La cuenta ya tiene este rol asignado",
        )

    db.add(UsuarioRol(usuario_rut=rut, rol=rol, activo=True))


def _crear_perfil_tecnico(db: Session, rut: str, data: TecnicoCreate):
    if db.query(Tecnico).filter(Tecnico.usuario_rut == rut).first():
        raise HTTPException(
            status_code=409,
            detail="La cuenta ya tiene un perfil tecnico",
        )

    _validar_servicios_y_comunas(db, data.servicios, data.comunas)

    tecnico = Tecnico(
        usuario_rut=rut,
        descripcion_perfil=data.descripcion_perfil,
        experiencia_anios=data.experiencia_anios,
        nivel_tecnico=data.nivel_tecnico,
        tecnico_verificado=False,
        estado_verificacion="PENDIENTE",
    )
    db.add(tecnico)

    for servicio_id in data.servicios:
        db.add(TecnicoServicio(
            tecnico_usuario_rut=rut,
            servicio_id_servicio=servicio_id,
        ))

    for comuna_id in data.comunas:
        db.add(TecnicoComuna(
            tecnico_usuario_rut=rut,
            comuna_id_comuna=comuna_id,
        ))

    return tecnico


@router.get("/", response_model=list[UsuarioOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    usuario=Depends(solo_admin),
):
    usuarios = db.query(Usuario).all()
    return [
        {
            "rut": item.rut,
            "nombre_completo": item.nombre_completo,
            "correo": item.correo,
            "telefono": item.telefono,
            "tipo_usuario": item.tipo_usuario.value,
            "comuna_id_comuna": item.comuna_id_comuna,
            "estado_usuario": item.estado_usuario,
            "roles": obtener_roles_usuario(db, item.rut),
        }
        for item in usuarios
    ]


@router.post("/", status_code=201)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
):
    if usuario.tipo_usuario == TipoUsuario.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="El rol administrador no puede asignarse desde el registro publico",
        )

    if usuario.tipo_usuario == TipoUsuario.TECNICO:
        raise HTTPException(
            status_code=400,
            detail="Usa el registro tecnico para crear usuario y perfil en una sola operacion",
        )

    correo_normalizado = _normalizar_correo(usuario.correo)
    _validar_identidad_disponible(db, usuario.rut, correo_normalizado)

    try:
        _crear_usuario_base(db, usuario, correo_normalizado)
        _crear_rol(db, usuario.rut, usuario.tipo_usuario.value)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="El RUT o correo ya esta registrado",
        ) from exc

    return {"mensaje": "Usuario creado correctamente"}


@router.post("/registro-tecnico", status_code=201)
def registrar_tecnico(
    data: RegistroTecnicoCreate,
    db: Session = Depends(get_db),
):
    if data.tipo_usuario != TipoUsuario.TECNICO:
        raise HTTPException(
            status_code=400,
            detail="El registro tecnico debe usar tipo_usuario TECNICO",
        )

    correo_normalizado = _normalizar_correo(data.correo)
    _validar_identidad_disponible(db, data.rut, correo_normalizado)

    tecnico_data = TecnicoCreate(
        usuario_rut=data.rut,
        descripcion_perfil=data.descripcion_perfil,
        experiencia_anios=data.experiencia_anios,
        nivel_tecnico=data.nivel_tecnico,
        servicios=data.servicios,
        comunas=data.comunas,
    )

    try:
        _crear_usuario_base(db, data, correo_normalizado)
        _crear_rol(db, data.rut, "TECNICO")
        _crear_perfil_tecnico(db, data.rut, tecnico_data)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="El RUT o correo ya esta registrado",
        ) from exc

    return {
        "mensaje": "Registro tecnico creado correctamente",
        "estado_verificacion": "PENDIENTE",
    }


@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(
        func.lower(Usuario.correo) == _normalizar_correo(data.correo)
    ).first()

    if not usuario:
        raise HTTPException(status_code=401, detail="Correo incorrecto")

    if not verify_password(data.contrasena, usuario.contrasena):
        raise HTTPException(status_code=401, detail="Contrasena incorrecta")

    roles = obtener_roles_usuario(db, usuario.rut)
    token = crear_token({
        "sub": usuario.correo,
        "tipo_usuario": usuario.tipo_usuario.value,
        "rut": usuario.rut,
        "roles": roles,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "roles": roles,
    }


@router.get("/perfil")
def perfil(
    usuario_token=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(
        Usuario.correo == usuario_token["correo"]
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "id": usuario.rut,
        "nombre": usuario.nombre_completo,
        "correo": usuario.correo,
        "telefono": usuario.telefono,
        "tipo_usuario": usuario.tipo_usuario.value,
        "roles": obtener_roles_usuario(db, usuario.rut),
    }


@router.get("/me")
def obtener_usuario_actual(
    db: Session = Depends(get_db),
    usuario_actual: dict = Depends(get_current_user),
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
        "estado_usuario": usuario.estado_usuario,
        "roles": obtener_roles_usuario(db, usuario.rut),
    }


@router.get("/me/roles")
def obtener_mis_roles(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    return {"roles": obtener_roles_usuario(db, usuario.rut)}


@router.post("/me/roles/cliente", status_code=201)
def agregar_rol_cliente(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    if not usuario.estado_usuario:
        raise HTTPException(status_code=403, detail="Tu cuenta esta desactivada")

    try:
        _crear_rol(db, usuario.rut, "CLIENTE")
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="La cuenta ya tiene este rol asignado",
        ) from exc

    return {"mensaje": "Rol cliente agregado correctamente"}


@router.post("/me/roles/tecnico", status_code=201)
def solicitar_rol_tecnico(
    data: SolicitudRolTecnicoCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    if not usuario.estado_usuario:
        raise HTTPException(status_code=403, detail="Tu cuenta esta desactivada")

    tecnico_data = TecnicoCreate(
        usuario_rut=usuario.rut,
        descripcion_perfil=data.descripcion_perfil,
        experiencia_anios=data.experiencia_anios,
        nivel_tecnico=data.nivel_tecnico,
        servicios=data.servicios,
        comunas=data.comunas,
    )

    try:
        _crear_rol(db, usuario.rut, "TECNICO")
        _crear_perfil_tecnico(db, usuario.rut, tecnico_data)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="La cuenta ya tiene rol o perfil tecnico",
        ) from exc

    return {
        "mensaje": "Solicitud de rol tecnico creada correctamente",
        "estado_verificacion": "PENDIENTE",
    }


@router.get("/me/perfil-tecnico")
def obtener_mi_perfil_tecnico(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    tecnico = db.query(Tecnico).filter(Tecnico.usuario_rut == usuario.rut).first()

    if not tecnico:
        raise HTTPException(status_code=404, detail="Perfil tecnico no encontrado")

    return tecnico


@router.put("/me/perfil-tecnico")
def actualizar_mi_perfil_tecnico(
    data: TecnicoUpdate,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    tecnico = db.query(Tecnico).filter(Tecnico.usuario_rut == usuario.rut).first()

    if not tecnico:
        raise HTTPException(status_code=404, detail="Perfil tecnico no encontrado")

    if tecnico.estado_verificacion == "APROBADO":
        raise HTTPException(
            status_code=400,
            detail="No puedes editar un perfil tecnico aprobado desde este flujo",
        )

    datos = data.model_dump(exclude_unset=True, exclude={"tecnico_verificado"})
    for campo, valor in datos.items():
        setattr(tecnico, campo, valor)

    tecnico.estado_verificacion = "PENDIENTE"
    db.commit()
    db.refresh(tecnico)
    return tecnico


@router.get("/{rut}/dashboard")
def obtener_dashboard_cliente(
    rut: str,
    db: Session = Depends(get_db),
):
    solicitudes_activas = db.query(Solicitud).filter(
        Solicitud.usuario_rut == rut,
        Solicitud.solicitud_activa == True,
        Solicitud.estado_trabajo.notin_(["FINALIZADO", "CANCELADO"]),
    ).count()

    solicitudes_finalizadas = db.query(Solicitud).filter(
        Solicitud.usuario_rut == rut,
        Solicitud.estado_trabajo == "FINALIZADO",
    ).count()

    solicitudes_canceladas = db.query(Solicitud).filter(
        Solicitud.usuario_rut == rut,
        Solicitud.estado_trabajo == "CANCELADO",
    ).count()

    total_gastado = db.query(func.sum(Solicitud.costo_final)).filter(
        Solicitud.usuario_rut == rut,
        Solicitud.estado_trabajo == "FINALIZADO",
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
        "total_resenas": total_resenas,
    }
