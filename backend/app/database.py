from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@db:5432/fixya_db"
)

# Algunos proveedores (Render, Heroku) entregan la URL con el esquema antiguo
# "postgres://", que SQLAlchemy 2.0 ya no acepta. Se normaliza a "postgresql://".
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# pool_pre_ping evita errores por conexiones caídas (las bases administradas
# cierran conexiones inactivas), algo habitual en la nube.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# FUNCIÓN PARA OBTENER LA SESIÓN DB
def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
