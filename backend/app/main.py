import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base

from app.models import usuario, usuario_rol, comuna, region
from app.models import tecnico, tecnico_servicio, tecnico_comuna
from app.models import solicitud, servicio, cotizacion
from app.models import historial_solicitud, resena, Notificacion
from app.models import password_reset
from app.models import tecnico_solicitud_descartada, reporte_solicitud
from app.models import chat
from app.models import audit_log
from app.models import conflicto_solicitud, cancelacion_solicitud

from app.routers.usuario_router import router as usuario_router
from app.routers.tecnico_router import router as tecnico_router
from app.routers.solicitud_router import router as solicitud_router
from app.routers.cotizacion_router import router as cotizacion_router
from app.routers.historial_solicitud_router import router as historial_solicitud_router
from app.routers import resena_router
from app.routers import documento_tecnico_router
from app.routers import admin_router
from app.routers import region_router
from app.routers import comuna_router
from app.routers import servicio_router
from app.routers import tecnico_servicio_router
from app.routers import tecnico_comuna_router
from app.routers import notificacion_router
from app.routers import chat_router
from app.routers import conflicto_router

app = FastAPI(
    title="FixYa API",
    version="1.0.0"
)

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174",
    ).split(",")
    if origin.strip()
]

# CORS PARA REACT
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
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


def apply_database_migrations():
    if engine.dialect.name != "postgresql":
        return

    migrations_path = Path(__file__).resolve().parent.parent / "database" / "migrations"
    if not migrations_path.exists():
        return

    with engine.begin() as connection:
        for migration_path in sorted(migrations_path.glob("*.sql")):
            connection.exec_driver_sql(migration_path.read_text(encoding="utf-8"))


def reseed_demo_if_requested():
    """Reseed limpio de usuarios de demostración, guardado por env.

    Mecanismo de mantenimiento para dejar la BD (local o producción) con el
    conjunto limpio y válido de usuarios. Solo corre si RESEED_DEMO está activo
    y sobre PostgreSQL. Es determinista (TRUNCATE + inserción del set fijo), así
    que repetirlo deja siempre el mismo estado. ACTIVAR una sola vez y luego
    APAGAR la variable (si no, se re-aplica en cada reinicio del contenedor).
    """
    if os.getenv("RESEED_DEMO", "").strip().lower() not in {"1", "true", "yes", "si"}:
        return
    if engine.dialect.name != "postgresql":
        return
    try:
        from reseed_demo import apply as aplicar_reseed_demo

        print("[reseed] RESEED_DEMO activo: aplicando reseed limpio de usuarios...", flush=True)
        aplicar_reseed_demo()
        print("[reseed] Reseed demo completado. Recuerda APAGAR RESEED_DEMO.", flush=True)
    except Exception as error:  # noqa: BLE001 — no debe impedir el arranque
        print(f"[reseed] Error aplicando el reseed demo: {error}", flush=True)


Base.metadata.create_all(bind=engine)
apply_database_migrations()
seed_database()
reseed_demo_if_requested()

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(usuario_router)
app.include_router(tecnico_router)
# El router de conflictos/cancelaciones se incluye ANTES que el de solicitudes
# para que sus rutas literales (/solicitudes/conflictos, /solicitudes/cancelaciones)
# se resuelvan antes que /solicitudes/{id_solicitud} (que aceptaría cualquier
# segmento y devolvería 422 al no poder parsearlo como entero).
app.include_router(conflicto_router.router)
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
app.include_router(notificacion_router.router)
app.include_router(chat_router.router)


@app.get("/")
def root():
    return {
        "mensaje": "FixYa funcionando"
    }
