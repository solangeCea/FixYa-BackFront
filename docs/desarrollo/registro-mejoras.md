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

## M-32 · 2026-07-06 — Corrección: aprobar el documento no validaba al técnico
**Categoría:** Corrección

### Problema detectado
Tras aprobar el administrador el documento del técnico, al iniciar sesión el técnico
seguía viendo "Aún no has sido validado" y no podía ver ni aceptar trabajos.

### Causa (100% backend)
`verificar_tecnico_automaticamente` (aprobación de documento → verificación automática)
exigía tener aprobados **dos tipos fijos**: `CERTIFICADO_TECNICO` **y** `ANTECEDENTES`.
Pero el formulario de registro (`Register.tsx`) sube **un único** documento
(`CERTIFICADO_TECNICO`); `ANTECEDENTES` nunca se sube, por lo que la condición nunca se
cumplía y el técnico jamás se verificaba al aprobar su documento. El gate del dashboard
(y el backend `require_approved_technician_usuario`) exigen `estado_verificacion="APROBADO"`
**y** `tecnico_verificado=True`, así que el técnico quedaba bloqueado.
- El **frontend estaba correcto**: lee `estado_verificacion` + `tecnico_verificado` de un
  fetch fresco (`GET /usuarios/me/perfil-tecnico`), sin caché ni dependencia del token; la
  lógica del gate no está invertida.

### Solución implementada
`verificar_tecnico_automaticamente` ahora verifica al técnico cuando tiene **al menos un
documento y TODOS están aprobados** (robusto a cuántos y qué tipos suba), fijando
`tecnico_verificado=True` y `estado_verificacion="APROBADO"`. Se agregaron logs de
diagnóstico. Se desatascó al técnico ya afectado en la BD ejecutando la función corregida.

### Archivos modificados
- `backend/app/services/documento_tecnico_service.py`

### Verificación
HTTP end-to-end: registro de técnico (201, `PENDIENTE`) → admin aprueba el documento
(`PUT /documentos-tecnicos/{id}/aprobar`, 200) → técnico auto-verificado a `APROBADO` /
`verificado=true`. El técnico afectado (18291418-5) quedó `APROBADO`.

### Observaciones
El técnico verá el cambio al recargar su dashboard o volver a iniciar sesión (el dashboard
re-consulta el perfil en cada carga y con el botón "Actualizar trabajos"); no requiere
reemitir el token. Sigue existiendo la vía directa "Aprobar técnico pendiente"
(`PUT /admin/tecnicos/{rut}/verificar`) que aprueba sin depender de los documentos.

## M-33 · 2026-07-06 — Cambio de contraseña desde el perfil + perfil del administrador
**Categoría:** Mejora funcional

### Problema detectado
Ningún rol podía cambiar su contraseña desde la app, y el Administrador no tenía
página para editar su perfil (secciones 1 y 5 del requerimiento de gestión de usuarios).

### Solución implementada
- **Backend:** `PUT /usuarios/me/password` (autenticado) con schema `CambioPassword`
  (actual + nueva + confirmación). Valida la contraseña actual (`verify_password`), la
  fuerza de la nueva (8+, mayúscula, minúscula, número), que la confirmación coincida y
  que la nueva sea distinta de la actual; guarda con `hash_password` y **renueva el token**.
- **Frontend:** componente reutilizable `CambiarPassword` (3 campos con mostrar/ocultar,
  validación en vivo, mensajes de éxito/error, guarda el token renovado). Servicio
  `changeMyPassword`. Se integró en los perfiles de Cliente, Técnico y Administrador.
- **Perfil del administrador:** nueva página `AdminPerfil` (`/admin/perfil`, dentro del
  layout admin) con edición de datos personales (reusa `updateMyProfile`, Región→Comuna y
  confirmación de correo) + cambio de contraseña, con enlace "Mi Perfil" en el sidebar.

### Archivos modificados
- `backend/app/schemas/usuario_schema.py`, `backend/app/routers/usuario_router.py`
- `frontend/src/services/userService.ts`, `frontend/src/components/CambiarPassword.tsx` (nuevo)
- `frontend/src/pages/admin/AdminPerfil.tsx` (nuevo), `frontend/src/pages/cliente/ClientePerfil.tsx`,
  `frontend/src/pages/tecnico/TecnicoPerfil.tsx`, `frontend/src/routes/AppRoutes.tsx`,
  `frontend/src/layouts/AdminLayout.tsx`

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo: contraseña actual incorrecta (400), nueva débil (422), confirmación no coincide (400),
cambio válido (200) con login nuevo (200) y viejo (401).

### Observaciones
Las contraseñas semilla (ej. `cliente123`) no cumplen las reglas de fuerza (sin mayúscula):
sirven para login pero no pueden re-establecerse por el endpoint (por diseño). Pendiente
por fases: recuperación de contraseña, y perfiles enriquecidos de técnico/cliente.

## M-34 · 2026-07-06 — Recuperación de contraseña ("¿Olvidaste tu contraseña?")
**Categoría:** Seguridad / Mejora funcional

### Problema detectado
No existía forma de recuperar la contraseña si el usuario la olvidaba (sección 2 del
requerimiento de gestión de usuarios).

### Solución implementada
Flujo completo de recuperación por correo, para los tres roles:
- **Modelo `password_reset_token`** (migración idempotente): guarda el **hash** del token
  (nunca el token en claro), su expiración (60 min) y si fue usado. FK a usuario con CASCADE.
- **`POST /usuarios/password/recuperar`** (público): busca el usuario por correo; si existe
  y está activo, invalida tokens previos, genera un token seguro (`secrets.token_urlsafe`),
  guarda su hash y envía el enlace por correo. **No revela** si el correo existe (siempre 200).
- **`POST /usuarios/password/restablecer`** (público): valida token (existe, no usado, no
  expirado) y la fuerza de la nueva contraseña, actualiza con `hash_password` y marca el
  token como usado (un solo uso).
- **Servicio de email** (`email_service`) por SMTP con degradación: si no hay `SMTP_*`
  configurado, registra el enlace en el log del backend (para pruebas).
- **Frontend:** enlace "¿Olvidaste tu contraseña?" en el login; página `/recuperar`
  (ingresar correo) y `/restablecer?token=...` (nueva contraseña con validación). Servicios
  `requestPasswordReset` y `resetPassword`.
- Config `SMTP_HOST/PORT/USER/PASSWORD/FROM` y `FRONTEND_URL` en docker-compose y `.env.example`.

### Archivos modificados
- `backend/app/models/password_reset.py` (nuevo), `backend/app/models/__init__.py`, `backend/app/main.py`
- `backend/database/migrations/20260708_add_password_reset_token.sql` (nuevo)
- `backend/app/services/email_service.py` (nuevo), `backend/app/services/password_reset_service.py` (nuevo)
- `backend/app/schemas/usuario_schema.py`, `backend/app/routers/usuario_router.py`, `backend/.env.example`
- `frontend/src/services/userService.ts`, `frontend/src/pages/auth/RecuperarPassword.tsx` (nuevo),
  `frontend/src/pages/auth/RestablecerPassword.tsx` (nuevo), `frontend/src/pages/auth/Login.tsx`,
  `frontend/src/routes/AppRoutes.tsx`, `docker-compose.yml`

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo: solicitar (200), correo inexistente no revela (200), restablecer con débil (422) y
válido (200), login con la nueva (200), reuso del token (400), token inválido (400).

### Observaciones
Para enviar correos reales, configurar `SMTP_*` en el `.env` (Gmail requiere contraseña de
aplicación). Sin SMTP, el enlace queda en `docker logs` del backend para pruebas. Pendiente
por fases: perfiles enriquecidos de técnico y cliente (secciones 3 y 4).

## M-35 · 2026-07-06 — Perfil enriquecido del técnico (validación, documentos, valoraciones y trabajos)
**Categoría:** Mejora funcional / Gestión de perfiles (Fase 3, sección 3)

### Problema detectado
El perfil del técnico (`/tecnico/perfil`) era solo un formulario de edición de datos y
cambio de contraseña. Faltaba lo que pide la sección 3 del requerimiento: ver el estado de
validación, gestionar sus certificados/documentos (incluido rechazo con motivo y reenvío),
ver sus valoraciones y su historial de trabajos.

### Solución implementada
Perfil reorganizado en **pestañas** (Datos y validación · Documentos · Valoraciones · Trabajos)
y soporte de **estado por documento** en el backend:
- **Estado por documento (BD):** nueva columna `estado_documento`
  (`PENDIENTE`/`APROBADO`/`RECHAZADO`) y `motivo_rechazo` en `documento_tecnico`. Antes solo
  existía el booleano `documento_aprobado`, que no distinguía "pendiente" de "rechazado" ni
  guardaba el motivo. Migración idempotente con backfill (`documento_aprobado=TRUE` → `APROBADO`).
- **`PUT /documentos-tecnicos/{id}/rechazar`** ahora exige `motivo_rechazo` (400 si viene
  vacío) y fija estado `RECHAZADO`; **aprobar** fija `APROBADO`; subir fija `PENDIENTE`.
- **`DELETE /documentos-tecnicos/{id}`** (nuevo, solo técnico dueño): elimina un documento
  propio no aprobado (borra archivo físico + fila) para reemplazar/reenviar; 400 si ya está
  aprobado, 403 si es de otro técnico.
- **Panel del admin** (`TechnicianManagement`): badge de 3 estados, botón "Rechazar
  documento" con modal de motivo (el técnico luego lo ve).
- **Perfil del técnico** (pestañas):
  - *Datos y validación:* tarjeta con estado de verificación, nivel/experiencia, fechas de
    solicitud y revisión, observación del admin y estado de cuenta, más el formulario de
    edición y el cambio de contraseña ya existentes.
  - *Documentos:* subir (tipo + archivo), listar con estado por documento, ver el motivo del
    rechazo, y eliminar/reenviar (con modal de confirmación).
  - *Valoraciones:* promedio en estrellas, total, resumen de reputación (IA/local con
    fortalezas y aspectos a mejorar) y lista de comentarios.
  - *Trabajos:* contadores (completados/en curso/cancelados) e historial con estado y monto.
- **Reutilización:** nuevos utils `format.ts` (fechas, montos, URL de uploads) y
  `verificacion.ts` (etiquetas/colores de estado); se reutilizan `SectionCard`, `StatCard`,
  `Modal`, `EmptyState`.

### Archivos modificados
- `backend/database/migrations/20260709_add_documento_estado_revision.sql` (nuevo)
- `backend/app/models/documento_tecnico.py`, `backend/app/schemas/documento_tecnico_schema.py`,
  `backend/app/services/documento_tecnico_service.py`, `backend/app/routers/documento_tecnico_router.py`
- `frontend/src/services/technicianService.ts`, `frontend/src/services/reviewService.ts`
- `frontend/src/utils/format.ts` (nuevo), `frontend/src/utils/verificacion.ts` (nuevo)
- `frontend/src/pages/tecnico/TecnicoPerfil.tsx` (reescrito como shell con pestañas)
- `frontend/src/pages/tecnico/perfil/DatosTab.tsx`, `DocumentosTab.tsx`, `ValoracionesTab.tsx`,
  `TrabajosTab.tsx` (nuevos)
- `frontend/src/pages/admin/TechnicianManagement.tsx`,
  `frontend/src/tests/admin/TechnicianManagement.test.tsx`

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo (Docker): migración aplicada (columnas `estado_documento`/`motivo_rechazo` con
backfill), subir→`PENDIENTE` (200), eliminar aprobado→400, rechazar sin motivo→400, rechazar
con motivo→`RECHAZADO`+motivo (200), eliminar rechazado→200; resumen de reputación y
solicitudes del técnico responden con la forma esperada.

### Observaciones
"Reenviar" un documento rechazado = eliminarlo y subir la versión corregida (queda
`PENDIENTE`). No se permite borrar documentos aprobados para no romper la verificación
automática del técnico. Pendiente por fases: perfil enriquecido del cliente (sección 4).

## M-36 · 2026-07-06 — Perfil enriquecido del cliente (solicitudes, calificaciones y comprobantes)
**Categoría:** Mejora funcional / Gestión de perfiles (Fase 3, sección 4)

### Problema detectado
El perfil del cliente (`/cliente/perfil`) era solo un formulario de edición de datos y
cambio de contraseña. Faltaba lo que pide la sección 4: historial de solicitudes con su
estado y el técnico que atendió, las calificaciones que el cliente emitió y sus comprobantes.

### Solución implementada
Perfil reorganizado en **pestañas** (Mis datos · Solicitudes · Calificaciones · Comprobantes):
- **Backend:** nuevo **`GET /resenas/cliente/{rut}`** (privado: dueño o admin) que lista las
  reseñas emitidas por el cliente (`Resena.usuario_rut == rut`, activas). Antes solo existía
  el listado por técnico.
- **Mis datos:** tarjeta de cuenta (estado, correo, teléfono) + formulario de edición +
  cambio de contraseña.
- **Solicitudes:** historial completo con estado, servicio, **técnico que atendió** (nombre)
  y monto de las finalizadas.
- **Calificaciones:** reseñas emitidas cruzadas con la solicitud para mostrar técnico y
  servicio de cada una.
- **Comprobantes:** por cada solicitud finalizada con costo, un comprobante imprimible /
  descargable como PDF (ventana de impresión con folio, cliente, técnico, servicio, fecha y
  monto).
- **Reutilización:** se extrajo el formulario de datos a un componente compartido
  `PerfilDatosForm` usado por el perfil del técnico y del cliente (elimina la duplicación del
  formulario). Los nombres de técnico se resuelven con `getPublicTechnicianProfiles` y los de
  servicio con `getServicios`; se reutilizan los utils `format.ts` y `verificacion.ts`.

### Archivos modificados
- `backend/app/routers/resena_router.py`
- `frontend/src/services/reviewService.ts`
- `frontend/src/components/perfil/PerfilDatosForm.tsx` (nuevo, compartido)
- `frontend/src/pages/tecnico/perfil/DatosTab.tsx` (usa el formulario compartido)
- `frontend/src/utils/comprobante.ts` (nuevo)
- `frontend/src/pages/cliente/ClientePerfil.tsx` (reescrito como shell con pestañas)
- `frontend/src/pages/cliente/perfil/DatosTab.tsx`, `SolicitudesTab.tsx`,
  `CalificacionesTab.tsx`, `ComprobantesTab.tsx` (nuevos)

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo (Docker): `GET /resenas/cliente/{rut}` propio→200, de otro cliente→403; el cruce de
datos verificado con un cliente semilla (2 reseñas, 2 solicitudes finalizadas con técnico,
servicio y costo; los nombres públicos de técnico resuelven correctamente).

### Observaciones
No existe una entidad de "comprobante" en la BD; el comprobante se genera desde los datos de
la solicitud finalizada (folio = id de solicitud). La descarga usa la ventana de impresión del
navegador (permite guardar como PDF); si el navegador bloquea las ventanas emergentes se avisa
al usuario. Con esto se completan las cuatro secciones del requerimiento de gestión de
usuarios/perfiles (Fases 1–3).

## M-37 · 2026-07-06 — Cotizaciones: monto íntegro + PDF profesional con firmas + estados (Fase B)
**Categoría:** Corrección de bug / Mejora funcional (flujo de cotizaciones)

### Problema detectado
1. **Bug del monto:** el técnico ingresaba `$20.000` y el cliente veía `20`. Causa: el input
   era `type="number"` y se parseaba con `Number("20.000")`, que interpreta el punto como
   separador decimal → `20`. La BD (`Numeric(10,2)`) y el schema (`Decimal`) eran correctos;
   el valor se perdía en el frontend antes de enviarse.
2. El PDF de la cotización era un borrador básico (texto plano), sin formato profesional ni
   firmas, y no se regeneraba al aceptar/rechazar.

### Solución implementada
- **Monto:** input CLP dedicado (`type="text"` + `inputMode="numeric"`) que guarda solo
  dígitos y muestra separador de miles (`formatMilesCL`); se envía el entero de pesos. Todos
  los displays usan `formatCLP` (helpers nuevos en `utils/format.ts`: `soloDigitos`,
  `formatMilesCL`). Verificado en vivo: se almacena `20000.00`.
- **PDF profesional** (`app/pdf/cotizacion_pdf.py`, reescrito con ReportLab) según el formato
  de referencia: encabezado con logo FixYa + N° `COT-AAAA-NNNN` + fecha, barra de estado,
  datos del técnico (con especialidad y calificación) y del cliente, descripción del trabajo,
  tabla de detalle con "incluye materiales" y **TOTAL A PAGAR**, condiciones del servicio,
  y **dos bloques de firma**: técnico (siempre, nombre/RUT/fecha, "verificado por FixYa") y
  cliente ("Pendiente de aceptacion" hasta que acepta; luego nombre/RUT/fecha de aceptación).
  El PDF se **regenera** al aceptar (estado ACEPTADA + firma del cliente) y al rechazar.
- **Flag de materiales:** nueva columna `materiales_incluidos` (migración idempotente) + en
  schema, service, y checkbox en el formulario del técnico.
- **Estados:** se agrega **EXPIRADA**. El backend bloquea aceptar una cotización vencida
  (marca EXPIRADA + 409); el frontend del cliente la muestra como "Expirada" y oculta el botón
  de aceptar.
- **Cliente:** descarga del PDF, **modal de confirmación** antes de aceptar (la aceptación
  asigna al técnico y rechaza las demás), y visualización de vigencia/materiales. **Técnico:**
  enlace "Ver PDF" e indicador de materiales en "Mis cotizaciones".

### Archivos modificados
- `backend/database/migrations/20260710_add_cotizacion_materiales.sql` (nuevo)
- `backend/app/models/cotizacion.py`, `backend/app/schemas/cotizacion_schema.py`,
  `backend/app/services/cotizacion_service.py`, `backend/app/pdf/cotizacion_pdf.py` (reescrito)
- `frontend/src/utils/format.ts`, `frontend/src/services/cotizacionService.ts`
- `frontend/src/pages/tecnico/TecnicoDashboard.tsx`,
  `frontend/src/pages/cliente/ClienteDashboard.tsx`,
  `frontend/src/tests/tecnico/TecnicoDashboard.test.tsx`

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo (Docker): crear cotización con monto 20.000 → **BD 20000.00** (íntegro); PDF generado
(~3.8 KB); aceptar → estado ACEPTADA + `fecha_aceptacion` + PDF regenerado con firma del
cliente; solicitud pasa a ASIGNADO (se revirtió la semilla tras la prueba). Guardas de
expiración y rechazo validadas.

### Observaciones
Se optó por **total único + flag de materiales** (no ítems editables) por acuerdo con el
usuario. `reportlab` ya estaba en `requirements.txt`. Pendiente Fase C: creación automática
del chat privado al aceptar y su mensajería.

## M-38 · 2026-07-06 — Chat privado automático al aceptar la cotización (Fase C)
**Categoría:** Mejora funcional (coordinación cliente-técnico)

### Problema detectado
Tras aceptar una cotización no existía forma de que cliente y técnico coordinaran el trabajo
(fecha, hora, materiales, cambios). No había ningún sistema de mensajería en la plataforma.

### Solución implementada
Chat privado 1:1 que se **crea automáticamente solo cuando el cliente acepta** la cotización
(no antes), atado a esa solicitud y cotización:
- **Modelo:** `chat` (uno por cotización aceptada, con `cliente_rut`/`tecnico_rut`) y
  `mensaje_chat` (emisor, contenido, `fecha_envio`, `leido`). Tablas creadas por
  `create_all`.
- **Creación automática:** `aceptar_cotizacion` llama a `crear_chat_para_cotizacion`
  (idempotente) dentro de la misma transacción, después de regenerar el PDF.
- **Endpoints** (`/chats`, auth por participante): `GET /chats/solicitud/{id}` (devuelve el
  chat o 404 si aún no existe), `GET /chats/{id}/mensajes` (marca como leídos los recibidos),
  `POST /chats/{id}/mensajes` (valida no-vacío, crea el mensaje y **notifica** al otro con
  una `Notificacion` tipo `CHAT`). Un tercero recibe 403.
- **Frontend:** `chatService.ts` + componente reutilizable `ChatPanel` con **polling** cada
  4 s (near-realtime según la arquitectura actual), historial con fecha/hora, alineación por
  remitente (míos a la derecha), indicador enviado/leído (✓ / ✓✓) y auto-scroll. Integrado en
  el dashboard del **cliente** ("Chat con el técnico") y del **técnico** ("Chat con el
  cliente"), disponible una vez que la solicitud está asignada. Las notificaciones de mensaje
  nuevo aparecen por el sistema de notificaciones ya existente (polling).

### Flujo completo verificado
Solicitud → técnico cotiza (PDF) → cliente revisa/descarga PDF → acepta (confirmación) → PDF
se regenera con ambas firmas + estado ACEPTADA → **se habilita el chat automáticamente** →
ambos coordinan por mensajes.

### Archivos modificados
- `backend/app/models/chat.py` (nuevo), `backend/app/models/__init__.py`,
  `backend/app/schemas/chat_schema.py` (nuevo), `backend/app/services/chat_service.py` (nuevo),
  `backend/app/routers/chat_router.py` (nuevo), `backend/app/main.py`,
  `backend/app/services/cotizacion_service.py`
- `frontend/src/services/chatService.ts` (nuevo),
  `frontend/src/components/chat/ChatPanel.tsx` (nuevo),
  `frontend/src/pages/cliente/ClienteDashboard.tsx`,
  `frontend/src/pages/tecnico/TecnicoDashboard.tsx`

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo (Docker): al aceptar se crea el chat (1 por cotización); ambos participantes acceden;
mensajes en ambos sentidos; los recibidos se marcan leídos al listar; se generan 2
notificaciones tipo CHAT; un tercero recibe 403. Router HTTP: sin token 401, solicitud sin
chat 404, mensaje vacío 422. Pruebas con datos reales revertidas (semilla intacta).

### Observaciones
El chat usa **polling** (no WebSockets) por acuerdo con el usuario y para no agregar
infraestructura nueva; es casi instantáneo en la práctica. Queda como posible mejora futura
migrar a WebSockets. Con esto el flujo de cotizaciones queda completo: monto íntegro, PDF
profesional con firmas, estados, aceptación con confirmación y chat de coordinación.

Adicional (integridad del monto en todas las etapas): se aplicó el mismo input CLP y
`formatCLP` al **costo final** que el técnico registra al finalizar el trabajo
(`TecnicoDashboard`), que tenía el mismo bug latente `type="number"` + display crudo.

## M-39 · 2026-07-07 — Cambio de alcance del trabajo (nueva cotización con trazabilidad)
**Categoría:** Mejora funcional (gestión profesional de servicios)

### Problema detectado
Si al llegar al domicilio el técnico detecta que el trabajo real es mucho mayor que lo
cotizado (ej.: cotizó $25.000 por un enchufe pero el cableado de 3 piezas está quemado y el
costo real es $100.000), no era correcto modificar la cotización ya aceptada. No existía forma
de anular ese acuerdo por cambio de alcance y generar uno nuevo con trazabilidad.

### Solución implementada
Flujo completo de **cambio de alcance** que conserva todo el historial:
- **Modelo/BD** (migración idempotente): `cotizacion.cotizacion_origen_id` (vínculo a la
  cotización original), `cotizacion.plazo_estimado`, `mensaje_chat.es_sistema` (avisos
  automáticos), y se amplió `estado_cotizacion` a `VARCHAR(30)` para el nuevo estado.
- **Endpoint** `POST /cotizaciones/{id}/cambio-alcance` (solo el técnico dueño). El servicio
  `solicitar_cambio_alcance`: valida que la original esté ACEPTADA y el trabajo en
  ASIGNADO/EN_PROCESO; marca la original como **`ANULADA_CAMBIO_ALCANCE`** (se conserva, con
  motivo) y regenera su PDF; crea una **nueva cotización ENVIADA vinculada** (nuevo
  diagnóstico, materiales, plazo y valor) con su PDF; pasa la solicitud a
  **`CAMBIO_ALCANCE`**; registra `HistorialSolicitud`; **notifica** al cliente; y agrega un
  **mensaje automático de sistema** al chat existente (que se conserva).
- **Aceptar/Rechazar la nueva:** se ajustó `aceptar_cotizacion` para permitir la cotización de
  cambio de alcance (la solicitud no está "cotizable" pero sí en CAMBIO_ALCANCE) → al aceptar,
  el trabajo continúa (ASIGNADO) con mensaje de sistema; `rechazar_cotizacion` detecta que es
  de cambio de alcance y deja la solicitud **CANCELADA** (con notificación y aviso en chat).
- **Chat único por solicitud:** `crear_chat_para_cotizacion` ahora reutiliza el chat de la
  solicitud (no crea uno nuevo por cotización), preservando la conversación.
- **Frontend técnico:** botón "Solicitar cambio de alcance" en trabajos ASIGNADO/EN_PROCESO +
  modal con motivo (predefinido o personalizado), nuevo diagnóstico, nuevo valor (input CLP),
  plazo, materiales y vigencia. **Frontend cliente:** la nueva cotización aparece resaltada
  ("Nueva cotización por cambio de alcance, reemplaza a la #N"), con el motivo del cambio y el
  plazo; estados con etiquetas legibles (`getCotizacionEstadoLabel`). **Chat:** los mensajes
  de sistema se muestran centrados y diferenciados.

### Trazabilidad garantizada
Quedan registrados: cotización original (estado ANULADA_CAMBIO_ALCANCE + motivo), nueva
cotización (vínculo `cotizacion_origen_id`), fecha y autor del cambio (`HistorialSolicitud`),
estado de ambas cotizaciones y de la solicitud, notificación y aviso en el chat.

### Archivos modificados
- `backend/database/migrations/20260711_add_cambio_alcance.sql` (nuevo)
- `backend/app/models/cotizacion.py`, `backend/app/models/chat.py`,
  `backend/app/schemas/cotizacion_schema.py`, `backend/app/schemas/chat_schema.py`,
  `backend/app/services/cotizacion_service.py`, `backend/app/services/chat_service.py`,
  `backend/app/routers/cotizacion_router.py`, `backend/app/pdf/cotizacion_pdf.py`
- `frontend/src/services/cotizacionService.ts`, `frontend/src/services/chatService.ts`,
  `frontend/src/components/chat/ChatPanel.tsx`, `frontend/src/utils/requestStatus.ts`,
  `frontend/src/pages/tecnico/TecnicoDashboard.tsx`,
  `frontend/src/pages/cliente/ClienteDashboard.tsx`

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo (Docker), flujo completo: cotización $25.000 aceptada → cambio de alcance a $100.000 →
original `ANULADA_CAMBIO_ALCANCE` (con motivo), nueva ENVIADA (origen vinculado, plazo, PDF),
solicitud `CAMBIO_ALCANCE`, mensaje de sistema en el chat y notificación al cliente → cliente
acepta → nueva ACEPTADA y solicitud ASIGNADO (continúa). Auth del endpoint: sin token 401,
cliente 403. Pruebas revertidas (semilla intacta).

### Observaciones
Para no multiplicar estados, los sub-estados ("nueva cotización enviada/aceptada/rechazada")
se representan combinando `solicitud.estado_trabajo = CAMBIO_ALCANCE` con el
`estado_cotizacion` de la nueva cotización. Al rechazarla, la solicitud queda CANCELADA
(cancelado por cambio de alcance).

## M-40 · 2026-07-07 — UX de publicación de reseñas + auditoría QA integral y correcciones
**Categoría:** Corrección de bug / Seguridad / Consistencia / UX (previo a producción)

### Problema puntual (reseñas)
Al publicar una reseña se guardaba bien (con UNIQUE en BD que impide duplicados), pero la
confirmación solo aparecía en el banner global (arriba), lejos del formulario, y el bloque
"Califica el servicio" seguía ofreciendo el formulario tras publicar (permitía reintentos que
daban 400).

### Solución (reseñas)
- Confirmación **inline persistente**: al publicar, el bloque se reemplaza por "¡Reseña
  publicada con éxito! Gracias por compartir tu experiencia." (verde). Se rastrean las
  solicitudes ya reseñadas (`getClientReviews` al cargar + al publicar) para no volver a
  mostrar el formulario. El botón ya tenía loading y anti-doble-clic; el backend ya bloquea
  duplicados por UNIQUE, y ahora `crear_resena` captura `IntegrityError` → 400 claro (no 500).

### Auditoría QA (5 agentes en paralelo: UX/HTTP, admin, backend, flujos, auth/sesiones)
**Correcciones aplicadas (backend):**
- **Seguridad:** `GET /cotizaciones/{id}` ahora exige auth + propiedad (era lectura pública
  IDOR); `GET /resenas/` y `/resenas/reportadas` detrás de `solo_admin` (cola de moderación
  era pública); `get_current_usuario` rechaza usuarios desactivados (token vivo ya no opera);
  login con mensaje genérico (menos enumeración); saneamiento del nombre de archivo subido
  (evita path traversal); `resolver_reporte_resena` usa `usuario_tiene_rol` (multi-rol).
- **Validación de montos/fechas:** `monto_estimado` y `costo_final` con `gt=0` y tope
  `Numeric(10,2)` (evita negativos/cero y 500 por overflow); `mensaje_cotizacion`/`plazo`/
  `comentario` con `max_length` = ancho de columna; `fecha_vigencia` debe ser futura.
- **Estados/consistencia:** `CAMBIO_ALCANCE` agregado a `ESTADOS_SOLICITUD_VALIDOS` (el admin
  puede destrabar); al salir de un estado terminal se restaura `solicitud_activa`; cancelar
  solicitud **anula** las cotizaciones vivas y notifica al técnico; rechazar cotización normal
  ahora **notifica** al técnico; iniciar/finalizar trabajo **notifican** al cliente; los
  mensajes de sistema del chat no inflan el contador de no leídos.
**Correcciones aplicadas (frontend):**
- **Sesiones:** interceptor global de `fetch` que ante un 401 cierra sesión y redirige a
  `/login` (evita la app "colgada" al expirar el token); guard anti-doble-submit en Login,
  AdminLogin y Register; el login **relaya el mensaje real** del backend (ej. cuenta
  desactivada) en vez de un texto fijo.
- **Notificaciones:** el Navbar ahora **sondea** cada 30 s (antes solo al montar).
- **CAMBIO_ALCANCE en la UI:** color en `StatusBadge`/`getEstadoStyle`, panel informativo en
  la tarjeta del técnico, `RequestProgress` lo ubica en "En proceso" (no reinicia a 0), y la
  lista de cotizaciones del técnico muestra "Expirada" con el mismo criterio que el cliente.
- **Admin:** `RequestManagement` da feedback al resolver un reporte y ya no corta la lista a 5
  (reportes 6+ eran inalcanzables); `ReviewManagement` refresca sin el spinner de página
  completa que destruía la fila.
- **Cliente:** botón "Cancelar solicitud" con confirmación (el endpoint existía sin UI).

### Recomendado (no aplicado — mayor alcance o riesgo, documentado para el equipo)
- Índice único parcial para "una sola cotización ACEPTADA por solicitud" y "una por
  (solicitud, técnico)" — requiere migración y convivir con el cambio de alcance; hoy mitigado
  por el modal de confirmación + botones deshabilitados en el frontend.
- Job/barrido para marcar `EXPIRADA` (hoy es lazy al aceptar; el frontend ya la muestra).
- Paginación en endpoints de listado (`/usuarios/`, `/solicitudes/`, etc.) — riesgo de escala,
  no funcional en demo; incluye N+1 en `/usuarios/`.
- Idempotencia del registro de técnico multi-paso (si falla la subida del documento tras crear
  la cuenta, el reintento choca con "RUT/correo ya registrado").
- Límite de tamaño y allowlist de tipos en subida de archivos; `Content-Disposition: attachment`.
- Normalizar correo (lower) en `PUT /usuarios/me`; borrar el archivo PDF si la transacción hace
  rollback (archivo huérfano).

### Archivos modificados (principales)
- Backend: `dependencies.py`, `routers/{cotizacion,resena,solicitud,usuario}_router.py`,
  `services/{cotizacion,chat,archivo}_service.py`, `services/solicitud_service.py`,
  `schemas/{cotizacion,solicitud,resena}_schema.py`
- Frontend: `services/{authService,httpInterceptor,solicitudService}.ts`, `main.tsx`,
  `components/Navbar.tsx`, `components/ui/{StatusBadge,RequestProgress}.tsx`,
  `components/auth/AdminLoginModal.tsx`, `utils/requestStatus.ts`,
  `pages/auth/{Login,Register}.tsx`, `pages/cliente/ClienteDashboard.tsx`,
  `pages/tecnico/TecnicoDashboard.tsx`, `pages/admin/{RequestManagement,ReviewManagement}.tsx`
- Tests: `tests/auth/Login.test.tsx`, `tests/services/authService.test.ts` (actualizados al
  nuevo comportamiento de mensajes de error)

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (los 6 rojos son los preexistentes de
`TecnicoDashboard`). En vivo (Docker): 401 sin token / 403 no-dueño en cotización; moderación
403 para no-admin; login genérico; monto 0 → 422; cancelar anula la cotización y deja la
solicitud CANCELADA. Pruebas con datos reales revertidas (semilla intacta).

## M-41 · 2026-07-07 — Comprobante profesional de trabajo finalizado (Fase A)
**Categoría:** Mejora funcional (trazabilidad / respaldo documental)

### Problema
El "comprobante" de un trabajo finalizado era básico (impresión client-side). Se necesitaba
un comprobante profesional en PDF como respaldo para cliente, técnico y administración.

### Solución
- **Campos nuevos en `solicitud`** (migración idempotente `20260713`): `costo_materiales`,
  `metodo_pago`, `garantia`, `observaciones_finales`, `comprobante_codigo`,
  `archivo_comprobante_url`.
- **`app/pdf/comprobante_pdf.py`** (nuevo): PDF profesional con encabezado + logo, N° de
  comprobante (`COMP-AAAA-NNNNN`), fecha de emisión, estado FINALIZADO, datos de técnico
  (con especialidad) y cliente, N° de solicitud, servicio, dirección, **fecha/hora de inicio
  y término**, detalle de pago (**mano de obra / materiales / TOTAL**), método de pago,
  garantía, observaciones, y **constancia de aceptación** de ambas partes. Se guarda vía
  `storage_service` (R2 en prod, disco en dev).
- **`PUT /solicitudes/{id}/finalizar`**: ahora captura los datos del comprobante, genera el
  PDF, fija `comprobante_codigo`, registra el evento `COMPROBANTE_EMITIDO` en el historial y
  notifica al cliente que puede descargarlo. Validación: materiales ≤ total.
- **Frontend:** el formulario de finalizar del técnico pide monto total, valor de materiales
  (opcional), método de pago, garantía y observaciones; botón **"Descargar comprobante"** en
  trabajos finalizados (dashboard técnico y cliente) y en la pestaña **Comprobantes** del
  perfil del cliente (usa el PDF real del backend, con respaldo al imprimible antiguo).

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes). En vivo: migración
aplicada, comprobante generado para una solicitud real (PDF ~3.6 KB en `uploads/comprobantes`).
Trabajado en la rama `feature/auditoria-conflictos`.

### Pendiente (fases siguientes acordadas)
B) Audit Log de acciones admin · C) Estados + historial + línea de tiempo · D) Gestión de
conflictos (reportes durante el trabajo + cancelación según estado con revisión admin) · E) QA.

## M-42 · 2026-07-07 — Audit Log de acciones administrativas (Fase B)
**Categoría:** Mejora funcional / seguridad (trazabilidad y rendición de cuentas)

### Problema
Las acciones sensibles del administrador (aprobar/rechazar documentos, verificar/observar/
suspender/rechazar/eliminar técnicos, suspender/reactivar usuarios y moderar reseñas) se
ejecutaban sin dejar rastro. No existía forma de responder **quién** hizo **qué**, sobre
**quién**, **cuándo**, **por qué** y **desde dónde** — un requisito básico de auditoría y
control interno.

### Solución
- **Modelo `audit_log`** (`app/models/audit_log.py`, migración idempotente `20260714`): fila
  inmutable con `admin_rut` (FK a `usuario`, `ON DELETE SET NULL`) + `admin_correo`
  (respaldo legible), `accion`, `entidad_tipo`, `entidad_id`, `usuario_afectado_rut`,
  `motivo`, `estado_antes`, `estado_despues`, `detalle`, `ip` y `fecha`. Índices en las
  columnas de filtro.
- **`app/services/audit_service.py`** (nuevo): `registrar_auditoria(...)` escribe la bitácora
  en una transacción propia **después** de confirmarse la acción de negocio y **nunca
  propaga excepción** (auditar no debe tumbar la operación); `obtener_ip(request)` resuelve
  la IP real detrás de proxy/CDN vía `X-Forwarded-For` (Render/Cloudflare); `listar_auditoria`
  con filtros (`accion`, `entidad_tipo`, `admin_rut`, `usuario_afectado_rut`) y paginación
  acotada (≤500), orden descendente por fecha.
- **Instrumentación** de los endpoints admin, capturando el `estado_antes` antes de mutar:
  `admin_router` verificar/revisar técnico (acción según nuevo estado:
  APROBAR/OBSERVAR/SUSPENDER/RECHAZAR/REVISAR_TECNICO), `documento_tecnico_router`
  aprobar/rechazar documento, `usuario_router` suspender/reactivar usuario,
  `tecnico_router` eliminar técnico, `resena_router` aprobar/ocultar reseña con motivo.
- **Endpoint** `GET /admin/auditoria` (solo admin) con los filtros anteriores.
- **Frontend:** `services/auditService.ts`, página `pages/admin/AuditManagement.tsx` (tarjetas
  de filtro por tipo de entidad + tabla legible con badges de acción, cambio de estado
  antes→después, motivo/detalle e IP), ruta `/admin/auditoria` e ítem **"Auditoría"**
  (icono escudo) en el `AdminLayout`.

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo (Docker): migración aplicada (tabla + 7 índices + FK), login admin, revisión de
técnico `PENDIENTE→OBSERVADO` registrada con admin/correo/acción/afectado/motivo/estado
antes-después/IP/fecha; filtros por `accion` y `entidad_tipo` correctos. Datos de prueba
revertidos (técnico a PENDIENTE, `audit_log` vaciada; semilla intacta).
Trabajado en la rama `feature/auditoria-conflictos`.

### Pendiente (fases siguientes acordadas)
C) Estados + historial + línea de tiempo · D) Gestión de conflictos (reportes durante el
trabajo + cancelación según estado con revisión admin) · E) QA.

## M-43 · 2026-07-07 — Historial completo + línea de tiempo de la solicitud (Fase C)
**Categoría:** Mejora funcional (trazabilidad) + corrección de seguridad (autorización)

### Problema
El historial de estados de una solicitud (`historial_solicitud`) se registraba en las
transiciones (asignar/iniciar/finalizar/cancelar/cotización/cambio de alcance) pero **(a)** no
se registraba el evento de **creación**, así que la línea de tiempo empezaba "coja"; **(b)** no
existía ninguna **UI de línea de tiempo** para verlo; y **(c)** el endpoint
`GET /historial-solicitudes/solicitud/{id}` lo podía leer **cualquier usuario autenticado**
(fuga de autorización).

### Solución
- **Evento de creación:** `crear_solicitud` ahora registra el evento `INICIADO`
  ("Solicitud creada por el cliente") en la misma transacción, dando inicio a la línea de
  tiempo.
- **Autorización:** helper `_autorizar_ver_solicitud` en `historial_solicitud_router`; el
  historial y la línea de tiempo solo son visibles para el **cliente dueño**, el **técnico
  asignado** o un **admin** (403 en cualquier otro caso). Se aseguró también el endpoint
  existente.
- **Timeline enriquecido:** nuevo `GET /historial-solicitudes/solicitud/{id}/timeline`
  (schema `TimelineEventoResponse`) que devuelve los eventos en orden **cronológico** con el
  **nombre y rol del actor** resueltos en un solo lote (sin N+1), vía
  `listar_timeline_por_solicitud`.
- **Frontend:** `services/historyService.ts` + componente reutilizable
  `components/ui/SolicitudTimeline.tsx` (sección **desplegable** "Ver línea de tiempo",
  **carga perezosa** al abrir, línea de tiempo vertical con icono/color/etiqueta por estado —
  incluye `COTIZACION_ENVIADA`, `CAMBIO_ALCANCE`, `COMPROBANTE_EMITIDO`—, fecha, actor y
  motivo). Integrado en las **tres** vistas: dashboard del **cliente** (bajo el stepper),
  dashboard del **técnico** (en cada trabajo asignado) y **modal de detalle del admin**.

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo (Docker): timeline de solicitud real enriquecido con actor/rol en orden cronológico;
**403** para un cliente ajeno y **200** para el dueño; solicitud nueva creada por API registró
el evento `INICIADO`. Datos de prueba (solicitud creada) **eliminados**; semilla intacta.
Trabajado en la rama `feature/auditoria-conflictos`.

### Pendiente (fases siguientes acordadas)
D) Gestión de conflictos (reportes durante el trabajo con evidencia + cancelación según estado
con revisión admin) · E) QA.

## M-44 · 2026-07-07 — Gestión de conflictos y cancelación con revisión admin (Fase D)
**Categoría:** Mejora funcional (gestión de disputas / control operativo)

### Problema
No existía forma de gestionar problemas surgidos **durante** un trabajo: el cliente/técnico no
podían reportar un conflicto con evidencia, y la cancelación era directa y solo del cliente
(un trabajo EN_PROCESO podía cancelarse sin control). Faltaba un flujo con intervención del
administrador.

### Solución
**Nuevo estado `EN_REVISION_ADMIN`** en el ciclo de vida de la solicitud (trabajo pausado
mientras el admin revisa una cancelación).

- **Reportes de conflicto con evidencia** (modelos `conflicto_solicitud` + `conflicto_evidencia`,
  migración `20260715`): cliente o técnico reportan un conflicto sobre un trabajo en curso
  (tipos: trabajo incompleto/deficiente, no se presentó, cobro indebido, daños, etc.) con
  **hasta 5 archivos** (JPG/PNG/WEBP/PDF) guardados vía `storage_service` (R2/dev-disk).
  `conflicto_service` registra el evento en el historial y **notifica** a la contraparte;
  `POST /solicitudes/{id}/conflictos` (multipart), `GET /solicitudes/{id}/conflictos`,
  `GET /solicitudes/conflictos` (admin) y `PUT /solicitudes/conflictos/{id}/resolver`
  (CONFIRMADO/DESCARTADO) — la resolución se **audita** (Fase B) y notifica al reportante.
- **Cancelación según estado** (modelo `cancelacion_solicitud`): el endpoint `PUT
  /solicitudes/{id}/cancelar` (ahora abierto a cliente dueño **y** técnico asignado) bifurca:
  antes de iniciar (INICIADO/ASIGNADO/CAMBIO_ALCANCE) → **cancelación directa**; EN_PROCESO →
  crea una solicitud de cancelación y deja la solicitud en `EN_REVISION_ADMIN`. El admin
  resuelve con `PUT /solicitudes/cancelaciones/{id}/resolver`: **aprobar** → CANCELADO (anula
  cotizaciones vivas); **rechazar** → restaura el estado previo (EN_PROCESO). Todo con
  historial, **auditoría** y **notificaciones** a ambas partes.
- **Orden de rutas:** el `conflicto_router` se incluye antes que el `solicitud_router` para que
  las rutas literales (`/solicitudes/conflictos`, `/solicitudes/cancelaciones`) no las capture
  `/solicitudes/{id_solicitud}`.
- **Frontend:** `services/conflictoService.ts`; `cancelarSolicitud` ahora envía motivo y maneja
  la respuesta (directa vs. en revisión). Componente `ReportarConflictoModal` (tipo, descripción,
  evidencia con validación de tipo/tamaño) integrado en los dashboards de **cliente** y
  **técnico** (botones "Reportar problema" y "Cancelar/Solicitar cancelación" en trabajos en
  curso, con aviso de estado EN_REVISION_ADMIN). Nueva página admin
  `ConflictManagement.tsx` (pestañas Conflictos/Cancelaciones con evidencia descargable y
  acciones de resolución), ruta `/admin/conflictos` e ítem "Conflictos" en el `AdminLayout`.
  Estado `EN_REVISION_ADMIN` y eventos `CONFLICTO_REPORTADO` añadidos a `StatusBadge`,
  `requestStatus` y a la línea de tiempo (Fase C).

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (los 6 rojos son los preexistentes de
`TecnicoDashboard`). En vivo (Docker): migración aplicada (3 tablas + índices + FK). Flujo
completo probado sobre una solicitud EN_PROCESO real (tokens generados con `crear_token`):
técnico y cliente crearon conflictos (uno con 2 evidencias a disco), admin lo resolvió
CONFIRMADO (auditado); cliente y técnico solicitaron cancelación → `EN_REVISION_ADMIN`; admin
**rechazó** (volvió a EN_PROCESO) y **aprobó** (→ CANCELADO), ambos auditados
(APROBAR/RECHAZAR_CANCELACION con estado antes→después). Rutas literales no colisionan con
`/solicitudes/{id}`. **Datos de prueba revertidos**: solicitud 9014 restaurada a EN_PROCESO,
tablas de conflicto/cancelación vaciadas, `audit_log` truncada, notificaciones de prueba y
archivos de evidencia eliminados; semilla intacta. Trabajado en la rama
`feature/auditoria-conflictos`.

### Pendiente (fase siguiente acordada)
E) QA final (seguridad, concurrencia, edge cases) sobre las Fases A–D.

## M-45 · 2026-07-07 — Onboarding del técnico en dos etapas (Carnet primero)
**Categoría:** Mejora funcional (UX de registro / validación de identidad)

### Problema
En el registro, el técnico subía un único "documento técnico" genérico
(`CERTIFICADO_TECNICO`), lo que era confuso y no permitía validar bien el perfil. Además, la
auto-verificación marcaba al técnico como APROBADO en cuanto **todos los documentos subidos**
estaban aprobados: al aprobar su único documento quedaba verificado y **visible en el catálogo
público con validación incompleta**.

### Solución (flujo en 2 etapas)
- **Etapa 1 — Registro (`Register.tsx`):** el único documento requerido es ahora el **Carnet de
  Identidad** (label "Sube tu Carnet de Identidad (Obligatorio para iniciar)", ambos lados en un
  archivo PDF/imagen). Se sube con `tipo_documento="CARNET_IDENTIDAD"`. Se añadió una **alerta
  informativa** (Tailwind) avisando que el resto de la documentación se sube después desde
  "Mis Documentos" y que el perfil queda **pendiente de validación** hasta la aprobación del
  admin.
- **Etapa 2 — Cuenta del técnico:** el dashboard (`TecnicoDashboard.tsx`) refuerza el banner de
  "perfil pendiente" con un **CTA "Completar perfil · Mis Documentos"** (enlaza a
  `/tecnico/perfil?tab=documentos`; `TecnicoPerfil.tsx` abre esa pestaña vía `?tab=`).
  `DocumentosTab.tsx` muestra un **checklist de documentos requeridos** (Carnet + Antecedentes)
  con su estado (falta / en revisión / aprobado / rechazado) y el aviso de validación pendiente;
  títulos/certificaciones quedan opcionales.
- **Lógica de validación (`documento_tecnico_service.py`):** `verificar_tecnico_automaticamente`
  ahora exige el conjunto **`DOCUMENTOS_REQUERIDOS = {CARNET_IDENTIDAD, ANTECEDENTES}`** aprobado
  (antes bastaba con "todos los subidos"). Además **no revive** perfiles que el admin dejó
  `SUSPENDIDO`/`RECHAZADO`. Así el técnico permanece PENDIENTE y **fuera del catálogo público**
  hasta que el admin apruebe los documentos requeridos.

### Notas
- El **catálogo público ya estaba protegido**: `/tecnicos/publicos/perfiles`, `/top-rating` y
  `/buscar` filtran por `tecnico_verificado AND estado_verificacion=="APROBADO"`; `GET /tecnicos/`
  es solo-admin. No requirió cambios.
- El modelo `documento_tecnico` ya soportaba **N documentos por técnico** con estado por
  documento: **sin migración**.
- Técnicos antiguos con solo `CERTIFICADO_TECNICO` ya no auto-verifican con ese único documento;
  el admin conserva la aprobación manual (`PUT /admin/tecnicos/{rut}/verificar`).

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`).
En vivo (Docker): al aprobar **solo el carnet** el técnico siguió **PENDIENTE**; al aprobar
**carnet + antecedentes** pasó a **APROBADO / verificado**. Datos de prueba revertidos (técnico
a PENDIENTE, documentos y archivos eliminados, `audit_log` truncada); semilla intacta. Trabajado
en la rama `feature/auditoria-conflictos`.

## M-46 · 2026-07-07 — Revisión integral final (recuperación, reseed, UX, validaciones)
**Categoría:** Corrección + calidad + UX (preparación para la presentación final)

### 1. Recuperación de contraseña
**Causa raíz:** el código del flujo era correcto (token, hash, expiración 60 min, enlace, envío
con degradación). El fallo real: las cuentas de demo usan **correos ficticios** (no son buzones
reales) y en **producción** las `SMTP_*` no están seteadas. **Solución:** `DEMO_MODE` (env)
devuelve `enlace_demo` en `POST /usuarios/password/recuperar` y la página lo muestra en pantalla
para completar el flujo sin correo (apagar en prod real). Verificado end-to-end: recuperar →
enlace → restablecer → login; token de un solo uso; expiración. Archivos:
`password_reset_service.py`, `usuario_router.py`, `RecuperarPassword.tsx`, `docker-compose.yml`.

### 2-3. Limpieza y creación de usuarios
Reseed limpio (`backend/reseed_demo.py`, integrado en `seed.sql`): **2 admins · 16 técnicos
(2 por cada uno de los 8 servicios, verificados + docs Carnet/Antecedentes aprobados) · 4
clientes**, todos con RUT de DV válido, teléfono `9########`, correo válido y contraseña de
política (**Admin1234 / Tecnico1234 / Cliente1234**). `seed.sql` queda auto-suficiente desde una
BD vacía. Cambios en BD: `TRUNCATE ... CASCADE` de datos + inserción del set limpio.
**Pendiente prod:** requiere la External DB URL de Render (no disponible) o reset de la BD.

### 4-5. Formulario Crear Solicitud y selección de horarios (UX)
- **Simplificado:** se eliminaron 4 campos de horario redundantes (`horario_permitido_trabajos`,
  `horario_atencion`, `trabajo_fuera_horario`, `local_funcionando`) que ahora cubre el calendario.
- **Calendario semanal:** la selección de horarios pasó de dropdowns (día + jornada + desde/hasta)
  a un **calendario semanal de bloques clicables** (Mañana 09-13, Tarde 15-19, Noche 19-22): clic
  para seleccionar, otro clic para desmarcar; responsive. Mantiene la forma de datos
  `disponibilidad_horaria: [{dia, hora_inicio, hora_fin}]` (backend intacto).

### 6-7. Validaciones y calidad
- Política de contraseña **centralizada** en `backend/app/validators.py` (dedup de 3 copias);
  consistente frontend/backend.
- **Código muerto eliminado:** `addAvailabilityDay/updateAvailabilityDay/handleJornadaChange/
  removeAvailabilityDay`, `booleanText`, `joinDetails` y los 4 campos redundantes.

### Verificación
`py_compile`, `tsc -b`, `vite build` OK; Vitest 66/72 (6 preexistentes de `TecnicoDashboard`);
`SolicitudForm` 18/18 con el calendario nuevo. En vivo: reseed desde cero (8 servicios, 2/16/4,
16 en catálogo, 32 docs), logins de los 3 roles, recuperación completa, y creación de solicitud
con el payload simplificado (creada y limpiada). Trabajado en la rama `feature/auditoria-conflictos`.
