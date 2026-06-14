import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import engine, Base

from app.models import usuario, comuna, region
from app.models import tecnico, tecnico_servicio, tecnico_comuna
from app.models import solicitud, servicio, cotizacion
from app.models import historial_solicitud, resena, Notificacion

from app.routers.usuario_router import router as usuario_router
from app.routers.tecnico_router import router as tecnico_router
from app.routers.solicitud_router import router as solicitud_router
from app.routers.cotizacion_router import router as cotizacion_router
from app.routers.historial_solicitud_router import router as historial_solicitud_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers import resena_router
from app.routers import documento_tecnico_router
from app.routers import admin_router
from app.routers import region_router
from app.routers import comuna_router
from app.routers import servicio_router
from app.routers import tecnico_servicio_router
from app.routers import tecnico_comuna_router
from app.routers import notificacion_router

app = FastAPI(
    title="FixYa API",
    version="1.0.0"
)

# CORS PARA REACT
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en producción se cambia
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="FixYa API",
        version="1.0.0",
        description="API FixYa",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

def seed_database():
    run_seed = os.getenv("RUN_SEED", "true").lower()
    if run_seed not in {"1", "true", "yes", "si"}:
        return
    if engine.dialect.name != "postgresql":
        return

    seed_path = Path(__file__).resolve().parent.parent / "database" / "seed.sql"
    if not seed_path.exists():
        return

    with engine.begin() as connection:
        connection.exec_driver_sql(seed_path.read_text(encoding="utf-8"))


def ensure_verification_columns():
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    if "tecnico" in tables:
        tecnico_columns = {
            column["name"] for column in inspector.get_columns("tecnico")
        }
        tecnico_additions = {
            "estado_verificacion": "VARCHAR(30) DEFAULT 'DOCUMENTOS_PENDIENTES' NOT NULL",
            "observacion_verificacion": "VARCHAR(500)",
            "fecha_verificacion": "TIMESTAMP",
            "verificado_por_rut": "VARCHAR(12)",
        }

        with engine.begin() as connection:
            for column_name, column_definition in tecnico_additions.items():
                if column_name not in tecnico_columns:
                    connection.execute(
                        text(
                            f"ALTER TABLE tecnico ADD COLUMN {column_name} {column_definition}"
                        )
                    )

            connection.execute(
                text(
                    "UPDATE tecnico "
                    "SET estado_verificacion = CASE "
                    "WHEN tecnico_verificado = TRUE THEN 'APROBADO' "
                    "ELSE 'DOCUMENTOS_PENDIENTES' END "
                    "WHERE estado_verificacion IS NULL"
                )
            )

    if "documento_tecnico" in tables:
        documento_columns = {
            column["name"] for column in inspector.get_columns("documento_tecnico")
        }
        documento_additions = {
            "estado_revision": "VARCHAR(30) DEFAULT 'PENDIENTE_REVISION' NOT NULL",
            "observacion_revision": "VARCHAR(500)",
            "fecha_revision": "TIMESTAMP",
            "revisado_por_rut": "VARCHAR(12)",
        }

        with engine.begin() as connection:
            for column_name, column_definition in documento_additions.items():
                if column_name not in documento_columns:
                    connection.execute(
                        text(
                            f"ALTER TABLE documento_tecnico ADD COLUMN {column_name} {column_definition}"
                        )
                    )

            connection.execute(
                text(
                    "UPDATE documento_tecnico "
                    "SET estado_revision = CASE "
                    "WHEN documento_aprobado = TRUE THEN 'APROBADO' "
                    "ELSE 'PENDIENTE_REVISION' END "
                    "WHERE estado_revision IS NULL"
                )
            )


def enforce_verified_technicians_have_review():
    tables = set(inspect(engine).get_table_names())
    if "tecnico" not in tables or "documento_tecnico" not in tables:
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "UPDATE tecnico "
                "SET tecnico_verificado = FALSE, "
                "estado_verificacion = 'DOCUMENTOS_PENDIENTES', "
                "observacion_verificacion = "
                "'Para mantener la verificación necesitamos revisar al menos una evidencia.' "
                "WHERE tecnico_verificado = TRUE "
                "AND NOT EXISTS ("
                "SELECT 1 FROM documento_tecnico d "
                "WHERE d.tecnico_usuario_rut = tecnico.usuario_rut "
                "AND (d.documento_aprobado = TRUE OR d.estado_revision = 'APROBADO')"
                ") "
                "AND (observacion_verificacion IS NULL OR TRIM(observacion_verificacion) = '')"
            )
        )


Base.metadata.create_all(bind=engine)
ensure_verification_columns()
seed_database()
enforce_verified_technicians_have_review()

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(usuario_router)
app.include_router(tecnico_router)
app.include_router(solicitud_router)
app.include_router(cotizacion_router)
app.include_router(historial_solicitud_router)
app.include_router(resena_router.router)
app.include_router(documento_tecnico_router.router)
app.include_router(admin_router.router)
app.include_router(region_router.router)
app.include_router(comuna_router.router)
app.include_router(servicio_router.router)
app.include_router(tecnico_servicio_router.router)
app.include_router(tecnico_comuna_router.router)
app.include_router(dashboard_router)
app.include_router(notificacion_router.router)


@app.get("/")
def root():
    return {
        "mensaje": "FixYa funcionando"
    }
