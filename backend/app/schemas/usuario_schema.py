from pydantic import BaseModel
from datetime import date

from app.enums.usuario_enum import TipoUsuario


class UsuarioCreate(BaseModel):

    rut: str
    nombre_completo: str
    fecha_nacimiento: date
    genero: str
    correo: str
    telefono: str
    contrasena: str
    comuna_id_comuna: int

    tipo_usuario: TipoUsuario