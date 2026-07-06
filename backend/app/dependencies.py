from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.auth import ALGORITHM, SECRET_KEY
from app.database import get_db
from app.models.tecnico import Tecnico
from app.models.usuario import Usuario
from app.models.usuario_rol import UsuarioRol


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/usuarios/login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        correo = payload.get("sub")
        tipo_usuario = payload.get("tipo_usuario")

        if correo is None or tipo_usuario is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalido",
            )

        return {
            "correo": correo,
            "tipo_usuario": tipo_usuario,
            "rut": payload.get("rut"),
            "roles": payload.get("roles") or [],
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o expirado",
        )


def obtener_roles_usuario(db: Session, rut: str) -> list[str]:
    roles = [
        row.rol
        for row in db.query(UsuarioRol).filter(
            UsuarioRol.usuario_rut == rut,
            UsuarioRol.activo == True,
        ).all()
    ]

    usuario = db.query(Usuario).filter(Usuario.rut == rut).first()
    if usuario and usuario.tipo_usuario.value not in roles:
        roles.append(usuario.tipo_usuario.value)

    return roles


def usuario_tiene_rol(db: Session, rut: str, rol: str) -> bool:
    return rol in obtener_roles_usuario(db, rut)


def requiere_rol(roles_permitidos: list[str]):
    def validar_rol(
        db: Session = Depends(get_db),
        usuario_actual: dict = Depends(get_current_user),
    ):
        roles = set(usuario_actual.get("roles") or [])
        tipo_usuario = usuario_actual.get("tipo_usuario")

        if tipo_usuario:
            roles.add(tipo_usuario)

        rut = usuario_actual.get("rut")
        if rut:
            roles.update(obtener_roles_usuario(db, rut))

        if not roles.intersection(roles_permitidos):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta accion",
            )

        return usuario_actual

    return validar_rol


solo_admin = requiere_rol(["ADMIN"])
solo_tecnico = requiere_rol(["TECNICO"])
solo_cliente = requiere_rol(["CLIENTE"])


def get_current_usuario(
    db: Session = Depends(get_db),
    usuario_token: dict = Depends(get_current_user),
):
    usuario = db.query(Usuario).filter(
        Usuario.correo == usuario_token["correo"]
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    return usuario


def require_approved_technician_usuario(
    db: Session,
    usuario: Usuario,
) -> Tecnico:
    if not usuario.estado_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta se encuentra desactivada",
        )

    if not usuario_tiene_rol(db, usuario.rut, "TECNICO"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo tecnicos pueden realizar esta accion",
        )

    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == usuario.rut
    ).first()

    if not tecnico:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes completar tu perfil tecnico antes de operar",
        )

    if tecnico.estado_verificacion != "APROBADO" or not tecnico.tecnico_verificado:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu perfil tecnico todavia no ha sido aprobado.",
        )

    return tecnico
