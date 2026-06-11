# FixYa Backend

Backend FastAPI del monorepo `FixYa-BackFront`.

Uso recomendado:

```bash
cd ..
docker-compose up --build
```

En Docker la API usa PostgreSQL mediante el servicio `db`:

```text
postgresql://postgres:postgres@db:5432/fixya_db
```

Para desarrollo local sin Docker, revisa el `README.md` de la raiz del repositorio.
