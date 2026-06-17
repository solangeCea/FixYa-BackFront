import re
from pydantic import BaseModel, field_validator
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
    @field_validator("rut")
    @classmethod
    def validar_rut_chileno(cls, rut: str):
        rut = rut.replace(".", "").replace(" ", "").upper()

        if not re.match(r"^\d{7,8}-[\dK]$", rut):
            raise ValueError("El RUT debe tener formato válido, ejemplo: 12345678-5")

        cuerpo, dv = rut.split("-")

        suma = 0
        multiplicador = 2

        for numero in reversed(cuerpo):
            suma += int(numero) * multiplicador
            multiplicador += 1
            if multiplicador > 7:
                multiplicador = 2

        resto = suma % 11
        dv_calculado = 11 - resto

        if dv_calculado == 11:
            dv_calculado = "0"
        elif dv_calculado == 10:
            dv_calculado = "K"
        else:
            dv_calculado = str(dv_calculado)

        if dv != dv_calculado:
            raise ValueError("El RUT ingresado no es válido")

        return rut