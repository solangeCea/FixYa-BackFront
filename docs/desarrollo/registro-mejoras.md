# Registro Técnico de Mejoras — FixYa

Documento técnico de evidencia del desarrollo de **FixYa**, plataforma web que
conecta clientes con técnicos especializados en oficios del hogar.

- **Stack:** Backend FastAPI + SQLAlchemy + PostgreSQL · Frontend React + Vite +
  TypeScript + TailwindCSS · Orquestación con Docker Compose.
- **Propósito:** dejar constancia, en lenguaje de ingeniería de software, de las
  mejoras relevantes del proyecto para el informe de proyecto de título.

## Convenciones de este registro

- Cada mejora relevante se documenta como una entrada con identificador `M-NN`.
- Orden **cronológico** (del inicio del proyecto hacia la versión final). Las
  entradas nuevas se **agregan al final**, conservando todo el historial.
- Solo se registran cambios importantes (funcionalidad, corrección relevante,
  arquitectura, rendimiento, seguridad, base de datos, API, UX/UI, dashboards,
  autenticación, validaciones, optimización, integraciones).
- Categorías: `Corrección de errores` · `Mejora funcional` · `Mejora visual (UI)`
  · `Mejora de experiencia de usuario (UX)` · `Optimización` · `Seguridad` ·
  `Arquitectura` · `Base de datos` · `Dashboard` · `Analítica`.

> Nota de trazabilidad: las entradas M-01 a M-14 se reconstruyeron a partir del
> historial de commits del repositorio (fechas de autoría). Las entradas M-15 en
> adelante se documentan en el momento de su implementación.

---

## M-01 · 2026-06-11 — Unificación del repositorio backend + frontend
**Categoría:** Arquitectura

### Problema detectado
El backend y el frontend se mantenían de forma separada, dificultando el
versionado conjunto, el despliegue reproducible y la incorporación de nuevos
integrantes al proyecto.

### Causa
Ausencia de una estructura monorepo y de una orquestación unificada de servicios.

### Solución implementada
Migración a un repositorio único con `backend/` y `frontend/` y definición de un
`docker-compose.yml` que levanta base de datos PostgreSQL, API FastAPI y cliente
Vite con un solo comando. Seed automático de la base al iniciar.

### Archivos modificados
- `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`
- `README.md`, `backend/database/seed.sql`

### Impacto
Entorno de desarrollo reproducible (`docker compose up --build`), base para CI y
despliegue, y onboarding simplificado.

### Verificación
Levantamiento completo de los tres servicios y disponibilidad de la API en
`http://localhost:8000` y del frontend en `http://localhost:5173`.

### Observaciones
Establece la línea base de arquitectura del proyecto.

---

## M-02 · 2026-06-12 — Validaciones de registro y autenticación
**Categoría:** Seguridad

### Problema detectado
Los formularios de registro e inicio de sesión aceptaban datos débiles o
incompletos y no ofrecían retroalimentación clara.

### Causa
Validación insuficiente en el cliente y ausencia de reglas de contraseña.

### Solución implementada
Refuerzo de validaciones de formulario, política de contraseña (longitud,
mayúscula, minúscula y dígito), visibilidad de contraseña y mensajería de estados
vacíos y de error.

### Archivos modificados
- `frontend/src/pages/auth/Register.tsx`, `frontend/src/pages/auth/Login.tsx`
- Componentes de estado (`EmptyState`, mensajería)

### Impacto
Reducción de datos inválidos en origen y mejor experiencia de onboarding.

### Verificación
Pruebas manuales de casos límite y pruebas automatizadas de formularios.

---

## M-03 · 2026-06-12 — Integridad referencial al crear solicitudes
**Categoría:** Corrección de errores

### Problema detectado
Era posible crear solicitudes referenciando servicios, comunas o usuarios
inexistentes (casos CP-024, CP-025, CP-030).

### Causa
Falta de validación de existencia de las entidades relacionadas antes de la
persistencia.

### Solución implementada
Validación en el servicio de solicitudes de la existencia de servicio, comuna y
usuario, devolviendo errores HTTP controlados (404) cuando no existen.

### Archivos modificados
- `backend/app/services/solicitud_service.py`
- `backend/app/routers/solicitud_router.py`

### Impacto
Se garantiza la integridad referencial y se evitan registros huérfanos.

### Verificación
Casos de prueba CP-024, CP-025 y CP-030 documentados en la matriz de pruebas.

---

## M-04 · 2026-06-13 — Reglas de negocio en solicitudes
**Categoría:** Corrección de errores

### Problema detectado
Se aceptaban valores no permitidos de urgencia (CP-026), campos obligatorios
vacíos o demasiado cortos, y cualquier usuario podía cambiar el estado del trabajo
(CP-038).

### Causa
Ausencia de restricciones de dominio y de control de autorización en el cambio de
estado.

### Solución implementada
Restricción de valores de urgencia, validación de longitud/obligatoriedad de
campos y limitación del cambio manual de estado exclusivamente a administradores.

### Archivos modificados
- `backend/app/services/solicitud_service.py`, `backend/app/schemas/solicitud_schema.py`
- `backend/app/dependencies.py` (control de rol)

### Impacto
Consistencia del flujo de trabajo y prevención de transiciones de estado no
autorizadas.

### Verificación
Casos CP-026, CP-038 y validaciones de campos obligatorios.

---

## M-05 · 2026-06-13 — Suite de pruebas automatizadas (Vitest)
**Categoría:** Arquitectura

### Problema detectado
No existía una red de seguridad automatizada que evitara regresiones al modificar
autenticación, registro, servicios o solicitudes.

### Causa
Ausencia de infraestructura de testing en el frontend.

### Solución implementada
Incorporación de Vitest + Testing Library con pruebas para autenticación,
registro, servicios, solicitudes, rutas protegidas, panel administrativo, gestión
de usuarios, moderación de reseñas y panel técnico, incluyendo manejo de errores.

### Archivos modificados
- `frontend/src/tests/**`, configuración de Vitest en `frontend/`

### Impacto
Detección temprana de regresiones y respaldo objetivo de calidad para el informe.

### Verificación
Ejecución de la suite completa en verde (`npx vitest run`).

### Observaciones
Base metodológica que sostiene la validación de todas las mejoras posteriores.

---

## M-06 · 2026-06-13 — Inicio de sesión con validación de rol
**Categoría:** Seguridad

### Problema detectado
Un usuario podía autenticarse en un flujo que no correspondía a su rol real.

### Causa
El rol seleccionado en el formulario no se contrastaba con el rol del usuario
autenticado.

### Solución implementada
Verificación de coincidencia entre el rol seleccionado y el rol real tras iniciar
sesión; ante discrepancia se limpia la sesión y se informa el error.

### Archivos modificados
- `frontend/src/pages/auth/Login.tsx`
- `backend/app/routers/usuario_router.py` (emisión de token con `tipo_usuario`)

### Impacto
Se evita el acceso a paneles que no corresponden al rol del usuario.

### Verificación
Pruebas CP-AUTH (rol correcto e incorrecto).

---

## M-07 · 2026-06-14 — Tipo de problema dinámico según servicio
**Categoría:** Mejora de experiencia de usuario (UX)

### Problema detectado
El formulario de solicitud mostraba tipos de problema genéricos, poco relevantes
para el servicio elegido.

### Causa
Listado estático de tipos de problema, sin relación con el servicio seleccionado.

### Solución implementada
Adaptación dinámica de las opciones de tipo de problema en función del servicio
seleccionado, con pruebas asociadas.

### Archivos modificados
- Formulario de solicitud del panel de cliente y utilidades relacionadas
- `frontend/src/tests/**`

### Impacto
Solicitudes más precisas y guía contextual para el cliente.

### Verificación
Pruebas automatizadas del comportamiento dinámico.

---

## M-08 · 2026-06-14 — Reglas críticas de cotizaciones
**Categoría:** Corrección de errores

### Problema detectado
Se podían generar cotizaciones duplicadas para la misma solicitud y técnico
(CP-023), aceptar cotizaciones anuladas (CP-015) y un técnico podía cotizar su
propia solicitud (CP-078).

### Causa
Falta de reglas de negocio que controlaran la unicidad y el estado de las
cotizaciones.

### Solución implementada
Bloqueo de cotizaciones duplicadas, impedimento de aceptar cotizaciones anuladas y
restricción para que un técnico no cotice solicitudes propias.

### Archivos modificados
- `backend/app/services/cotizacion_service.py`, `backend/app/routers/cotizacion_router.py`

### Impacto
Integridad del proceso de cotización y prevención de conflictos de interés.

### Verificación
Casos CP-023, CP-015 y CP-078.

---

## M-09 · 2026-06-15 — Pruebas de rendimiento y carga
**Categoría:** Optimización

### Problema detectado
No se contaba con evidencia del comportamiento del sistema bajo carga.

### Causa
Ausencia de un plan de pruebas no funcionales.

### Solución implementada
Elaboración y ejecución de un informe de pruebas de rendimiento y carga sobre los
endpoints principales.

### Archivos modificados
- `docs/Pruebas de Rendimiento y Carga .docx` (informe)

### Impacto
Evidencia de capacidad y punto de partida para futuras optimizaciones.

### Verificación
Informe de resultados con métricas de latencia y throughput.

---

## M-10 · 2026-06-17 — Validación de RUT chileno (módulo 11)
**Categoría:** Seguridad

### Problema detectado
Se aceptaban RUT con formato o dígito verificador inválido.

### Causa
Ausencia de validación del dígito verificador según el algoritmo módulo 11.

### Solución implementada
Validación del RUT (formato y dígito verificador módulo 11) en el backend
(`usuario_schema`) y en el frontend (registro).

### Archivos modificados
- `backend/app/schemas/usuario_schema.py`
- `frontend/src/pages/auth/Register.tsx`

### Impacto
Datos de identidad válidos y coherentes con el contexto chileno.

### Verificación
Caso CP de validación de RUT (válidos e inválidos).

---

## M-11 · 2026-06-17 — Verificación de documentos técnicos en panel admin
**Categoría:** Mejora funcional

### Problema detectado
No existía un flujo formal para validar la documentación de los técnicos antes de
habilitarlos.

### Causa
Falta de gestión documental y de un criterio automático de verificación.

### Solución implementada
Carga, listado y aprobación/rechazo de documentos técnicos por parte del
administrador. Al aprobar los documentos requeridos (`CERTIFICADO_TECNICO` y
`ANTECEDENTES`) el técnico se verifica automáticamente.

### Archivos modificados
- `backend/app/routers/documento_tecnico_router.py`
- `backend/app/services/documento_tecnico_service.py`
- `frontend/src/pages/admin/TechnicianManagement.tsx`

### Impacto
Confianza en el marketplace: los técnicos publicados cuentan con respaldo
documental verificado.

### Verificación
Aprobación de documentos y verificación automática del técnico asociado.

---

## M-12 · 2026-06-19 / 2026-06-21 — Unicidad y validación de datos de usuario
**Categoría:** Seguridad

### Problema detectado
Era posible registrar usuarios con RUT o correo duplicados y con datos personales
mal formados.

### Causa
Falta de restricciones de unicidad y de validación de correo, teléfono y fecha de
nacimiento.

### Solución implementada
Validación de unicidad de RUT y correo (HTTP 409) y validaciones de formato de
correo, teléfono chileno (9 dígitos, prefijo 9) y fecha de nacimiento no futura.

### Archivos modificados
- `backend/app/routers/usuario_router.py`, `backend/app/schemas/usuario_schema.py`

### Impacto
Integridad de la base de usuarios y prevención de cuentas duplicadas.

### Verificación
Casos de prueba de duplicados y de validación de datos personales.

---

## M-13 · 2026-06-21 — Bloqueo de solicitudes con servicios inactivos
**Categoría:** Corrección de errores

### Problema detectado
Se podían crear solicitudes sobre servicios deshabilitados (CP-085).

### Causa
No se verificaba el estado `estado_servicio` del servicio al crear la solicitud.

### Solución implementada
Rechazo de solicitudes cuando el servicio referenciado se encuentra inactivo.

### Archivos modificados
- `backend/app/services/solicitud_service.py`

### Impacto
Coherencia del catálogo: no se solicitan servicios fuera de operación.

### Verificación
Caso CP-085.

---

## M-14 · 2026-06-24 — Validación de rol y listas obligatorias en flujo técnico
**Categoría:** Corrección de errores

### Problema detectado
El alta de perfil técnico admitía usuarios sin rol técnico o sin las listas
obligatorias de servicios/comunas.

### Causa
Validaciones incompletas en la creación del perfil técnico.

### Solución implementada
Validación de existencia del usuario, de rol `TECNICO` y de las listas de
servicios y comunas asociadas al crear el perfil.

### Archivos modificados
- `backend/app/services/tecnico_service.py`, `backend/app/routers/tecnico_router.py`

### Impacto
Perfiles técnicos consistentes y correctamente relacionados.

### Verificación
Pruebas del flujo técnico.

---

## M-15 · 2026-07-06 — Panel de analítica del administrador
**Categoría:** Analítica

### Problema detectado
El dashboard administrativo mostraba únicamente indicadores básicos; no permitía
transformar los datos acumulados en conocimiento para la toma de decisiones.

### Causa
Ausencia de una capa de agregación analítica y de visualizaciones sobre la
información existente (usuarios, técnicos, solicitudes, comunas, oficios).

### Solución implementada
Sección **"Análisis de la Plataforma"** bajo el Resumen del administrador:
endpoint `GET /admin/analitica` (protegido por rol admin) con consultas agregadas
(`GROUP BY`) eficientes, y componente `PlatformAnalytics` con la librería
**Recharts**. Incluye indicadores generales, indicadores inteligentes (insights
calculados: oficio más solicitado, comuna con mayor demanda y menor cobertura,
porcentaje de solicitudes completadas, promedio mensual y crecimiento), gráficos
(solicitudes por oficio/comuna/estado, usuarios por mes, técnicos por oficio,
distribución etaria) y panel de "Impacto de la plataforma". La analítica se carga
de forma diferida (`React.lazy`) para no penalizar el bundle inicial.

### Archivos modificados
- `backend/app/services/admin_service.py`, `backend/app/routers/admin_router.py`, `backend/app/schemas/admin_schema.py`
- `frontend/src/services/analyticsService.ts`, `frontend/src/components/analytics/PlatformAnalytics.tsx`, `frontend/src/pages/admin/AdminDashboard.tsx`
- `frontend/src/tests/admin/PlatformAnalytics.test.tsx`

### Impacto
Convierte los datos operativos en información accionable; el bundle principal se
redujo (~929 kB → ~515 kB) al separar Recharts en un chunk propio.

### Verificación
`tsc -b`, `vite build`, suite Vitest en verde y prueba en vivo del endpoint
`/admin/analitica` (HTTP 200).

### Observaciones
No se requirió modificación de esquema de base de datos: todos los indicadores se
calculan sobre campos existentes (`created_at`, `fecha_creacion`,
`fecha_nacimiento`, relaciones técnico–servicio/comuna).

---

## M-16 · 2026-07-06 — Acceso administrativo discreto
**Categoría:** Seguridad

### Problema detectado
La pantalla de login exponía a todos los usuarios una tarjeta de acceso de
administrador, contrario a las buenas prácticas de mínima exposición.

### Causa
El selector de rol incluía "Administrador" como opción visible pública.

### Solución implementada
Eliminación de la tarjeta admin del login (quedan Cliente y Técnico) y acceso
mediante un ícono discreto que abre un modal **"Acceso Administrativo"**
(`AdminLoginModal`), reutilizando exactamente el mismo backend y la misma lógica
de validación de rol (restringida a `ADMIN`).

### Archivos modificados
- `frontend/src/components/auth/AdminLoginModal.tsx` (nuevo)
- `frontend/src/pages/auth/Login.tsx`, `frontend/src/tests/auth/Login.test.tsx`

### Impacto
Menor superficie visible de acceso privilegiado sin alterar la seguridad real
(que permanece en el backend); UX pública más limpia.

### Verificación
Pruebas CP-AUTH (incluye rechazo de credenciales no administrativas en el modal).

---

## M-17 · 2026-07-06 — Resiliencia en la carga de comunas/servicios del registro
**Categoría:** Corrección de errores

### Problema detectado
En el formulario de registro los selectores de Región/Comuna/Servicio aparecían
vacíos y deshabilitados en ciertos momentos.

### Causa
No era un problema de datos ni de contrato de API (verificado con evidencia): la
carga usa `Promise.all` sobre tres endpoints y, cuando el backend no estaba
disponible al montar la página (indisponibilidad intermitente del stack y
contenedores Docker huérfanos de un proyecto previo compitiendo por los puertos),
la carga fallaba dejando los selectores vacíos.

### Solución implementada
Diagnóstico de causa raíz con evidencia (BD poblada, endpoints 200, CORS y
nombres de propiedades correctos) y endurecimiento del cargador: extracción a una
función reintentable y botón **"Reintentar"** con mensaje claro, de modo que una
caída transitoria sea recuperable sin recargar. Eliminación de los contenedores
huérfanos.

### Archivos modificados
- `frontend/src/pages/auth/Register.tsx`

### Impacto
El fallo transitorio deja de bloquear el registro; la recuperación es explícita.

### Verificación
`tsc -b`, suite Vitest en verde y validación en vivo de los endpoints
`/regiones/`, `/comunas/`, `/servicios/` (HTTP 200).

### Observaciones
La lógica de negocio no se modificó; el cambio es de robustez de UX.

---

## M-18 · 2026-07-06 — Poblamiento de datos de prueba coherentes
**Categoría:** Base de datos

### Problema detectado
La base de datos de demostración carecía de volumen y variedad para ejercitar el
catálogo, la analítica y la reputación durante la defensa.

### Causa
El seed original solo incluía datos mínimos (un técnico, un cliente, cuatro
oficios y sin solicitudes ni reseñas).

### Solución implementada
Ampliación del seeder nativo idempotente (`seed.sql`, `ON CONFLICT DO NOTHING`)
con datos realistas del contexto chileno: 4 oficios adicionales (Techumbre,
Pintura, Albañilería, Jardinería), 10 técnicos y 6 clientes (RUT válidos módulo
11, contraseñas cifradas con la función real del sistema `bcrypt(sha256hex)`), 25
solicitudes en los cinco estados y ocho oficios, y 13 reseñas (una reportada para
poblar la moderación). Distribución geográfica y de oficios variada.

### Archivos modificados
- `backend/database/seed.sql`

### Impacto
Catálogo, panel analítico, ranking de técnicos y moderación quedan poblados con
datos creíbles y reproducibles.

### Verificación
Reconstrucción desde volumen limpio (`docker compose down -v && up --build`) sin
errores; verificación de conteos y de los endpoints de catálogo, analítica y
ranking.

### Observaciones
Idempotente y reproducible en cualquier clon del repositorio.

---

## M-19 · 2026-07-06 — Consistencia de datos de usuarios y verificación técnica
**Categoría:** Corrección de errores

### Problema detectado
En el panel de administración los usuarios mostraban "Comuna no registrada" y los
técnicos verificados no presentaban evidencia documental aprobada.

### Causa
1) El DTO `UsuarioOut` del endpoint `/usuarios/` no exponía `comuna_id_comuna` ni
`estado_usuario` (el dato existía en la BD pero se descartaba en la respuesta).
2) No existían registros en `documento_tecnico` coherentes con el estado
`tecnico_verificado`. 3) La cobertura de comunas se insertaba con
`estado_cobertura` nulo (el default era solo a nivel ORM).

### Solución implementada
Se completó el DTO `UsuarioOut` exponiendo los campos existentes que el frontend
ya consumía; se agregaron documentos aprobados (`CEDULA_IDENTIDAD`,
`CERTIFICADO_TECNICO`, `ANTECEDENTES`) para los técnicos verificados y documentos
pendientes para los no verificados, con archivos de evidencia versionados; y se
declaró `estado_cobertura = true` en el seed.

### Archivos modificados
- `backend/app/routers/usuario_router.py` (DTO `UsuarioOut`)
- `backend/database/seed.sql`, `backend/uploads/documentos_tecnicos/` (evidencia)
- `.gitignore`, `backend/.gitignore` (versionado de la evidencia)

### Impacto
Datos coherentes con la lógica del sistema: comuna/región visibles y técnicos
verificados con evidencia aprobada; la analítica geográfica se puebla
correctamente.

### Verificación
Consulta de consistencia (0 técnicos verificados sin sus documentos requeridos),
endpoints de usuarios y documentos, e indicador de reportes pendientes.

### Observaciones
Se corrigió sólo el contrato de datos (DTO) y los datos; no se alteró la lógica.

---

## M-20 · 2026-07-06 — Rediseño profesional de páginas públicas, SEO y accesibilidad
**Categoría:** Mejora visual (UI)

### Problema detectado
Las páginas públicas (Home, Servicios, Técnicos) presentaban una identidad visual
fragmentada (azul/violeta frente al teal del sistema), tarjetas de catálogo
demasiado simples, SEO deficiente y jerarquía de encabezados incorrecta.

### Causa
Deriva de estilos respecto del sistema de diseño, ausencia de metadatos SEO en
`index.html`, uso del logo como `<h1>` (doble H1 por página) y tarjetas con ícono
genérico sin avatar ni jerarquía.

### Solución implementada
Unificación de la identidad **teal/cyan**; reescritura de textos con principios de
UX Writing y neuroventas (foco en necesidad, confianza y reducción de
incertidumbre); catálogo tipo marketplace con **avatar por iniciales** (componente
reutilizable), badges de especialidad, comuna, experiencia, calificación y
descripción a dos líneas; modal de perfil rediseñado reutilizando el componente
`Modal`. SEO: `lang="es"`, `title`, `meta description`, Open Graph, Twitter Card,
`canonical` y títulos por página (`useDocumentTitle`). Jerarquía **H1–H6**
corregida (un único H1 por página; logo degradado a `<span>`). Accesibilidad:
`label`/`aria-label` en buscadores y filtros, `aria-labelledby` en secciones,
`role="dialog"` en el modal, `alt` descriptivo y anillos de foco.

### Archivos modificados
- `frontend/index.html`
- `frontend/src/pages/Home.tsx`, `frontend/src/pages/Servicios.tsx`, `frontend/src/pages/Tecnicos.tsx`
- `frontend/src/components/Navbar.tsx`
- `frontend/src/components/ui/Avatar.tsx` (nuevo), `frontend/src/hooks/useDocumentTitle.ts` (nuevo)

### Impacto
Apariencia de plataforma comercial lista para producción, mejor posicionamiento y
accesibilidad, y coherencia de marca en todo el sitio. Sin cambios de lógica,
rutas ni backend.

### Verificación
`tsc -b`, `vite build` y suite Vitest (57/57) en verde; revisión de jerarquía de
encabezados y de metadatos.

### Observaciones
`canonical`/Open Graph usan un dominio de ejemplo (`https://fixya.cl/`) a
reemplazar por el dominio real en producción.

---
