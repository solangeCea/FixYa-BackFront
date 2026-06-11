from datetime import datetime, timedelta
import os

from jose import jwt, JWTError

SECRET_KEY = os.getenv("SECRET_KEY", "fixya_secreto")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ---------------------------------------------------
# CREAR TOKEN
# ---------------------------------------------------
def crear_token(data: dict):
    datos = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    datos.update({"exp": expire})

    return jwt.encode(datos, SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------
# DECODIFICAR TOKEN
# ---------------------------------------------------
def verificar_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload

    except JWTError:
        return None
