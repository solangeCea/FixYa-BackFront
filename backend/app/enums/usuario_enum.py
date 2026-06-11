from enum import Enum


class TipoUsuario(str, Enum):
    CLIENTE = "CLIENTE"
    TECNICO = "TECNICO"
    ADMIN = "ADMIN"