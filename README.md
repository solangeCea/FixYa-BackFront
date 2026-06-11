# FixYa BackFront

Repositorio unico y autonomo de FixYa. Contiene el backend FastAPI y el frontend React/Vite como carpetas normales, sin submodulos ni repositorios Git internos.

## Estructura

```text
FixYa-BackFront/
├── backend/
├── frontend/
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Requisitos

- Git
- Docker Desktop con Docker Compose
- Opcional para desarrollo local: Python 3.13 y Node.js 20

## Levantar con Docker

```bash
docker-compose up --build
```

Servicios:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger/OpenAPI: http://localhost:8000/docs
- PostgreSQL: localhost:5432

La conexion Docker del backend usa:

```text
postgresql://postgres:postgres@db:5432/fixya_db
```

Para detener:

```bash
docker-compose down
```

Para reiniciar la base de datos desde cero:

```bash
docker-compose down -v
docker-compose up --build
```

## Desarrollo local sin Docker

Backend:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fixya_db"
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Git para el equipo

```bash
git status
git checkout -b feature/nombre-corto
git add .
git commit -m "Descripcion clara del cambio"
git push -u origin feature/nombre-corto
```

Flujo recomendado: trabajar siempre en ramas `feature/*`, abrir Pull Request hacia `main`, revisar antes de mezclar y mantener un solo repositorio remoto para este proyecto.
