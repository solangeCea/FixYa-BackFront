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

## M-21 · 2026-07-06 — Revisión de UX: dependencia Región→Comuna, navegación y consistencia de formularios
**Categoría:** Mejora de experiencia de usuario (UX)

### Problema detectado
1) En el formulario de solicitud del cliente, el selector de Comuna mostraba de
inmediato las 25 comunas del país, sin relación con la región (mala experiencia y
alto costo de búsqueda). 2) Las pantallas de Login y Registro no ofrecían una vía
clara de regreso al Home; el usuario dependía del botón "Atrás" del navegador. 3)
Inconsistencias visuales: el formulario del cliente y el registro usaban acentos
azules frente a la identidad teal del sistema; Login presentaba doble `<h1>`;
placeholders y campos obligatorios poco claros.

### Causa
El formulario del cliente cargaba y renderizaba `getComunas()` (todas) sin filtrar
por región, pese a existir ya la relación `Comuna.region_id_region` y el patrón
región→comuna en el registro. Las vistas de autenticación no incluían un enlace de
retorno explícito y arrastraban estilos previos (azul) y marcado no semántico.

### Solución implementada
- **Dependencia Región→Comuna** en el formulario del cliente reutilizando la
  arquitectura existente (`getRegiones` + `Comuna.region_id_region`, sin nuevas
  tablas ni endpoints): el usuario elige primero la Región; la Comuna permanece
  deshabilitada hasta que exista Región; al cambiar la Región la Comuna se limpia;
  la carga es dinámica (filtrado en memoria). Se preservó el deep-link `?comuna=`
  fijando también su región.
- **Navegación consistente:** enlace "Volver al inicio" (con ícono) en Login y
  Registro, y logos navegables al Home. Se corrigió el doble `<h1>` de Login
  (logo degradado a `<span>`).
- **Consistencia y microcopy:** unificación de acentos a teal en el formulario del
  cliente y el registro; indicadores de campo obligatorio (`*`); placeholders más
  descriptivos y sin pedir datos redundantes (la dirección ya no solicita la
  comuna, que es un campo aparte).

### Archivos modificados
- `frontend/src/pages/cliente/ClienteDashboard.tsx`
- `frontend/src/pages/auth/Login.tsx`, `frontend/src/pages/auth/Register.tsx`
- `frontend/src/tests/solicitudes/SolicitudForm.test.tsx` (adaptación al nuevo flujo)

### Impacto
Selección de comuna acotada y guiada, navegación clara desde autenticación y mayor
coherencia visual entre formularios. No se modificó la lógica de negocio, las rutas
ni el backend; el payload de creación de solicitud permanece igual.

### Verificación
`tsc -b` sin errores, `vite build` correcto y suite Vitest **57/57** en verde
(incluida la actualización de `SolicitudForm.test.tsx`). Verificación en vivo del
frontend (HTTP 200).

### Observaciones
La dependencia Región→Comuna quedó consistente con el patrón ya usado en el
registro, favoreciendo el mantenimiento.

## M-22 · 2026-07-06 — Corrección de "Tipo de problema" para todos los oficios
**Categoría:** Corrección de errores

### Problema detectado
En el formulario "Crear Solicitud de Servicio", al seleccionar ciertos oficios el
campo "Tipo de problema" solo mostraba la opción "Otro" en lugar de las opciones
correspondientes.

### Causa
Las opciones de tipo de problema se resuelven íntegramente en el frontend
(`getProblemOptions` / `problemOptionsByService` en `ClienteDashboard.tsx`), no en
el backend ni en el seed. El mapa solo cubría 4 oficios (Electricidad, Gasfitería,
Carpintería, Cerrajería). Al incorporarse 4 oficios nuevos (Techumbre, Pintura,
Albañilería, Jardinería), estos caían al valor por defecto `["Otro"]`.

### Solución implementada
Se extendió el mapa `problemOptionsByService` y la función `getProblemOptions` con
opciones específicas para Techumbre, Pintura, Albañilería y Jardinería, reutilizando
el mismo patrón de normalización (`normalizeServiceName`) ya existente. No se
duplicó lógica ni se modificó el backend.

### Archivos modificados
- `frontend/src/pages/cliente/ClienteDashboard.tsx`

### Impacto
Los 8 oficios muestran ahora tipos de problema relevantes, mejorando la precisión
de las solicitudes.

### Verificación
`tsc -b`, `vite build` y suite Vitest **57/57** en verde. Se validó que los 8
nombres de servicio del catálogo resuelven a un conjunto de opciones (no a "Otro").

### Observaciones
Recomendación futura: mover este catálogo de tipos de problema a datos servidos
por el backend para evitar acoplar el mapeo a la incorporación de nuevos oficios.

## M-23 · 2026-07-06 — Carga de imagen del problema mediante selector de archivos
**Categoría:** Mejora funcional

### Problema detectado
El campo "Foto del problema" solicitaba pegar el enlace (URL) de una imagen, un
comportamiento poco intuitivo frente a la expectativa de adjuntar una fotografía
desde el dispositivo.

### Causa
La creación de solicitud (JSON) almacena `foto_problema` como una URL
(`String(300)`) y no existía un endpoint de carga de imágenes para solicitudes,
pese a que la arquitectura ya soportaba la subida de archivos (documentos técnicos,
PDF de cotizaciones) con almacenamiento en `uploads/` y servido estático `/uploads`.

### Solución implementada
Se implementó un **selector de archivos** reutilizando la arquitectura existente:
- Backend: helper reutilizable `archivo_service.guardar_archivo(archivo, subcarpeta)`
  que centraliza la lógica de subida; nuevo endpoint `POST /solicitudes/foto`
  (autenticado) que valida el tipo de imagen (JPG/PNG/WEBP), guarda en
  `uploads/solicitudes/` y devuelve la URL pública. Se refactorizó el router de
  documentos técnicos para usar el mismo helper (elimina duplicación).
- Frontend: servicio `uploadSolicitudFoto`; el campo pasó de input de URL a un área
  de carga con vista previa, estado de subida, validación de tipo/tamaño (≤5 MB) y
  opción de quitar la imagen. La URL resultante se envía en `foto_problema`, sin
  cambiar el contrato de creación de solicitudes.

### Archivos modificados
- `backend/app/services/archivo_service.py` (nuevo)
- `backend/app/routers/solicitud_router.py`, `backend/app/routers/documento_tecnico_router.py`
- `frontend/src/services/solicitudService.ts`, `frontend/src/pages/cliente/ClienteDashboard.tsx`

### Impacto
Experiencia de adjunto de fotografías intuitiva y profesional, consistente con el
resto de la plataforma; sin cambios en el modelo de datos ni en el contrato de la
API de creación de solicitudes.

### Verificación
`tsc -b`, `vite build` y Vitest **57/57** en verde. Pruebas en vivo del endpoint:
subida de imagen (HTTP 200 + URL), servido del archivo (HTTP 200) y rechazo de
archivo no-imagen (HTTP 400). Se verificó además que la subida de documentos
técnicos sigue funcionando tras el refactor (HTTP 200).

### Observaciones
Se validan tipo y tamaño tanto en frontend como en backend. Los archivos se sirven
desde el mismo mount estático `/uploads` ya existente.

## M-24 · 2026-07-06 — Discrepancia de validación al crear solicitudes (frontend vs. backend)
**Categoría:** Corrección de errores

### Problema detectado
Al crear una solicitud con todos los campos completos, el formulario no la creaba
y mostraba "No pudimos enviar la solicitud. Revisa los datos", sin indicar qué
campo era inválido.

### Causa
El mensaje provenía del bloque `catch` (la petición al backend falló), no de la
validación del frontend. El schema `SolicitudCreate` (Pydantic) exige longitudes
mínimas —`titulo_solicitud`≥10, `descripcion_problema`≥20, `direccion`≥10,
`ubicacion_problema_referencia`≥3— pero el frontend solo validaba que los campos no
estuvieran vacíos. Un texto corto pero no vacío (p. ej. descripción de 17
caracteres) pasaba la validación del cliente y el backend lo rechazaba con HTTP 422
(`string_too_short`). Además, `createSolicitud` lanzaba un error genérico sin leer
el detalle de la respuesta, ocultando la causa real.

### Solución implementada
- Se alinearon las validaciones del frontend con el schema del backend: mensajes
  específicos por campo cuando no se cumple la longitud mínima, más `maxLength` en
  los inputs para respetar los máximos, y pistas de mínimo en título y descripción.
- Se mejoró `createSolicitud` para propagar el `detail` (mensajes en español) que
  devuelve el backend en sus `HTTPException`, y `handleSubmit` ahora muestra ese
  mensaje en lugar de uno genérico fijo.

### Archivos modificados
- `frontend/src/pages/cliente/ClienteDashboard.tsx`
- `frontend/src/services/solicitudService.ts`
- `frontend/src/tests/solicitudes/SolicitudForm.test.tsx` (ajuste del caso de error)

### Impacto
El usuario recibe feedback claro y anticipado por campo, evitando envíos que el
backend rechazaría; los errores del servidor se muestran con su mensaje real. No se
modificó el backend ni el contrato de la API.

### Verificación
Reproducción directa del fallo vía API: descripción de 17 caracteres → HTTP 422
(`descripcion_problema`, "String should have at least 20 characters"); descripción
≥20 → HTTP 200. Tras la corrección: `tsc -b`, `vite build` y Vitest **57/57** en
verde.

### Observaciones
Las validaciones de longitud quedaron como única fuente de verdad en el backend
(schema) y replicadas en el frontend solo para UX; conviene mantenerlas
sincronizadas ante futuros cambios del schema.

## M-25 · 2026-07-06 — Perfil editable del técnico ("Mi Perfil")
**Categoría:** Mejora funcional

### Problema detectado
El rol Técnico no contaba con una sección para visualizar y actualizar su
información personal (nombre, contacto, ubicación); tras iniciar sesión solo
podía gestionar trabajos.

### Causa
No existía vista de perfil para el técnico ni endpoint de actualización del
propio usuario; el modelo `Usuario` tampoco contemplaba una dirección personal.

### Solución implementada
- **Backend:** se agregó la columna `direccion` (nullable) al modelo `Usuario`;
  DTO `UsuarioUpdate` con las mismas reglas de validación del registro (nombre,
  teléfono chileno, correo `EmailStr`); y endpoint `PUT /usuarios/me` (autenticado)
  que valida existencia de comuna y unicidad de correo, actualiza los datos y
  **reemite el token JWT** (el correo es el `sub`, por lo que un cambio de correo
  invalidaría la sesión). El `GET /usuarios/me` ahora incluye `direccion`.
- **Frontend:** nueva página `TecnicoPerfil` en la ruta protegida
  `/tecnico/perfil` con enlace en el Navbar del rol técnico. Formulario que
  precarga los datos actuales, reutiliza la dependencia Región→Comuna, valida
  todos los campos y exige **confirmar el correo dos veces** cuando cambia. Al
  guardar, actualiza el token y el contexto de autenticación y muestra mensajes
  de éxito/error. Servicio `updateMyProfile`.

### Archivos modificados
- `backend/app/models/usuario.py`, `backend/app/schemas/usuario_schema.py`, `backend/app/routers/usuario_router.py`
- `frontend/src/types/auth.ts`, `frontend/src/services/userService.ts`
- `frontend/src/pages/tecnico/TecnicoPerfil.tsx` (nuevo)
- `frontend/src/routes/AppRoutes.tsx`, `frontend/src/components/Navbar.tsx`

### Impacto
El técnico administra de forma autónoma su información personal y de contacto,
con validaciones y sin invalidar su sesión al cambiar el correo.

### Verificación
`py_compile`, `tsc -b`, `vite build` y Vitest **57/57** en verde. Pruebas en vivo
del endpoint: actualización (HTTP 200) y persistencia; reemisión de token al
cambiar correo; teléfono inválido (422); correo duplicado (409).

### Observaciones
Al agregarse una columna (`direccion`) y no existir migraciones (el proyecto usa
`create_all`), en bases de datos existentes debe recrearse el volumen
(`docker compose down -v && up --build`) o aplicarse `ALTER TABLE usuario ADD
COLUMN direccion VARCHAR(200)`. En clones nuevos, `create_all` la crea sola.

## M-26 · 2026-07-06 — IA de moderación y clasificación de reseñas (Google Gemini + fallback local)
**Categoría:** Mejora funcional / IA

### Problema detectado
La "IA" de reseñas no era IA: la moderación era una lista fija de 9 palabras
(evadible con tildes o leetspeak, p. ej. `idi0ta`) y la "clasificación/resumen"
era conteo de palabras clave. La integración con OpenAI estaba **deshabilitada**
(`OPENAI_API_KEY` vacía), apuntaba a un modelo inexistente (`gpt-5.4-mini`) y su
resultado **no se mostraba en ningún componente** del frontend (código muerto). No
cumplía el objetivo de incorporar una tecnología de IA de forma útil y demostrable.

### Causa
La solución previa dependía de heurísticas locales y de una integración LLM mal
configurada y nunca consumida por la UI.

### Solución implementada
- **Motor IA (`ia_service.py`):** función única `analizar_resena(comentario, calificacion)`
  que, en **una sola llamada**, modera + clasifica + resume. Usa **Google Gemini**
  (`GEMINI_API_KEY`, capa gratuita) con salida JSON estructurada (`responseSchema`):
  `es_ofensiva`, `motivo`, `categorias` (Puntualidad, Calidad del trabajo,
  Comunicación, Precio, Profesionalismo, Limpieza), `sentimiento` y `resumen`
  (etiqueta estilo Uber). Si no hay clave o falla, cae a un **análisis local mejorado**
  que normaliza tildes y leetspeak (ahora sí detecta `idi0ta`).
- **Flujo:** en `crear_resena` se analiza **antes de almacenar**; si es ofensiva se
  guarda oculta (`resena_activa="N"`) y reportada para revisión del admin. La
  clasificación (categorías/sentimiento/resumen/modo) se persiste en columnas nuevas.
- **Persistencia:** columnas `categorias`, `sentimiento`, `resumen_ia`, `analisis_modo`
  en `resena` (migración idempotente auto-aplicada al arrancar).
- **Frontend:** el panel de administración de reseñas muestra el bloque "Análisis de
  IA" con sentimiento (color), etiquetas de categoría y resumen, indicando el modo
  (IA (Gemini)/Local).
- Se corrigió el `Config`/`from_attributes` mal indentado del `ResenaResponse`.

### Archivos modificados
- `backend/app/services/ia_service.py` (nuevo), `backend/app/services/resena_service.py`
- `backend/app/routers/resena_router.py`, `backend/app/schemas/resena_schema.py`, `backend/app/models/resena.py`
- `backend/database/migrations/20260707_add_resena_ia_analysis.sql` (nuevo)
- `docker-compose.yml`, `backend/.env.example`
- `frontend/src/services/reviewService.ts`, `frontend/src/pages/admin/ReviewManagement.tsx`

### Impacto
La plataforma incorpora IA real (LLM) demostrable para moderar y clasificar reseñas,
protegiendo a los técnicos de contenido ofensivo y ofreciendo etiquetas/sentimiento
estilo Uber, con degradación elegante a análisis local sin conexión ni costo.

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest ReviewManagement 4/4 y suite 66/72
(los 6 rojos son preexistentes de `main` en `TecnicoDashboard`, ajenos a este cambio).
Pruebas en vivo (modo local): moderación bloquea ofensivas y leetspeak; clasificación
correcta de categorías/sentimiento; backfill de 13 reseñas del seed; la API `/resenas/`
expone el análisis; endpoint de resumen con codificación UTF-8 correcta (verificado con
httpx en el contenedor).

### Observaciones
Para activar el modo IA basta poner `GEMINI_API_KEY` (clave gratuita en
https://aistudio.google.com/app/apikey) en el `.env` y reiniciar el backend; sin clave,
el sistema usa el análisis local automáticamente. Modelo configurable con `GEMINI_MODEL`
(por defecto `gemini-2.0-flash`).

## M-27 · 2026-07-06 — Gestión completa de técnicos desde el panel de administración
**Categoría:** Corrección / Mejora funcional

### Problema detectado
En el panel de administración, la vista de técnicos solo permitía "Ver perfil" y
"Aprobar". Faltaban por completo las acciones de eliminar, suspender, reactivar y
gestionar observaciones, pese a que la barra lateral y los filtros ya contemplaban
esos estados (Observados, Suspendidos, etc.).

### Causa
El problema era principalmente del **frontend**: los endpoints del backend ya
existían (`PUT /admin/tecnicos/{rut}/revision` para suspender/observar/reactivar y
`DELETE /tecnicos/{rut}` para eliminar), pero `TechnicianManagement.tsx` nunca los
invocaba ni tenía UI. Además, `eliminar_tecnico` hacía `db.delete` directo, que
fallaba por claves foráneas (servicios, comunas, documentos, cotizaciones, solicitudes).

### Solución implementada
- **Backend:** se blindó `tecnico_service.eliminar_tecnico` para limpiar las
  dependencias en orden (desvincula solicitudes dejando el historial y sus reseñas,
  borra cotizaciones/documentos/servicios/comunas, quita el rol TECNICO) y luego
  elimina el perfil técnico; la cuenta de usuario se conserva.
- **Frontend:** en `technicianService.ts` se agregaron `reviewTechnician`
  (`PUT /admin/tecnicos/{rut}/revision`) y `deleteTechnician` (`DELETE /tecnicos/{rut}`).
  En `TechnicianManagement.tsx` se añadieron por cada técnico las acciones **Aprobar,
  Suspender, Reactivar, Observación (agregar/editar) y Eliminar**, con modales para
  el motivo de suspensión/observación y para confirmar el borrado. El estado y la
  observación se muestran en la tabla, y la UI se actualiza **en memoria tras cada
  acción** (sin recargar la página); al eliminar, la fila desaparece del listado.

### Archivos modificados
- `backend/app/services/tecnico_service.py`
- `frontend/src/services/technicianService.ts`
- `frontend/src/pages/admin/TechnicianManagement.tsx`
- `frontend/src/tests/admin/TechnicianManagement.test.tsx`

### Impacto
El administrador gestiona por completo el ciclo de vida de un técnico (aprobar,
observar, suspender, reactivar, eliminar) desde el dashboard, con feedback inmediato.

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest TechnicianManagement 2/2 y suite 66/72
(los 6 rojos son preexistentes de `main` en `TecnicoDashboard`). Pruebas en vivo contra
el stack: revisión suspender→observar→reactivar (estados y observación correctos) y
borrado con FK (HTTP 200, técnico y asociaciones eliminados, usuario conservado).

### Observaciones
El endpoint `/revision` acopla estado y observación: "agregar/editar observación"
fija el estado en `OBSERVADO`, "suspender" en `SUSPENDIDO` y "reactivar" en `APROBADO`
(limpia la observación). Eliminar es una acción destructiva confirmada por modal.

## M-28 · 2026-07-06 — Revisión QA full-stack: seguridad y consistencia FE↔BE
**Categoría:** Corrección / Seguridad

### Problema detectado
Revisión completa de los flujos Cliente/Técnico/Admin y de consistencia frontend↔backend
(4 revisiones en paralelo). Hallazgos confirmados con el código y en vivo:
- **Fugas de autenticación (IDOR):** `GET/PUT/DELETE /solicitudes/{id}`, `GET /usuarios/{rut}/dashboard`
  y los 3 endpoints de `/historial-solicitudes` respondían **200 sin token** (cualquiera podía
  leer/editar/eliminar solicitudes o ver el gasto de otro usuario).
- **Foto de solicitud no se subía:** el frontend guardaba el nombre del archivo, no la imagen.
- **Teléfono:** el registro aceptaba 8–12 dígitos; el backend exige `9\d{8}`.
- **`nivel_tecnico`** con valores `Senior`/`Inicial` fuera del `Literal` del schema.
- **Panel admin de reseñas** mostraba vacíos los datos de moderación.
- **`PUT /usuarios/me`** reemitía el token sin `rut`/`roles`.

### Solución implementada
- **Seguridad:** `GET /solicitudes/{id}` exige auth + propiedad (cliente dueño / técnico
  asignado / admin); `PUT` y `DELETE` pasan a `solo_admin`; `GET /usuarios/{rut}/dashboard`
  exige auth + (dueño o admin); `/historial-solicitudes` protegido (admin / autenticado).
- **Foto:** `ClienteDashboard` sube la imagen con `uploadSolicitudFoto` y persiste la
  `archivo_url`; guard de "subiendo" en el submit.
- **Teléfono:** `Register.tsx` valida `/^9\d{8}$/`.
- **Niveles:** seed y BD normalizados a `Basico/Intermedio/Avanzado`.
- **Reseñas:** `ResenaResponse` expone `fecha_reporte`, `reporte_resuelto`, `fecha_resolucion`,
  `usuario_rut_reporta`, `admin_rut_resuelve`.
- **Token:** `PUT /usuarios/me` reemite con `rut` + `roles` + `tipo_usuario.value`.

### Archivos modificados
- `backend/app/routers/solicitud_router.py`, `usuario_router.py`, `historial_solicitud_router.py`
- `backend/app/schemas/resena_schema.py`, `backend/database/seed.sql`
- `frontend/src/pages/auth/Register.tsx`, `frontend/src/pages/cliente/ClienteDashboard.tsx`
- `frontend/src/tests/solicitudes/SolicitudForm.test.tsx`

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo: IDOR cerrado (401 sin token; dueño 200 / tercero 403 / admin 200); `/resenas` expone
los 5 campos; niveles normalizados; SolicitudForm 18/18 con la foto subida a URL real.

### Observaciones
Pendientes recomendados (no bloqueantes): UI de "Editar perfil" para Cliente (reusar
`updateMyProfile`); vista "Mis cotizaciones" del técnico; acciones admin sobre Usuarios
(activar/desactivar); asignación manual de técnico a solicitud; limpieza de endpoints
huérfanos (`/dashboard/admin` duplicado, `/admin/estadisticas`). El endpoint `A4`
(`/tecnicos/{rut}/perfil` sin auth) queda documentado como recomendación de menor impacto.

## M-29 · 2026-07-06 — Gestión de estado de usuarios (admin) + "Editar perfil" del cliente
**Categoría:** Mejora funcional

### Problema detectado
Dos gaps de funcionalidad requerida detectados en la revisión QA (M-28): el panel de
administración de Usuarios solo permitía "Ver detalle" (sin activar/desactivar cuentas)
y el rol Cliente no tenía pantalla para editar su perfil (solo el técnico la tenía).

### Solución implementada
- **Backend:** endpoint `PUT /usuarios/{rut}/estado` (`solo_admin`) que activa/desactiva
  una cuenta; impide que un admin desactive la suya. Además el **login ahora rechaza
  cuentas desactivadas** (HTTP 403), de modo que "desactivar" bloquea el acceso real.
- **Frontend (admin):** `UserManagement` muestra botones **Activar/Desactivar** por
  usuario (ocultos para la propia cuenta del admin) y en el modal de detalle, con
  actualización inmediata en memoria y banner de éxito. Servicio `setUserEstado`.
- **Frontend (cliente):** nueva página `ClientePerfil` en la ruta protegida
  `/cliente/perfil` (reutiliza `updateMyProfile`, dependencia Región→Comuna y
  confirmación de correo, igual que `TecnicoPerfil`) + enlace "Mi Perfil" en el Navbar
  del cliente.

### Archivos modificados
- `backend/app/routers/usuario_router.py`
- `frontend/src/services/userService.ts`, `frontend/src/pages/admin/UserManagement.tsx`
- `frontend/src/pages/cliente/ClientePerfil.tsx` (nuevo)
- `frontend/src/routes/AppRoutes.tsx`, `frontend/src/components/Navbar.tsx`
- `frontend/src/tests/admin/UserManagement.test.tsx`

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest UserManagement 3/3 y suite 66/72
(6 preexistentes de `TecnicoDashboard`). En vivo: desactivar/reactivar (200), auto-desactivación
(400), sin token (401), y login de cuenta desactivada (403) → reactivada (200).

## M-30 · 2026-07-06 — Cierre de pendientes: cotizaciones del técnico, asignación manual y limpieza
**Categoría:** Mejora funcional / Limpieza

### Problema detectado
Pendientes de la revisión QA (M-28): (1) el técnico no veía sus cotizaciones enviadas ni
su estado; (2) el admin no tenía forma de asignar un técnico a una solicitud desde la UI
(el endpoint existía sin consumidor); (3) endpoints huérfanos duplicados en el backend.

### Solución implementada
- **Cotizaciones del técnico:** nuevo `GET /cotizaciones/mias` (`get_current_usuario`,
  rol TECNICO) + `cotizacion_service.listar_cotizaciones_tecnico`. En `TecnicoDashboard`
  se agregó la sección **"Mis cotizaciones enviadas"** con badge de estado (pendiente/
  aceptada/rechazada). Servicio `getMisCotizaciones`.
- **Asignación manual:** `RequestManagement` ahora carga técnicos aprobados
  (`getPublicTechnicianProfiles`) y, en el detalle de una solicitud activa sin técnico,
  muestra un selector + botón **"Asignar técnico"** (`asignarTecnico` →
  `PUT /solicitudes/{id}/asignar-tecnico/{rut}`, que fija estado `ASIGNADO`), con recarga
  inmediata.
- **Limpieza:** se eliminó el router duplicado `dashboard_router` (`GET /dashboard/admin`,
  duplicado obsoleto de `/admin/dashboard`) y el endpoint huérfano `GET /admin/estadisticas`.

### Archivos modificados
- `backend/app/routers/cotizacion_router.py`, `backend/app/services/cotizacion_service.py`
- `backend/app/main.py`, `backend/app/routers/admin_router.py`
- `backend/app/routers/dashboard_router.py` (eliminado)
- `frontend/src/services/cotizacionService.ts`, `frontend/src/pages/tecnico/TecnicoDashboard.tsx`
- `frontend/src/pages/admin/RequestManagement.tsx`, `frontend/src/tests/tecnico/TecnicoDashboard.test.tsx`

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo: `GET /cotizaciones/mias` (200); asignación de técnico persiste y fija `ASIGNADO`;
endpoints eliminados devuelven 404; `/admin/dashboard` sigue 200.

## M-31 · 2026-07-06 — Corrección: el registro de técnico fallaba con error engañoso
**Categoría:** Corrección

### Problema detectado
Al registrarse como técnico, el formulario mostraba "El RUT o correo ya está registrado"
(HTTP 409) aunque el RUT/correo NO existieran. El registro era imposible.

### Causa
En `_crear_perfil_tecnico` (`usuario_router.py`) se agregaba el `Tecnico` y, sin hacer
`flush`, se agregaban sus `TecnicoServicio`/`TecnicoComuna`. Como esos modelos se
relacionan solo por columna FK (sin `relationship()` ORM), SQLAlchemy no garantizaba el
orden de los INSERT e intentaba insertar `tecnico_comuna` antes que `tecnico`, violando la
FK. El `except IntegrityError` del endpoint etiquetaba **cualquier** IntegrityError como
"RUT o correo ya registrado", ocultando la causa real (el RUT/correo ya se validan antes).

### Solución implementada
Se agregó `db.flush()` inmediatamente después de `db.add(tecnico)` en
`_crear_perfil_tecnico`, garantizando que la fila padre exista antes de insertar
servicios/comunas. (El endpoint admin `crear_tecnico` no tenía el bug: commitea el técnico
antes de los hijos.)

### Archivos modificados
- `backend/app/routers/usuario_router.py`

### Verificación
Reproducción del error real (FK `tecnico_comuna_tecnico_usuario_rut_fkey`) y confirmación
del arreglo. Registro real vía API `POST /usuarios/registro-tecnico` → **201**, con usuario,
técnico (PENDIENTE), servicio, comuna y rol TECNICO creados, y login del nuevo técnico → 200.
Datos de prueba eliminados tras la verificación.
