import re
from pydantic import BaseModel, field_validator, Field, EmailStr
from datetime import date

from app.enums.usuario_enum import TipoUsuario


class UsuarioCreate(BaseModel):

    rut: str = Field(min_length=9, max_length=10)
    nombre_completo: str = Field(min_length=3, max_length=100)
    fecha_nacimiento: date
    genero: str = Field(min_length=3, max_length=20)
    correo: EmailStr = Field(max_length=100)
    telefono: str = Field(min_length=9, max_length=9)
    contrasena: str = Field(min_length=8, max_length=72)
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
    @field_validator("nombre_completo", "genero", "telefono", "contrasena")
    @classmethod
    def validar_campos_no_vacios(cls, valor: str):
        if not valor or not valor.strip():
            raise ValueError("Este campo no puede estar vacío")
        return valor.strip()

    @field_validator("telefono")
    @classmethod
    def validar_telefono_chileno(cls, telefono: str):
        telefono = telefono.strip()

        if not telefono.isdigit():
            raise ValueError("El teléfono debe contener solo números")

        if len(telefono) != 9:
            raise ValueError("El teléfono debe tener 9 dígitos")

        if not telefono.startswith("9"):
            raise ValueError("El teléfono debe comenzar con 9")

        return telefono

    @field_validator("fecha_nacimiento")
    @classmethod
    def validar_fecha_nacimiento(cls, fecha: date):
        if fecha > date.today():
            raise ValueError("La fecha de nacimiento no puede ser futura")
        return fecha

    @field_validator("contrasena")
    @classmethod
    def validar_contrasena_segura(cls, contrasena: str):
        if not re.search(r"[A-Z]", contrasena):
            raise ValueError("La contraseña debe contener al menos una letra mayúscula")

        if not re.search(r"[a-z]", contrasena):
            raise ValueError("La contraseña debe contener al menos una letra minúscula")

        if not re.search(r"\d", contrasena):
            raise ValueError("La contraseña debe contener al menos un número")

        return contrasena