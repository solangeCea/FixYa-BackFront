import sys
import unittest
import os
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import Base
from app.enums.usuario_enum import TipoUsuario
from app.models import (
    Comuna,
    Cotizacion,
    HistorialSolicitud,
    Region,
    ReporteSolicitud,
    Servicio,
    Solicitud,
    Tecnico,
    TecnicoComuna,
    TecnicoServicio,
    Usuario,
)
from app.schemas.cotizacion_schema import CotizacionCreate
from app.schemas.reporte_solicitud_schema import (
    ReporteSolicitudCreate,
    ReporteSolicitudResolver,
)
from app.services import cotizacion_service, solicitud_service


class TecnicoSolicitudFlowTest(unittest.TestCase):
    cliente_rut = "11.111.111-1"
    otro_cliente_rut = "12.222.222-2"
    tecnico_rut = "22.222.222-2"
    tecnico_dos_rut = "33.333.333-3"
    admin_rut = "99.999.999-9"

    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        TestingSession = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = TestingSession()
        self.original_pdf = cotizacion_service.generar_pdf_cotizacion
        cotizacion_service.generar_pdf_cotizacion = (
            lambda cotizacion, solicitud: (
                f"/uploads/cotizaciones/test_{cotizacion.id_cotizacion}.pdf"
            )
        )
        self._seed_catalogs()

    def tearDown(self):
        cotizacion_service.generar_pdf_cotizacion = self.original_pdf
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
                Comuna(
                    id_comuna=20,
                    nombre_comuna="Nunoa",
                    region_id_region=1,
                ),
                Servicio(
                    id_servicio=100,
                    nombre_servicio="Gasfiteria",
                    descripcion_servicio="Reparaciones",
                    estado_servicio=True,
                ),
                Servicio(
                    id_servicio=200,
                    nombre_servicio="Electricidad",
                    descripcion_servicio="Instalaciones",
                    estado_servicio=True,
                ),
            ]
        )

        for rut, correo, tipo in [
            (self.cliente_rut, "cliente@fixya.cl", TipoUsuario.CLIENTE),
            (self.otro_cliente_rut, "otro@fixya.cl", TipoUsuario.CLIENTE),
            (self.tecnico_rut, "tecnico@fixya.cl", TipoUsuario.TECNICO),
            (self.tecnico_dos_rut, "tecnico2@fixya.cl", TipoUsuario.TECNICO),
            (self.admin_rut, "admin@fixya.cl", TipoUsuario.ADMIN),
        ]:
            self.db.add(
                Usuario(
                    rut=rut,
                    nombre_completo=f"Usuario {rut}",
                    fecha_nacimiento=date(1990, 1, 1),
                    genero="OTRO",
                    correo=correo,
                    telefono="+56911111111",
                    contrasena="hash",
                    estado_usuario=True,
                    comuna_id_comuna=10,
                    tipo_usuario=tipo,
                )
            )

        self.db.add_all(
            [
                Tecnico(
                    usuario_rut=self.tecnico_rut,
                    descripcion_perfil="Tecnico verificado",
                    experiencia_anios=5,
                    nivel_tecnico="Senior",
                    tecnico_verificado=True,
                ),
                Tecnico(
                    usuario_rut=self.tecnico_dos_rut,
                    descripcion_perfil="Tecnico dos",
                    experiencia_anios=3,
                    nivel_tecnico="Intermedio",
                    tecnico_verificado=True,
                ),
                TecnicoServicio(
                    tecnico_usuario_rut=self.tecnico_rut,
                    servicio_id_servicio=100,
                ),
                TecnicoServicio(
                    tecnico_usuario_rut=self.tecnico_dos_rut,
                    servicio_id_servicio=100,
                ),
                TecnicoComuna(
                    tecnico_usuario_rut=self.tecnico_rut,
                    comuna_id_comuna=10,
                    estado_cobertura=True,
                ),
                TecnicoComuna(
                    tecnico_usuario_rut=self.tecnico_dos_rut,
                    comuna_id_comuna=10,
                    estado_cobertura=True,
                ),
            ]
        )
        self.db.commit()

    def _crear_solicitud(
        self,
        servicio_id=100,
        comuna_id=10,
        cliente_rut=None,
        estado="INICIADO",
        tecnico_rut=None,
        activa=True,
    ):
        solicitud = Solicitud(
            usuario_rut=cliente_rut or self.cliente_rut,
            servicio_id_servicio=servicio_id,
            tecnico_usuario_rut=tecnico_rut,
            comuna_id_comuna=comuna_id,
            titulo_solicitud="Fuga de agua en cocina",
            descripcion_problema="Hay una fuga constante bajo el lavaplatos.",
            urgencia="ALTA",
            direccion="Av Tecnica 123",
            solicitud_activa=activa,
            estado_trabajo=estado,
            tipo_problema="Fuga",
            ubicacion_problema_referencia="Cocina",
        )
        self.db.add(solicitud)
        self.db.commit()
        self.db.refresh(solicitud)
        return solicitud

    def _cotizacion_data(self, solicitud_id):
        return CotizacionCreate(
            solicitud_id_solicitud=solicitud_id,
            monto_estimado=Decimal("85000"),
            mensaje_cotizacion="Incluye materiales y mano de obra.",
            fecha_vigencia=datetime.utcnow() + timedelta(days=3),
        )

    def test_listar_disponibles_filtra_y_descarte_solo_oculta_para_un_tecnico(self):
        disponible = self._crear_solicitud()
        self._crear_solicitud(servicio_id=200)
        self._crear_solicitud(tecnico_rut=self.tecnico_rut, estado="ASIGNADO")
        self._crear_solicitud(activa=False)

        visibles = solicitud_service.listar_solicitudes_disponibles_tecnico(
            self.db,
            self.tecnico_rut,
        )
        self.assertEqual([disponible.id_solicitud], [item.id_solicitud for item in visibles])

        solicitud_service.descartar_solicitud_tecnico(
            self.db,
            disponible.id_solicitud,
            self.tecnico_rut,
        )

        visibles_tecnico = solicitud_service.listar_solicitudes_disponibles_tecnico(
            self.db,
            self.tecnico_rut,
        )
        visibles_otro = solicitud_service.listar_solicitudes_disponibles_tecnico(
            self.db,
            self.tecnico_dos_rut,
        )

        self.assertEqual([], visibles_tecnico)
        self.assertIn(disponible.id_solicitud, [item.id_solicitud for item in visibles_otro])

    def test_crear_cotizacion_no_asigna_y_rechaza_duplicados(self):
        solicitud = self._crear_solicitud()

        cotizacion = cotizacion_service.crear_cotizacion(
            self.db,
            self._cotizacion_data(solicitud.id_solicitud),
            self.tecnico_rut,
        )
        self.db.refresh(solicitud)

        self.assertEqual(self.tecnico_rut, cotizacion.tecnico_usuario_rut)
        self.assertEqual("ENVIADA", cotizacion.estado_cotizacion)
        self.assertIsNone(solicitud.tecnico_usuario_rut)
        self.assertEqual("INICIADO", solicitud.estado_trabajo)

        with self.assertRaises(HTTPException) as context:
            cotizacion_service.crear_cotizacion(
                self.db,
                self._cotizacion_data(solicitud.id_solicitud),
                self.tecnico_rut,
            )
        self.assertEqual(409, context.exception.status_code)

    def test_crear_cotizacion_rechaza_servicio_no_prestado(self):
        solicitud = self._crear_solicitud(servicio_id=200)

        with self.assertRaises(HTTPException) as context:
            cotizacion_service.crear_cotizacion(
                self.db,
                self._cotizacion_data(solicitud.id_solicitud),
                self.tecnico_rut,
            )

        self.assertEqual(403, context.exception.status_code)

    def test_cliente_acepta_cotizacion_y_cierra_las_demas(self):
        solicitud = self._crear_solicitud()
        cotizacion_uno = cotizacion_service.crear_cotizacion(
            self.db,
            self._cotizacion_data(solicitud.id_solicitud),
            self.tecnico_rut,
        )
        cotizacion_dos = cotizacion_service.crear_cotizacion(
            self.db,
            self._cotizacion_data(solicitud.id_solicitud),
            self.tecnico_dos_rut,
        )

        aceptada = cotizacion_service.aceptar_cotizacion(
            self.db,
            cotizacion_uno.id_cotizacion,
            self.cliente_rut,
        )

        self.db.refresh(solicitud)
        self.db.refresh(cotizacion_dos)

        self.assertEqual("ACEPTADA", aceptada.estado_cotizacion)
        self.assertEqual(self.tecnico_rut, solicitud.tecnico_usuario_rut)
        self.assertEqual("ASIGNADO", solicitud.estado_trabajo)
        self.assertEqual("RECHAZADA", cotizacion_dos.estado_cotizacion)

        historial = self.db.query(HistorialSolicitud).filter(
            HistorialSolicitud.solicitud_id_solicitud == solicitud.id_solicitud,
            HistorialSolicitud.estado == "ASIGNADO",
        ).first()
        self.assertIsNotNone(historial)

        with self.assertRaises(HTTPException) as context:
            cotizacion_service.aceptar_cotizacion(
                self.db,
                cotizacion_dos.id_cotizacion,
                self.cliente_rut,
            )
        self.assertEqual(409, context.exception.status_code)

    def test_solo_dueno_de_solicitud_puede_aceptar_cotizacion(self):
        solicitud = self._crear_solicitud()
        cotizacion = cotizacion_service.crear_cotizacion(
            self.db,
            self._cotizacion_data(solicitud.id_solicitud),
            self.tecnico_rut,
        )

        with self.assertRaises(HTTPException) as context:
            cotizacion_service.aceptar_cotizacion(
                self.db,
                cotizacion.id_cotizacion,
                self.otro_cliente_rut,
            )

        self.assertEqual(403, context.exception.status_code)

    def test_reportar_oculta_para_tecnico_y_no_elimina_solicitud(self):
        solicitud = self._crear_solicitud()

        reporte = solicitud_service.reportar_solicitud_tecnico(
            self.db,
            solicitud.id_solicitud,
            self.tecnico_rut,
            ReporteSolicitudCreate(
                motivo="SOSPECHA_ESTAFA",
                comentario="La direccion parece sospechosa.",
            ),
        )
        self.db.refresh(solicitud)

        self.assertEqual("PENDIENTE", reporte.estado_reporte)
        self.assertTrue(solicitud.solicitud_activa)

        visibles_tecnico = solicitud_service.listar_solicitudes_disponibles_tecnico(
            self.db,
            self.tecnico_rut,
        )
        visibles_otro = solicitud_service.listar_solicitudes_disponibles_tecnico(
            self.db,
            self.tecnico_dos_rut,
        )

        self.assertEqual([], visibles_tecnico)
        self.assertIn(solicitud.id_solicitud, [item.id_solicitud for item in visibles_otro])

        with self.assertRaises(HTTPException) as context:
            solicitud_service.reportar_solicitud_tecnico(
                self.db,
                solicitud.id_solicitud,
                self.tecnico_rut,
                ReporteSolicitudCreate(motivo="SOLICITUD_DUPLICADA"),
            )
        self.assertEqual(409, context.exception.status_code)

        reportes = solicitud_service.listar_reportes_solicitud(self.db)
        self.assertEqual(1, len(reportes))
        self.assertEqual(solicitud.id_solicitud, reportes[0]["solicitud_id_solicitud"])

    def test_admin_resuelve_reporte_y_puede_ocultar_solicitud(self):
        solicitud = self._crear_solicitud()
        reporte = solicitud_service.reportar_solicitud_tecnico(
            self.db,
            solicitud.id_solicitud,
            self.tecnico_rut,
            ReporteSolicitudCreate(motivo="RIESGO_SEGURIDAD"),
        )

        resuelto = solicitud_service.resolver_reporte_solicitud(
            self.db,
            reporte.id_reporte,
            self.admin_rut,
            ReporteSolicitudResolver(
                estado_reporte="CONFIRMADO",
                observacion_admin="Se oculta mientras se revisa.",
                solicitud_activa=False,
            ),
        )
        self.db.refresh(solicitud)

        self.assertEqual("CONFIRMADO", resuelto.estado_reporte)
        self.assertEqual(self.admin_rut, resuelto.admin_rut_resuelve)
        self.assertFalse(solicitud.solicitud_activa)

        reporte_db = self.db.query(ReporteSolicitud).filter(
            ReporteSolicitud.id_reporte == reporte.id_reporte
        ).first()
        self.assertEqual("Se oculta mientras se revisa.", reporte_db.observacion_admin)


if __name__ == "__main__":
    unittest.main()
