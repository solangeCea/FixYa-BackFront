# Despliegue en la nube (Render + Cloudflare R2)

Guía para publicar FixYa en Internet. Arquitectura destino:

```
Internet (HTTPS)
  ├─ Frontend estático (Vite build)      → Render Static Site
  ├─ Backend FastAPI (Docker)            → Render Web Service
  │     ├─ PostgreSQL administrado       → Render PostgreSQL
  │     └─ Archivos (documentos + PDFs)  → Cloudflare R2 (S3-compatible)
  └─ (opcional) SMTP (correo) · Groq/Gemini (IA de reseñas)
```

El código ya soporta ambos modos sin cambios:
- **Sin** variables `R2_*` → guarda archivos en disco local (desarrollo).
- **Con** variables `R2_*` → guarda en R2 (producción, persistente).

---

## 1. Cloudflare R2 (almacenamiento de archivos)

1. Entra a https://dash.cloudflare.com → **R2** → *Create bucket* (ej. `fixya-uploads`).
2. En el bucket → **Settings** → *Public access* → habilita **R2.dev subdomain** (o conecta un dominio). Copia la **Public URL** (ej. `https://pub-xxxx.r2.dev`).
3. R2 → **Manage R2 API Tokens** → *Create API token* con permiso **Object Read & Write** sobre el bucket. Copia:
   - **Access Key ID**
   - **Secret Access Key**
   - El **endpoint S3** de tu cuenta: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

Con eso tendrás las 5 variables:
| Variable | Valor |
|---|---|
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | `fixya-uploads` |
| `R2_ACCESS_KEY_ID` | (Access Key ID) |
| `R2_SECRET_ACCESS_KEY` | (Secret Access Key) |
| `R2_PUBLIC_URL` | `https://pub-xxxx.r2.dev` |

---

## 2. Render (base de datos + backend + frontend)

### Opción A — Blueprint (automático)
1. Render → **New +** → **Blueprint** → conecta el repo → detecta `render.yaml`.
2. Crea los 3 recursos (`fixya-db`, `fixya-backend`, `fixya-frontend`).
3. Completa las variables `sync: false` (ver punto 3).

### Opción B — Manual (más control, recomendado la 1ª vez)
1. **PostgreSQL:** New + → *PostgreSQL* → nombre `fixya-db` → *Create*. Copia su **Internal Database URL**.
2. **Backend:** New + → *Web Service* → repo → **Runtime: Docker**, root/context `backend`, Dockerfile `backend/Dockerfile`.
   - *Start Command:* `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - *Health Check Path:* `/`
   - Agrega las variables del punto 3.
3. **Frontend:** New + → *Static Site* → repo →
   - *Build Command:* `cd frontend && npm ci && npm run build`
   - *Publish Directory:* `frontend/dist`
   - *Rewrite rule:* Source `/*` → Destination `/index.html` → **Rewrite** (para React Router).
   - Variable `VITE_API_URL` (ver punto 3).

> Para que los servicios **no se duerman**, sube el plan de `fixya-backend` a *Starter* y el de `fixya-db` a un plan pago pequeño.

---

## 3. Variables de entorno de producción

**Backend (`fixya-backend`):**
| Variable | Valor |
|---|---|
| `DATABASE_URL` | Internal Database URL de `fixya-db` (Render la enlaza sola con Blueprint) |
| `SECRET_KEY` | un secreto fuerte y aleatorio (con Blueprint se genera solo) |
| `RUN_SEED` | `false` |
| `FRONTEND_ORIGINS` | la URL del frontend, ej. `https://fixya-frontend.onrender.com` |
| `FRONTEND_URL` | igual que arriba (para enlaces de recuperación de contraseña) |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` | del punto 1 |
| *(opcional)* `GROQ_API_KEY`, `SMTP_*` | solo si quieres IA de reseñas y correo real |

**Frontend (`fixya-frontend`):**
| Variable | Valor |
|---|---|
| `VITE_API_URL` | la URL pública del backend, ej. `https://fixya-backend.onrender.com` |

> **Orden importante:** despliega primero el **backend** (para conocer su URL), pon esa URL en `VITE_API_URL` del frontend y **redeploya el frontend**. Luego pon la URL del **frontend** en `FRONTEND_ORIGINS`/`FRONTEND_URL` del backend y **redeploya el backend** (para el CORS).

---

## 4. Migración inicial de datos (una vez)

Con `RUN_SEED=false` la base parte **vacía**. Al arrancar, el backend crea las tablas y corre las migraciones automáticamente. Para tener datos base (regiones, comunas, servicios y, si quieres, cuentas demo), corre el `seed.sql` una sola vez contra la base de Render, **o** deja `RUN_SEED=true` para el primer arranque y luego cámbialo a `false`.

> ⚠️ Si usas el seed en producción, **cambia después las contraseñas demo** (admin/cliente/técnico) o no lo uses: esas cuentas tienen contraseñas conocidas.

---

## 5. Verificación end-to-end

- [ ] Frontend abre en su URL `.onrender.com`.
- [ ] Backend responde en `https://<backend>/docs`.
- [ ] Registro + login funcionan (sin errores de CORS en la consola del navegador).
- [ ] Crear solicitud → cotizar → aceptar → **el PDF abre** (servido desde R2).
- [ ] Subir un documento técnico → aparece y **persiste tras un redeploy**.
- [ ] Chat y reseñas funcionan.

---

## 6. Costos y notas
- **Free tier:** todo gratis, pero los servicios se **duermen** tras inactividad (primer arranque ~30–60 s) y la base free **expira a los 90 días**.
- **Plan pequeño (~USD/mes):** backend *Starter* + base pago → siempre despiertos y base estable. R2 es gratis hasta 10 GB.
- Nunca subas el `.env` real ni claves al repo (ya está en `.gitignore`).
