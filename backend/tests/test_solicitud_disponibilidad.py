import sys
import unittest
import os
from datetime import date
from pathlib import Path

from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import Base
from app.enums.usuario_enum import TipoUsuario
from app.models import Comuna, Region, Servicio, SolicitudDisponibilidad, Usuario
from app.schemas.solicitud_schema import SolicitudCreate
from app.services.solicitud_service import crear_solicitud


class SolicitudDisponibilidadTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        TestingSession = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = TestingSession()
        self._seed_catalogs()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def _seed_catalogs(self):
        self.db.add_all(
            [
                Region(id_region=1, nombre_region="Metropolitana"),
                Comuna(
                    id_comuna=10,
                    nombre_comuna="Santiago",
                    region_id_region=1,
                ),
                Servicio(
                    id_servicio=100,
                    nombre_servicio="Gasfiteria",
                    descripcion_servicio="Reparaciones de gasfiteria",
                    estado_servicio=True,
                ),
                Usuario(
                    rut="11.111.111-1",
                    nombre_completo="Cliente FixYa",
                    fecha_nacimiento=date(1990, 1, 1),
                    genero="OTRO",
                    correo="cliente@fixya.cl",
                    telefono="+56911111111",
                    contrasena="hash",
                    estado_usuario=True,
                    comuna_id_comuna=10,
                    tipo_usuario=TipoUsuario.CLIENTE,
                ),
            ]
        )
        self.db.commit()

    def _solicitud_data(self, disponibilidad_horaria):
        return {
            "usuario_rut": "11.111.111-1",
            "servicio_id_servicio": 100,
            "comuna_id_comuna": 10,
            "titulo_solicitud": "Gasfiteria - Fuga de agua",
            "descripcion_problema": "Hay una fuga constante bajo el lavaplatos.",
            "urgencia": "ALTA",
            "direccion": "Av Siempre Viva 123",
            "tipo_problema": "Fuga de agua",
            "ubicacion_problema_referencia": "Cocina",
            "tipo_inmueble": "Casa",
            "horario_disponible": (
                "Disponibilidad cliente: lunes de 09:00 a 13:00 y "
                "miercoles de 15:00 a 19:00"
            ),
            "instrucciones_acceso": "Tocar timbre principal",
            "disponibilidad_horaria": disponibilidad_horaria,
        }

    def test_crear_solicitud_persiste_varios_dias_y_horarios(self):
        data = SolicitudCreate(
            **self._solicitud_data(
                [
                    {
                        "dia": "LUNES",
                        "hora_inicio": "09:00",
                        "hora_fin": "13:00",
                    },
                    {
                        "dia": "MIERCOLES",
                        "hora_inicio": "15:00",
                        "hora_fin": "19:00",
                    },
                ]
            )
        )

        solicitud = crear_solicitud(self.db, data)
        rows = (
            self.db.query(SolicitudDisponibilidad)
            .filter(
                SolicitudDisponibilidad.solicitud_id_solicitud
                == solicitud.id_solicitud
            )
            .order_by(SolicitudDisponibilidad.id_disponibilidad)
            .all()
        )

        self.assertEqual(2, len(rows))
        self.assertEqual("LUNES", rows[0].dia)
        self.assertEqual("09:00", rows[0].hora_inicio)
        self.assertEqual("13:00", rows[0].hora_fin)
        self.assertEqual("MIERCOLES", rows[1].dia)
        self.assertEqual("15:00", rows[1].hora_inicio)
        self.assertEqual("19:00", rows[1].hora_fin)
        self.assertEqual(2, len(solicitud.disponibilidad_horaria))

    def test_rechaza_hora_fin_anterior_o_igual_a_inicio(self):
        with self.assertRaises(ValidationError):
            SolicitudCreate(
                **self._solicitud_data(
                    [
                        {
                            "dia": "LUNES",
                            "hora_inicio": "13:00",
                            "hora_fin": "13:00",
                        }
                    ]
                )
            )

    def test_rechaza_dias_repetidos(self):
        with self.assertRaises(ValidationError):
            SolicitudCreate(
                **self._solicitud_data(
                    [
                        {
                            "dia": "LUNES",
                            "hora_inicio": "09:00",
                            "hora_fin": "13:00",
                        },
                        {
                            "dia": "LUNES",
                            "hora_inicio": "15:00",
                            "hora_fin": "19:00",
                        },
                    ]
                )
            )


if __name__ == "__main__":
    unittest.main()
