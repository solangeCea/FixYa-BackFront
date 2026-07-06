import os
import sys
import unittest
from datetime import date
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import Base
from app.enums.usuario_enum import TipoUsuario
from app.models import Comuna, Region
from app.routers.usuario_router import crear_usuario
from app.schemas.usuario_schema import UsuarioCreate


class UsuarioRouterTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        TestingSession = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = TestingSession()
        self.db.add(Region(id_region=1, nombre_region="Biobio"))
        self.db.add(Comuna(id_comuna=19, nombre_comuna="Concepcion", region_id_region=1))
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def _usuario_data(self, rut="12345678-5", correo="qa@fixya.local"):
        return UsuarioCreate(
            rut=rut,
            nombre_completo="Usuario QA",
            fecha_nacimiento=date(1998, 5, 10),
            genero="OTRO",
            correo=correo,
            telefono="988888888",
            contrasena="clave123",
            comuna_id_comuna=19,
            tipo_usuario=TipoUsuario.CLIENTE,
        )

    def test_crear_usuario_rechaza_rut_duplicado(self):
        crear_usuario(self._usuario_data(), self.db)

        with self.assertRaises(HTTPException) as context:
            crear_usuario(
                self._usuario_data(correo="otro@fixya.local"),
                self.db,
            )

        self.assertEqual(409, context.exception.status_code)
        self.assertEqual("El RUT ya esta registrado", context.exception.detail)

    def test_crear_usuario_rechaza_correo_duplicado_case_insensitive(self):
        crear_usuario(self._usuario_data(correo="qa@fixya.local"), self.db)

        with self.assertRaises(HTTPException) as context:
            crear_usuario(
                self._usuario_data(rut="87654321-4", correo="QA@FIXYA.LOCAL"),
                self.db,
            )

        self.assertEqual(409, context.exception.status_code)
        self.assertEqual("El correo ya esta registrado", context.exception.detail)


if __name__ == "__main__":
    unittest.main()
