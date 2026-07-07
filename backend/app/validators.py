"""Validadores de dominio reutilizables.

Centraliza reglas que antes estaban duplicadas en varios schemas, para que la
política sea única y consistente en todo el backend (y equivalente a la del
frontend).
"""

import re

PASSWORD_MIN = 8
PASSWORD_MAX = 72


def validar_password_segura(contrasena: str) -> str:
    """Política de contraseña: 8–72 caracteres con mayúscula, minúscula y número.

    Lanza ``ValueError`` (para usarse dentro de un ``field_validator`` de
    Pydantic, que lo traduce a un 422 con el mensaje claro).
    """
    if contrasena is None or len(contrasena) < PASSWORD_MIN:
        raise ValueError(f"La contraseña debe tener al menos {PASSWORD_MIN} caracteres")
    if len(contrasena) > PASSWORD_MAX:
        raise ValueError(f"La contraseña no puede superar {PASSWORD_MAX} caracteres")
    if not re.search(r"[A-Z]", contrasena):
        raise ValueError("La contraseña debe contener al menos una letra mayúscula")
    if not re.search(r"[a-z]", contrasena):
        raise ValueError("La contraseña debe contener al menos una letra minúscula")
    if not re.search(r"\d", contrasena):
        raise ValueError("La contraseña debe contener al menos un número")
    return contrasena
