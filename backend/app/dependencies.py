from app.database import get_db
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.auth import SECRET_KEY, ALGORITHM


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/usuarios/login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        correo = payload.get("sub")
        tipo_usuario = payload.get("tipo_usuario")

        if correo is None or tipo_usuario is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )

        return {
            "correo": correo,
            "tipo_usuario": tipo_usuario
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )


def solo_admin(current_user: dict = Depends(get_current_user)):
    if current_user["tipo_usuario"] != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden realizar esta acción"
        )

    return current_user


def solo_tecnico(current_user: dict = Depends(get_current_user)):
    if current_user["tipo_usuario"] != "TECNICO":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo técnicos pueden realizar esta acción"
        )

    return current_user


def solo_cliente(current_user: dict = Depends(get_current_user)):
    if current_user["tipo_usuario"] != "CLIENTE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo clientes pueden realizar esta acción"
        )

    return current_user

def requiere_rol(roles_permitidos: list[str]):
    def validar_rol(usuario_actual: dict = Depends(get_current_user)):
        tipo_usuario = usuario_actual.get("tipo_usuario")

        if tipo_usuario not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción"
            )

        return usuario_actual

    return validar_rol


solo_admin = requiere_rol(["ADMIN"])
solo_tecnico = requiere_rol(["TECNICO"])
solo_cliente = requiere_rol(["CLIENTE"])