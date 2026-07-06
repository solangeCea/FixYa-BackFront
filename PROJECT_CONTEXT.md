# PROJECT_CONTEXT.md — Traspaso de contexto de FixYa

> Documento de handoff para continuar el desarrollo en un nuevo chat sin re-analizar todo el proyecto.
> **Fecha de generación:** 2026-07-06 · **Rama Git:** `feature/admin-analytics` · **HEAD:** `ad17a6c`
>
> ⚠️ **LEE PRIMERO la sección 7 (Problemas conocidos):** actualmente el frontend **NO compila** porque
> 3 archivos de la funcionalidad "Mi Perfil del técnico" fueron revertidos por fuera entre sesiones.
> Está el detalle exacto para arreglarlo.

---

## 1. Resumen del proyecto

### Objetivo general
**FixYa** es una plataforma web (proyecto de título) que **conecta clientes con técnicos** especializados en
oficios del hogar (gasfitería, electricidad, carpintería, cerrajería, techumbre, pintura, albañilería,
jardinería). Los clientes publican **solicitudes de servicio**, los técnicos **cotizan** y ejecutan el trabajo,
y al finalizar el cliente **califica** con reseñas. Un **administrador** modera y consulta analítica.

### Tecnologías
- **Backend:** Python + **FastAPI**, **SQLAlchemy** (ORM), **PostgreSQL 16**, JWT con **python-jose**,
  hashing con **passlib[bcrypt]**, **httpx** (llamadas a OpenAI), generación de PDF de cotizaciones.
- **Frontend:** **React 19** + **Vite 8** + **TypeScript** + **TailwindCSS v4**, **react-router-dom v7**,
  **framer-motion**, **lucide-react** (iconos), **recharts** (gráficos, agregado en esta etapa).
- **Testing frontend:** **Vitest** + Testing Library (57 pruebas, todas en verde antes del incidente de la §7).
- **Orquestación:** **Docker Compose** (servicios `db`, `backend`, `frontend`).
- **No hay Alembic** ni migraciones formales: el esquema se crea con `Base.metadata.create_all()` al arrancar
  y los datos con `backend/database/seed.sql` (idempotente).

### Arquitectura
- **Monorepo:** `backend/` (FastAPI) + `frontend/` (React/Vite) en un único repositorio.
- **Backend por capas:** `routers/` (endpoints) → `services/` (lógica de negocio) → `models/` (SQLAlchemy) +
  `schemas/` (Pydantic/DTOs). Dependencias de auth/rol en `dependencies.py`.
  - Nota: algunas operaciones de `usuario` viven directamente en el router (no hay `usuario_service.py`).
- **Frontend:** páginas por rol en `pages/`, componentes reutilizables en `components/ui/`, llamadas HTTP en
  `services/`, contexto de sesión en `context/AuthContext.tsx`, rutas protegidas por rol en `routes/`.
- **Auth:** JWT. El token lleva `sub = correo` y `tipo_usuario`. Contraseña = `bcrypt(sha256hex(password))`.

### Organización de carpetas (lo importante)
```
FixYa-BackFront/
├─ docker-compose.yml
├─ PROJECT_CONTEXT.md              ← este documento
├─ backend/
│  ├─ Dockerfile, requirements.txt, .env.example
│  ├─ database/seed.sql            ← datos iniciales + datos de prueba (idempotente)
│  └─ app/
│     ├─ main.py                   ← create_all + seed + registro de routers + CORS + /uploads
│     ├─ auth.py, security.py, dependencies.py
│     ├─ enums/usuario_enum.py     ← TipoUsuario: CLIENTE|TECNICO|ADMIN
│     ├─ models/                   ← 14 modelos SQLAlchemy
│     ├─ schemas/                  ← DTOs Pydantic
│     ├─ services/                 ← lógica de negocio
│     ├─ routers/                  ← endpoints
│     └─ uploads/                  ← archivos servidos en /uploads (documentos_tecnicos, solicitudes, cotizaciones)
└─ frontend/
   ├─ index.html                   ← SEO (title, meta, OG, canonical, lang=es)
   └─ src/
      ├─ pages/ (Home, Servicios, Tecnicos, auth/, cliente/, tecnico/, admin/)
      ├─ components/ (Navbar, ui/, analytics/, auth/)
      ├─ services/ (api, authService, userService, solicitudService, catalogService, technicianService, ...)
      ├─ context/AuthContext.tsx
      ├─ hooks/useDocumentTitle.ts
      ├─ routes/AppRoutes.tsx, ProtectedRoute.tsx
      └─ tests/
```

---

## 2. Estado actual del desarrollo

### ✅ Completamente implementado (y verificado)
- **Autenticación** (registro, login con validación de rol, JWT, `/me`, `/perfil`).
- **Registro** de clientes y técnicos (con documento técnico para el técnico).
- **Catálogo público de técnicos** (`/tecnicos`) con avatar por iniciales y modal de perfil.
- **Marketplace de servicios** (`/servicios`) con filtro por comuna y dependencia Región→Comuna.
- **Solicitudes:** creación (cliente), toma/cotización/inicio/finalización (técnico), estados
  INICIADO→ASIGNADO→EN_PROCESO→FINALIZADO / CANCELADO.
- **Cotizaciones** con generación de PDF.
- **Reseñas** (cliente califica trabajo finalizado) + reputación de técnicos + ranking "top-rating".
- **Documentos técnicos** (subida + aprobación admin → verificación automática del técnico).
- **Panel Admin** con **Resumen** + sección **Analítica** ("Análisis de la Plataforma", Recharts).
- **Acceso administrativo discreto** (modal en el login, sin tarjeta pública).
- **Notificaciones** (campana en el Navbar).
- **Datos de prueba** realistas (seed): 8 oficios, ~11 técnicos, ~7 clientes, 25 solicitudes, 13 reseñas,
  evidencia documental aprobada.

### 🟡 Parcialmente implementado
- **"Mi Perfil" del técnico** — **BACKEND LISTO**, **FRONTEND ROTO** (ver §7). Falta re-aplicar 3 archivos.
- **IA (resumen de reputación con OpenAI)** — implementado pero **desactivado por defecto** (sin `OPENAI_API_KEY`
  cae a análisis local por palabras clave). Funciona, pero no se usa la IA salvo que se configure la clave.
- **Trabajo en pausa de la compañera** (descripción/validación e imágenes de solicitudes): existen cambios
  sin commit relacionados que **NO deben tocarse** (decisión del usuario). Ver §7 y §10.

### ⛔ Pendiente / inexistente
- **Chat / mensajería** entre cliente y técnico: **NO existe** (no hay modelo, endpoint ni UI de chat).
- **"Mi Perfil" para Cliente y Admin:** solo se pidió para Técnico; el endpoint `PUT /usuarios/me` es genérico
  y serviría para todos, pero no hay UI para cliente/admin.
- **Recuperación de contraseña / cambio de contraseña:** no implementado.
- **Migraciones formales (Alembic):** no existen; cambios de esquema requieren recrear volumen o ALTER manual.
- **Paginación / búsqueda avanzada** en listados grandes: no implementada.

---

## 3. Cambios realizados durante esta conversación

El detalle técnico completo (problema, causa, solución, archivos, impacto, verificación) está en
**`docs/desarrollo/registro-mejoras.md`**, entradas **M-15 a M-25**. Resumen:

| # | Qué se hizo | Por qué | Archivos clave | Estado |
|---|---|---|---|---|
| M-15 | **Panel de analítica admin** (`GET /admin/analitica` + `PlatformAnalytics` con Recharts, insights, gráficos, carga diferida con `React.lazy`) | El dashboard solo tenía indicadores básicos | `admin_service.py`, `admin_router.py`, `admin_schema.py`, `analyticsService.ts`, `components/analytics/PlatformAnalytics.tsx`, `AdminDashboard.tsx` | Commiteado |
| M-16 | **Acceso admin discreto** (se quita la tarjeta admin del login; modal `AdminLoginModal` reutilizando la misma auth) | Buenas prácticas de mínima exposición | `components/auth/AdminLoginModal.tsx`, `Login.tsx` | Commiteado |
| M-17 | **Resiliencia registro** (diagnóstico causa raíz de selects vacíos + botón "Reintentar") | Caídas transitorias dejaban selects vacíos | `Register.tsx` | Commiteado |
| M-18 | **Datos de prueba** (4 oficios, 10 técnicos, 6 clientes, 25 solicitudes, 13 reseñas, idempotentes) | Poblar catálogo/analítica/reputación | `seed.sql`, `.gitignore`, `.gitattributes`, `uploads/documentos_tecnicos/*.pdf` | Commiteado |
| M-19 | **Consistencia de datos** (`UsuarioOut` expone comuna/estado; docs aprobados a verificados; `estado_cobertura`) | "Comuna no registrada" y verificados sin evidencia | `usuario_router.py`, `seed.sql`, `.gitignore` | Commiteado |
| M-20 | **Rediseño UI/UX/SEO** (identidad teal unificada, avatar por iniciales, SEO/OG/canonical, jerarquía H1-H6, accesibilidad) | Apariencia profesional/producción | `index.html`, `Home.tsx`, `Servicios.tsx`, `Tecnicos.tsx`, `Navbar.tsx`, `components/ui/Avatar.tsx`, `hooks/useDocumentTitle.ts` | Commiteado |
| M-21 | **Dependencia Región→Comuna** en el formulario de solicitud del cliente + navegación "Volver al inicio" en Login/Register + consistencia | El selector de comuna mostraba las 25 de golpe; faltaba volver al Home | `ClienteDashboard.tsx`, `Login.tsx`, `Register.tsx`, `SolicitudForm.test.tsx` | Commiteado (ad17a6c) |
| M-22 | **Fix "Tipo de problema"** para los 8 oficios (mapeo del frontend solo cubría 4) | Oficios nuevos mostraban solo "Otro" | `ClienteDashboard.tsx` | Commiteado (ad17a6c) |
| M-23 | **Carga de imagen del problema** por selector de archivos (helper `archivo_service.py`, `POST /solicitudes/foto`, refactor de documentos técnicos) | El campo pedía pegar una URL | `archivo_service.py`, `solicitud_router.py`, `documento_tecnico_router.py`, `solicitudService.ts`, `ClienteDashboard.tsx` | Commiteado (ad17a6c) |
| M-24 | **(Trabajo de la compañera)** validaciones de longitud mínima en creación de solicitudes (frontend vs backend) | Discrepancia de validación | `ClienteDashboard.tsx`, `solicitudService.ts`, `SolicitudForm.test.tsx` | **Sin commit / en pausa — NO tocar** |
| M-25 | **"Mi Perfil" del técnico** (backend + frontend) | El técnico no podía editar sus datos | ver §5/§6/§11 | **Backend OK · Frontend ROTO (ver §7)** |

### Dependencias agregadas
- **Frontend:** `recharts@^3.9.2` (gráficos de la analítica admin). No se agregaron dependencias de backend.

### Decisiones técnicas tomadas
- **Identidad visual unificada en teal/cyan** (`#0f766e` / `#0891b2`), clases `fixya-card`, `fixya-btn-primary`.
  Se eliminó el azul/violeta previo de las páginas públicas. **No revertir a azul.**
- **Analítica sin cambios de esquema:** todo se calcula sobre campos existentes (`created_at`, `fecha_creacion`,
  `fecha_nacimiento`, relaciones técnico–servicio/comuna).
- **Recharts en chunk aparte** vía `React.lazy` (el bundle principal bajó de ~929 kB a ~515 kB).
- **Seed idempotente** con IDs explícitos altos (documentos y solicitudes usan `9001+`) + `ON CONFLICT DO NOTHING`.
- **PDFs de evidencia versionados** (excepción en `.gitignore`) y marcados binarios en `.gitattributes`
  (evita corrupción por conversión LF/CRLF en Windows).
- **Subida de archivos centralizada** en `archivo_service.guardar_archivo(archivo, subcarpeta)`.
- **Perfil: reemisión de token** al cambiar el correo (porque el `sub` del JWT es el correo).
- **Columna `direccion`** agregada al modelo `Usuario` (no existía dirección personal).

---

## 4. Funcionalidades importantes (cómo funcionan hoy)

### Autenticación
- Registro: `POST /usuarios/` (valida RUT chileno módulo 11, correo, teléfono 9 dígitos que parte con 9,
  contraseña con mayúscula/minúscula/dígito, unicidad de RUT y correo). Técnico además crea perfil técnico y
  sube documento.
- Login: `POST /usuarios/login` → devuelve `access_token` (JWT). El **frontend valida que el rol seleccionado
  coincida con el rol real** (`Login.tsx`); si no, limpia sesión.
- Sesión: `AuthContext` carga el usuario con `GET /usuarios/me` al montar. Rutas protegidas con `ProtectedRoute`
  (`allowedRoles`).
- Acceso admin: la pantalla de login solo muestra Cliente/Técnico; el admin entra por un ícono (escudo) que abre
  `AdminLoginModal` (misma auth, restringida a rol ADMIN).
- Contraseñas: `security.hash_password` = `bcrypt(sha256hex(pwd))`. **No cambiar el esquema** o se invalidan las
  contraseñas existentes/seed.

### Clientes
- Panel `/cliente/dashboard` (`ClienteDashboard.tsx`): crea solicitudes, ve sus solicitudes, recibe/acepta/rechaza
  cotizaciones, y **califica** trabajos finalizados. La creación de solicitud reutiliza Región→Comuna, tipo de
  problema dinámico por servicio, y (según §7/M-24) validaciones e imagen.

### Técnicos
- Panel `/tecnico/dashboard` (`TecnicoDashboard.tsx`): ve solicitudes disponibles, acepta trabajos, envía
  cotizaciones (con PDF), inicia y finaliza (registra costo final). Métricas (rating, ingresos, en proceso).
- **"Mi Perfil"** `/tecnico/perfil` (`TecnicoPerfil.tsx`): editar nombre, correo (con confirmación), teléfono,
  región, comuna, dirección. **Actualmente roto en frontend — ver §7.**

### Solicitudes
- Modelo con estados de trabajo, urgencia (BAJA/MEDIA/ALTA), `tipo_problema`, `foto_problema` (URL/archivo),
  dirección, referencia, costo final. Endpoints en `solicitud_router.py` (ver §6).

### Chat
- **No existe.** No hay modelo, endpoint ni UI de chat/mensajería. Si se pide, es desarrollo nuevo desde cero.

### Reseñas
- `resena_router.py` + `resena_service.py`. Una reseña por solicitud finalizada. Detección de lenguaje ofensivo
  (auto-reporte), moderación admin, y **resumen de reputación** (IA OpenAI si hay clave, si no análisis local por
  palabras clave). Ranking `GET /tecnicos/top-rating` y reputación en el perfil público.

### Perfil de usuario
- `GET /usuarios/me` (datos del usuario autenticado, incluye `comuna_id_comuna`, `estado_usuario`, y ahora
  `direccion`). `PUT /usuarios/me` (**nuevo**, genérico) actualiza nombre/correo/teléfono/comuna/dirección y
  reemite token. UI solo para técnico por ahora.

### Paneles
- Admin: layout con pestañas (`/admin/panel`, `/admin/solicitudes`, `/admin/tecnicos`, `/admin/usuarios`,
  `/admin/resenas`). Cliente y Técnico: dashboards propios.

### Administración
- Verificación de técnicos (aprobar documentos → verificación automática), moderación de reseñas, gestión de
  usuarios y solicitudes, analítica.

### IA
- Única IA: `resena_service.generar_resumen_reputacion_openai` (modelo por `OPENAI_REVIEW_MODEL`, default
  `gpt-5.4-mini`). **Sin `OPENAI_API_KEY` no se usa** (fallback local). No hay otra IA en el proyecto.

---

## 5. Base de datos

### Motor y gestión
- **PostgreSQL 16** (contenedor `db`). Esquema por `Base.metadata.create_all()` (en `main.py`). Datos por
  `seed.sql` (solo corre en PostgreSQL, controlado por `RUN_SEED`). **No hay migraciones Alembic.**

### Tablas principales (modelos en `backend/app/models/`)
- `usuario` — rut (PK lógica/única), nombre_completo, fecha_nacimiento, genero, correo (único), telefono,
  **direccion (nuevo, nullable)**, contrasena, estado_usuario, comuna_id_comuna (FK), tipo_usuario (enum),
  created_at, updated_at.
- `region` (id_region, nombre_region) · `comuna` (id_comuna, nombre_comuna, region_id_region FK).
- `servicio` (id_servicio, nombre_servicio, descripcion_servicio, estado_servicio).
- `tecnico` (usuario_rut PK/FK, descripcion_perfil, experiencia_anios, nivel_tecnico, tecnico_verificado).
- `tecnico_servicio` (tecnico_usuario_rut, servicio_id_servicio) — M:N técnico↔oficio.
- `tecnico_comuna` (tecnico_usuario_rut, comuna_id_comuna, estado_cobertura, fecha_registro) — cobertura.
- `solicitud` (id, usuario_rut FK, servicio_id FK, tecnico_usuario_rut FK nullable, comuna_id FK,
  titulo, descripcion_problema, urgencia, direccion, fecha_creacion, solicitud_activa, estado_trabajo,
  fechas asignación/inicio/fin, costo_final, tipo_problema, **foto_problema**, ubicacion_problema_referencia).
- `cotizacion`, `documento_tecnico`, `resena`, `historial_solicitud`, `notificacion`.

### Relaciones importantes
- Usuario **1:1** Tecnico (por `usuario_rut`). Comuna **N:1** Region. Solicitud **N:1** Usuario/Servicio/Comuna y
  **N:1** Tecnico (opcional). Tecnico **N:M** Servicio y **N:M** Comuna. Resena **1:1** Solicitud. Documento **N:1**
  Tecnico. **La región se deriva de la comuna** (`comuna.region_id_region`); el usuario solo guarda `comuna_id_comuna`.

### Migraciones / cambios de esquema realizados
- Se **agregó la columna `usuario.direccion` (VARCHAR(200) NULL)**. Como no hay Alembic:
  - **Clon nuevo:** `create_all` la crea sola. ✅
  - **BD existente:** aplicar `ALTER TABLE usuario ADD COLUMN IF NOT EXISTS direccion VARCHAR(200);`
    (ya ejecutado en la BD local en ejecución) o recrear volumen con `docker compose down -v && up --build`.

### Credenciales de prueba (seed)
- Admin: `admin@fixya.cl` / `admin123` · Cliente demo: `cliente@fixya.cl` / `cliente123` ·
  Técnico demo: `tecnico@fixya.cl` / `tecnico123`.
- 10 técnicos de prueba: contraseña **`Tecnico1234`** (ej. `sofia.contreras@gmail.com`, `matias.fuentes@gmail.com`).
- 6 clientes de prueba: contraseña **`Cliente1234`** (ej. `josefa.reyes@gmail.com`).

---

## 6. API (endpoints)

> Base URL local: `http://localhost:8000`. Swagger en `/docs`. Todos bajo prefijos por router.
> La lista se obtuvo del análisis del código; puede haber endpoints menores no listados.

### Creados/Modificados en esta conversación
- `GET  /admin/analitica` — **creado** (M-15). Analítica agregada (protegido admin).
- `GET  /admin/dashboard` — modificado (schema `UsuarioOut`/dashboard).
- `PUT  /usuarios/me` — **creado** (M-25). Actualiza perfil propio + reemite token.
- `GET  /usuarios/me` — modificado: ahora incluye `direccion`.
- `GET  /usuarios/` — modificado (M-19): `UsuarioOut` expone `comuna_id_comuna` y `estado_usuario`.
- `POST /solicitudes/foto` — **creado** (M-23). Sube imagen (JPG/PNG/WEBP) → `{archivo_url}`.

### Endpoints existentes relevantes (no exhaustivo)
- **Usuarios:** `POST /usuarios/` (registro), `POST /usuarios/login`, `GET /usuarios/perfil`, `GET /usuarios/me`,
  `PUT /usuarios/me`, `GET /usuarios/` (admin).
- **Catálogo:** `GET /regiones/`, `GET /comunas/`, `GET /comunas/region/{id_region}`, `GET /servicios/`.
- **Técnicos:** `POST /tecnicos/`, `GET /tecnicos/`, `GET /tecnicos/publicos/perfiles`, `GET /tecnicos/top-rating`,
  `GET /tecnicos/buscar`, `GET /tecnicos/{rut}/perfil`, `GET /tecnicos/{rut}/dashboard`, coberturas de comuna.
- **Solicitudes:** `POST /solicitudes/`, `POST /solicitudes/foto`, `GET /solicitudes/`,
  `GET /solicitudes/cliente/{rut}`, `GET /solicitudes/tecnico/{rut}`, `PUT /solicitudes/{id}/estado|asignar-tecnico|iniciar|finalizar|cancelar`.
- **Cotizaciones, Reseñas, Documentos técnicos, Notificaciones, Historial:** routers homónimos.
- **Admin:** `GET /admin/dashboard`, `GET /admin/analitica`, `GET /admin/estadisticas`, `PUT /admin/tecnicos/{rut}/verificar`.

### Pendientes (si se retoman features)
- Chat: sin endpoints. Cambio de contraseña / recuperación: sin endpoints. Perfil UI cliente/admin: usar el
  `PUT /usuarios/me` existente.

---

## 7. Problemas conocidos

1. **🔴 CRÍTICO — "Mi Perfil" del técnico NO COMPILA.** Entre sesiones, 3 archivos frontend fueron revertidos por
   fuera. Estado actual:
   - **Presentes:** `backend` completo del perfil (`usuario.py` con `direccion`, `usuario_schema.py` con
     `UsuarioUpdate`, `usuario_router.py` con `PUT /me`), `frontend/src/pages/tecnico/TecnicoPerfil.tsx` (existe),
     `Navbar.tsx` (enlace "Mi Perfil").
   - **Revertidos/faltantes (rompen el build):**
     - `frontend/src/services/userService.ts` → falta exportar `updateMyProfile` (+ tipos `PerfilUpdate`,
       `PerfilUpdateResponse`).
     - `frontend/src/types/auth.ts` → falta `direccion?: string | null` en `Usuario`.
     - `frontend/src/routes/AppRoutes.tsx` → falta la ruta protegida `/tecnico/perfil` (import + `<Route>`).
   - **Errores de `tsc`:** `userService` no exporta `updateMyProfile`; `Usuario` no tiene `direccion`.
   - **Cómo arreglar:** re-aplicar esos 3 cambios (detalle en §10). El backend ya responde correcto
     (`PUT /usuarios/me` probado: 200, persistencia, 422 teléfono inválido, 409 correo duplicado, reemisión de token).
2. **Trabajo en pausa de la compañera (NO tocar):** hay cambios sin commit en `ClienteDashboard.tsx`
   (validaciones de longitud) que pertenecen a otra persona; el usuario pidió **no revertir ni modificar** eso.
   La foto/imagen de solicitudes (M-23) YA está commiteada en `ad17a6c` y **ya está en GitHub**
   (`origin/feature/admin-analytics`), pese a que se creía "solo local".
3. **Warning de bcrypt** en logs del backend (`module 'bcrypt' has no attribute '__about__'`): es un warning de
   compatibilidad passlib+bcrypt; **inofensivo** (el hashing/login funciona).
4. **Bundle grande:** `PlatformAnalytics` (Recharts) pesa ~414 kB; mitigado con `React.lazy` (chunk aparte).
5. **Sin migraciones:** cualquier cambio de columna requiere `down -v` o `ALTER` manual (ver §5).
6. **Inconsistencia de estado "EN_PROCESO" vs "EN_EJECUCION":** `solicitud_service.cambiar_estado_solicitud`
   contempla `EN_EJECUCION`, pero el resto del sistema usa `EN_PROCESO`. Verificar si afecta algún flujo admin.
7. El navegador automatizado (herramienta) no siempre alcanza `localhost` del stack Docker; validar en el
   navegador real del usuario.

---

## 8. Tareas pendientes (TODO, priorizado)

1. **(P0) Reparar el build:** re-aplicar los 3 archivos de "Mi Perfil" (§7.1 y §10) y correr `npx tsc -b` +
   `npm run build` + `npx vitest run` hasta verde.
2. **(P1)** Verificar "Mi Perfil" end-to-end en el navegador (precarga, cambio de correo con confirmación,
   guardado y mensajes).
3. **(P1)** Coordinar con la compañera el merge de validaciones/imagen de solicitudes (evitar duplicar M-23/M-24).
4. **(P2)** (Opcional) Extender "Mi Perfil" a Cliente/Admin reutilizando `PUT /usuarios/me`.
5. **(P2)** Homogeneizar `EN_PROCESO`/`EN_EJECUCION` (§7.6).
6. **(P3)** Cambio/recuperación de contraseña.
7. **(P3)** Chat cliente–técnico (si el proyecto lo requiere) — desarrollo nuevo.
8. **(Continuo)** Actualizar `docs/desarrollo/registro-mejoras.md` tras **cada** mejora importante (ver §12).

---

## 9. Configuración del proyecto

### Variables de entorno (backend)
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/fixya_db
SECRET_KEY=<clave JWT>            # firma de tokens
RUN_SEED=true                    # ejecuta seed.sql al arrancar (solo PostgreSQL)
OPENAI_API_KEY=                  # opcional; si vacío, la IA de reseñas usa análisis local
OPENAI_REVIEW_MODEL=gpt-5.4-mini # modelo de resumen de reputación
```
### Frontend
- `VITE_API_URL=http://localhost:8000` (definido en `docker-compose.yml`; por defecto también en `services/api.ts`).

### Servicios externos / APIs
- **OpenAI** (opcional): resumen de reputación de reseñas. Único servicio externo. Sin clave → fallback local.
- No hay pasarelas de pago, mapas, ni otros servicios externos.

### Levantar el proyecto
```bash
docker compose up --build
# Frontend: http://localhost:5173 · API: http://localhost:8000 · Swagger: /docs · PostgreSQL: 5432
# Reset total de datos/esquema: docker compose down -v && docker compose up --build
```
### Tests / calidad
```bash
cd frontend
npx tsc -b        # tipos
npm run build     # build de producción
npx vitest run    # 57 pruebas (deben quedar en verde)
```

---

## 10. Cómo continuar el desarrollo

### Lo PRIMERO a hacer (reparar el build de "Mi Perfil")
Re-aplicar estos 3 cambios (el backend ya está listo y probado):

1. **`frontend/src/types/auth.ts`** → agregar a `interface Usuario`:
   ```ts
   direccion?: string | null;
   ```
2. **`frontend/src/services/userService.ts`** → agregar (importa `Usuario` desde `../types/auth`):
   ```ts
   export interface PerfilUpdate {
     nombre_completo: string; correo: string; telefono: string;
     comuna_id_comuna: number; direccion?: string | null;
   }
   export interface PerfilUpdateResponse { usuario: Usuario; access_token: string; token_type: string; }
   export async function updateMyProfile(data: PerfilUpdate): Promise<PerfilUpdateResponse> {
     const token = getToken();
     const response = await fetch(`${API_URL}/usuarios/me`, {
       method: "PUT",
       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
       body: JSON.stringify(data),
     });
     if (!response.ok) {
       const e = await response.json().catch(() => null);
       throw new Error(typeof e?.detail === "string" ? e.detail : "No pudimos actualizar tu perfil.");
     }
     return response.json();
   }
   ```
3. **`frontend/src/routes/AppRoutes.tsx`** → importar `TecnicoPerfil` y agregar la ruta protegida:
   ```tsx
   import TecnicoPerfil from "../pages/tecnico/TecnicoPerfil";
   // dentro de <Routes>:
   <Route path="/tecnico/perfil" element={
     <ProtectedRoute allowedRoles={["TECNICO"]}><TecnicoPerfil /></ProtectedRoute>
   } />
   ```
Luego: `npx tsc -b && npm run build && npx vitest run`. Reconstruir contenedor frontend si aplica.

### Decisiones YA tomadas — NO modificar sin justificación
- **Identidad visual teal/cyan** unificada (no volver a azul/violeta).
- **Hashing de contraseñas** `bcrypt(sha256hex(pwd))` (cambiarlo invalida el seed y usuarios existentes).
- **JWT con `sub = correo`** y **reemisión de token** al cambiar correo.
- **Región derivada de la comuna** (el usuario solo persiste `comuna_id_comuna`).
- **Seed idempotente** con IDs `9001+` y `ON CONFLICT DO NOTHING`; **PDFs de evidencia versionados** + `.gitattributes`.
- **`registro-mejoras.md` es evidencia del informe de título**: se agrega, nunca se reemplaza; orden cronológico.
- **NO tocar el trabajo en pausa de la compañera** (validaciones/imagen de solicitudes).
- Rutas, contratos de API existentes y arquitectura por capas: mantener.

### Instrucción permanente activa
Tras cada implementación importante, **actualizar automáticamente `docs/desarrollo/registro-mejoras.md`** con los
10 campos (Fecha, Categoría, Título, Problema, Causa, Solución, Archivos, Impacto, Verificación, Observaciones) y
las categorías permitidas; y sugerir evidencia visual (capturas) para el informe.

---

## 11. Archivos creados / modificados / eliminados en esta conversación

> "Commiteado" = ya en la rama (`a583c03`…`ad17a6c`). "Sin commit" = solo en el árbol de trabajo local.

### Backend
- `app/services/admin_service.py` — **mod** — analítica agregada (`obtener_analitica_admin`). *Commiteado.*
- `app/routers/admin_router.py` — **mod** — `GET /admin/analitica`. *Commiteado.*
- `app/schemas/admin_schema.py` — **mod** — schemas de analítica. *Commiteado.*
- `app/routers/usuario_router.py` — **mod** — `UsuarioOut` con comuna/estado (M-19) + **`PUT /me`** y `direccion` en `/me` (M-25). *Sin commit (parte M-25).*
- `app/schemas/usuario_schema.py` — **mod** — **`UsuarioUpdate`** (M-25). *Sin commit.*
- `app/models/usuario.py` — **mod** — **columna `direccion`** (M-25). *Sin commit.*
- `app/services/archivo_service.py` — **nuevo** — helper de subida de archivos (M-23). *Commiteado.*
- `app/routers/solicitud_router.py` — **mod** — `POST /solicitudes/foto` (M-23). *Commiteado.*
- `app/routers/documento_tecnico_router.py` — **mod** — usa `guardar_archivo` (M-23). *Commiteado.*
- `database/seed.sql` — **mod** — datos de prueba (M-18) + documentos + estado_cobertura (M-19). *Commiteado.*
- `.gitignore`, `.gitattributes` (nuevo) — evidencia versionada + binarios (M-18/M-19). *Commiteado.*

### Frontend
- `src/services/analyticsService.ts` — **nuevo** — cliente de `/admin/analitica`. *Commiteado.*
- `src/components/analytics/PlatformAnalytics.tsx` — **nuevo** — analítica con Recharts. *Commiteado.*
- `src/pages/admin/AdminDashboard.tsx` — **mod** — integra analítica (lazy). *Commiteado.*
- `src/components/auth/AdminLoginModal.tsx` — **nuevo** — acceso admin (M-16). *Commiteado.*
- `src/pages/auth/Login.tsx`, `Register.tsx` — **mod** — modal admin, "Volver al inicio", teal, resiliencia. *Commiteado.*
- `src/pages/Home.tsx`, `Servicios.tsx`, `Tecnicos.tsx` — **mod** — rediseño UI/UX/SEO (M-20). *Commiteado.*
- `src/components/Navbar.tsx` — **mod** — logo→span, y **enlace "Mi Perfil"** (M-25). *Sin commit (parte M-25).*
- `src/components/ui/Avatar.tsx` — **nuevo** — avatar por iniciales. *Commiteado.*
- `src/hooks/useDocumentTitle.ts` — **nuevo** — título por página. *Commiteado.*
- `index.html` — **mod** — SEO/OG/canonical/lang. *Commiteado.*
- `src/pages/cliente/ClienteDashboard.tsx` — **mod** — Región→Comuna, tipo problema, foto (M-21/22/23) *commiteado* + validaciones de la compañera *sin commit (NO tocar)*.
- `src/services/solicitudService.ts` — **mod** — `uploadSolicitudFoto` (M-23) *commiteado* (nota: cambios de la compañera pueden haber sido revertidos por fuera).
- `src/tests/**` — **nuevo/mod** — pruebas de analítica, login, registro, solicitud.
- `src/pages/tecnico/TecnicoPerfil.tsx` — **nuevo** — página "Mi Perfil" (M-25). *Sin commit; requiere §10 para compilar.*
- `src/services/userService.ts`, `src/types/auth.ts`, `src/routes/AppRoutes.tsx` — **debían** modificarse (M-25) pero fueron **revertidos por fuera** → re-aplicar (§10).

### Documentación
- `docs/desarrollo/registro-mejoras.md` — **mod** — M-15…M-25 (evidencia). *Parcialmente sin commit.*
- `PROJECT_CONTEXT.md` — **nuevo** — este documento.

---

## 12. Recomendaciones

- **Reparar el build antes de cualquier otra cosa** (§10). No construir sobre un árbol que no compila.
- **Verificar el estado real con `git status` / `git diff`** al iniciar el nuevo chat: el repositorio ha cambiado
  por fuera entre sesiones más de una vez; **no asumir** que el árbol coincide con lo descrito.
- **Mantener** la identidad teal, la arquitectura por capas, el patrón Región→Comuna y la reutilización de
  `components/ui/` y `services/`.
- **No introducir migraciones sin acordar** un enfoque (hoy es `create_all` + seed). Si se agregan columnas,
  documentar el `ALTER` y el `down -v`.
- **Reutilizar** `archivo_service.guardar_archivo` para toda subida de archivos; `catalogService` para
  regiones/comunas/servicios; `updateMyProfile`/`PUT /usuarios/me` para editar perfiles.
- **Correr `npx tsc -b` + `npm run build` + `npx vitest run`** antes de dar cualquier tarea por terminada.
- **Actualizar `registro-mejoras.md`** tras cada mejora importante (instrucción permanente del proyecto).
- **Coordinar con la compañera** el módulo de descripción/imágenes de solicitudes para no duplicar/entrar en
  conflicto (parte ya está en `origin/feature/admin-analytics`).
- **No commitear secretos**; usar `.env` (no versionado) a partir de `.env.example`.
- Si algo no puede determinarse con certeza (p. ej., exactamente qué de la compañera está commiteado), **verificarlo
  con git antes de actuar**, en lugar de asumir.
