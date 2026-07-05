# Matriz completa de casos de prueba

Proyecto: FixYa  
Fecha de actualizacion: 18-06-2026
Suite funcional: `npm.cmd run test:run`  
Verificación no funcional: `npm.cmd run build`

## Resumen

No todas las pruebas documentadas son funcionales.

| Clasificación | Cantidad | Estado |
| ------------- | -------- | ------ |
| Casos funcionales automatizados | 60 | Aprobados |
| Caso no funcional de build | 1 | Fallido inicialmente, corregido y aprobado |
| Total documentado | 61 | Vigente |

## Casos funcionales

| Caso | Título de prueba | Tipo de prueba | Resultado esperado | Resultado obtenido | Estado | Severidad | Observación | Corregido |
| ---- | ---------------- | -------------- | ------------------ | ------------------ | ------ | --------- | ----------- | --------- |
| CP-AUTH-001 | Login cliente correcto | Funcional - autenticación | Autentica cliente, guarda sesión y redirige a `/cliente/dashboard`. | Se guardó `cliente-token`, sesión `CLIENTE` y navegación a `/cliente/dashboard`. | Aprobado | Alta | Valida acceso correcto por rol cliente. | No aplica |
| CP-AUTH-002 | Login técnico correcto | Funcional - autenticación | Autentica técnico, guarda sesión y redirige a `/tecnico/dashboard`. | Se guardó `tecnico-token`, sesión `TECNICO` y navegación a `/tecnico/dashboard`. | Aprobado | Alta | Valida acceso correcto por rol técnico. | No aplica |
| CP-AUTH-003 | Login admin correcto | Funcional - autenticación | Autentica admin, guarda sesión y redirige a `/admin/panel`. | Se guardó `admin-token`, sesión `ADMIN` y navegación a `/admin/panel`. | Aprobado | Alta | Valida acceso correcto al panel administrativo. | No aplica |
| CP-AUTH-004 | Bloqueo por rol incorrecto | Funcional - seguridad | Bloquea credenciales válidas si el rol seleccionado no coincide. | No redirige, limpia sesión/token y muestra error de rol. | Aprobado | Alta | Hallazgo real de seguridad funcional corregido. | Sí |
| CP-AUTH-005 | Login sin rol seleccionado | Funcional - validación | No autentica si no se selecciona rol. | No llama login, no redirige y muestra mensaje de selección de rol. | Aprobado | Media | Evita intención de acceso ambigua. | No aplica |
| CP-AUTH-006 | Credenciales inválidas | Funcional - negativa | No autentica ni guarda sesión con credenciales incorrectas. | No obtiene usuario, no navega, no guarda token y muestra error. | Aprobado | Alta | Verifica manejo de error de autenticación. | No aplica |
| CP-REG-001 | Renderizado del formulario | Funcional - componente | Muestra campos principales y botón de registro. | Renderizó campos principales y botón `Crear cuenta cliente`. | Aprobado | Baja | Verifica disponibilidad inicial del formulario. | No aplica |
| CP-REG-002 | Campos obligatorios | Funcional - validación | No envía datos vacíos y muestra errores. | No llamó `createUser` y mostró errores obligatorios. | Aprobado | Media | Cubre validaciones mínimas de registro. | No aplica |
| CP-REG-003 | Correo inválido | Funcional - validación | Bloquea formato de correo inválido. | No llamó backend y mostró mensaje de correo válido. | Aprobado | Media | Evita datos inválidos antes del backend. | No aplica |
| CP-REG-004 | Contraseña débil | Funcional - validación | Bloquea contraseña que no cumple reglas mínimas. | No llamó backend y mostró mensaje de mínimo 8 caracteres. | Aprobado | Media | Reduce registros inseguros o inválidos. | No aplica |
| CP-REG-005 | Mostrar/ocultar contraseña | Funcional - interacción | Alterna input entre `password` y `text`. | El botón alternó correctamente visibilidad de contraseña. | Aprobado | Baja | Mejora usabilidad del formulario. | No aplica |
| CP-REG-006 | Registro exitoso cliente | Funcional - flujo | Envía payload correcto y navega a login. | Llamó `createUser`, no dejó errores y navegó a `/login`. | Aprobado | Alta | También cubre mejora de accesibilidad en labels. | Sí |
| CP-ROUTE-001 | Usuario no autenticado | Funcional - rutas protegidas | Redirige a login si no hay sesión. | No mostró contenido protegido y renderizó `/login`. | Aprobado | Alta | Protege rutas privadas. | No aplica |
| CP-ROUTE-002 | Cliente accede a ruta cliente | Funcional - rutas protegidas | Permite acceso a dashboard cliente. | Obtuvo usuario con `cliente-token` y mostró contenido cliente. | Aprobado | Alta | Valida acceso permitido por rol. | No aplica |
| CP-ROUTE-003 | Cliente bloqueado en ruta admin | Funcional - seguridad | Impide acceso cliente a rutas admin. | No mostró contenido admin y redirigió al área del rol real. | Aprobado | Alta | Evita escalamiento de privilegios. | No aplica |
| CP-ROUTE-004 | Técnico accede a ruta técnico | Funcional - rutas protegidas | Permite acceso a dashboard técnico. | Obtuvo usuario con `tecnico-token` y mostró contenido técnico. | Aprobado | Alta | Valida acceso permitido por rol técnico. | No aplica |
| CP-ROUTE-005 | Admin accede a ruta admin | Funcional - rutas protegidas | Permite acceso al panel admin. | Obtuvo usuario con `admin-token` y mostró contenido admin. | Aprobado | Alta | Valida acceso administrativo. | No aplica |
| CP-ROUTE-006 | Token inválido o usuario no cargado | Funcional - seguridad | Limpia sesión y redirige a login. | Removió token, no mostró contenido privado y renderizó `/login`. | Aprobado | Alta | Verifica protección ante token inválido. | No aplica |
| CP-SERV-AUTH-001 | Login exitoso API | Funcional - servicio API | Llama `/usuarios/login` y retorna token. | Envió método, headers y body esperados; retornó `access_token`. | Aprobado | Alta | Valida contrato de autenticación frontend-backend. | No aplica |
| CP-SERV-AUTH-002 | Login API con credenciales inválidas | Funcional - servicio API negativa | Lanza error controlado ante respuesta fallida. | Con `ok: false`, lanzó `Credenciales incorrectas`. | Aprobado | Alta | Cubre error de autenticación desde servicio. | No aplica |
| CP-SERV-AUTH-003 | Usuario actual con token | Funcional - servicio API | Envía Bearer token y retorna usuario. | Llamó `/usuarios/me` con `Authorization`. | Aprobado | Alta | Valida consulta de sesión activa. | No aplica |
| CP-SERV-AUTH-004 | Error al obtener usuario actual | Funcional - servicio API negativa | Lanza error si el token no permite obtener usuario. | Con `ok: false`, lanzó `No se pudo obtener usuario`. | Aprobado | Alta | Cubre token inválido o sesión vencida. | No aplica |
| CP-SERV-USER-001 | Crear usuario API | Funcional - servicio API | Envía payload correcto a `/usuarios/`. | Llamó endpoint con POST y JSON esperado. | Aprobado | Alta | Valida creación de usuario desde servicio. | No aplica |
| CP-SERV-USER-002 | Error al crear usuario | Funcional - servicio API negativa | Usa mensaje del backend si existe. | Con `detail`, lanzó el mensaje retornado. | Aprobado | Media | Cubre duplicados o datos inválidos. | No aplica |
| CP-SERV-USER-003 | Listar usuarios con JWT | Funcional - servicio API | Envía Authorization y retorna usuarios. | Envió `Bearer admin-token` y retornó lista. | Aprobado | Alta | Necesario para gestión administrativa. | No aplica |
| CP-SERV-TECH-001 | Listar técnicos con JWT | Funcional - servicio API | Envía Authorization y retorna técnicos. | Llamó `/tecnicos/` con token y retornó lista. | Aprobado | Alta | Base para gestión y búsqueda de técnicos. | No aplica |
| CP-SERV-TECH-002 | Buscar técnicos por servicio y comuna | Funcional - servicio API | Construye URL con filtros y token. | Llamó `/tecnicos/buscar?servicio_id=100&comuna_id=10`. | Aprobado | Media | Valida búsqueda contextualizada. | No aplica |
| CP-SERV-TECH-003 | Obtener perfil técnico | Funcional - servicio API | Consulta perfil por RUT con token. | Llamó `/tecnicos/22.222.222-2/perfil` y retornó perfil. | Aprobado | Media | Verifica detalle de perfil técnico. | No aplica |
| CP-SERV-TECH-004 | Error al listar técnicos | Funcional - servicio API negativa | Lanza error controlado ante HTTP fallido. | Con `ok: false`, lanzó error de obtención de técnicos. | Aprobado | Media | Cubre falla del backend o red. | No aplica |
| CP-SOL-001 | Renderizado formulario solicitud | Funcional - componente | Muestra formulario, boton de solicitud y campos base del flujo. | Renderizo servicio, comuna, titulo, descripcion, urgencia, direccion, tipo de problema, referencia y selector de tipo de inmueble. | Aprobado | Baja | Verifica disponibilidad inicial del flujo cliente. | No aplica |
| CP-SOL-002 | Campos obligatorios solicitud | Funcional - validacion | No crea solicitud vacia y muestra errores. | No llamo `createSolicitud` y mostro errores para datos base y tipo de inmueble. | Aprobado | Media | Evita solicitudes incompletas. | No aplica |
| CP-SOL-003 | Carga de servicios | Funcional - catalogos | Muestra servicios activos y oculta inactivos. | Mostro `Gasfiteria` y `Electricidad`; oculto inactivo. | Aprobado | Media | Valida catalogos visibles al cliente. | No aplica |
| CP-SOL-004 | Crear solicitud para casa | Funcional - flujo | Envia payload de casa con estacionamiento, mascotas, acceso y disponibilidad. | Llamo `createSolicitud` con contexto de casa y mostro confirmacion. | Aprobado | Alta | Cubre payload completo del contexto residencial. | Si |
| CP-SOL-005 | Tipo de problema dinamico | Funcional - UX | Cambia opciones segun servicio y limpia seleccion invalida. | Cambio opciones por servicio y removio seleccion incompatible. | Aprobado | Media | Hallazgo UX corregido. | Si |
| CP-SOL-006 | Error backend al crear solicitud | Funcional - negativa | Muestra error, no limpia datos ni queda cargando. | Mostro error, reactivo boton y mantuvo datos ingresados. | Aprobado | Media | Cubre resiliencia ante fallo de creacion. | No aplica |
| CP-SOL-007 | Crear solicitud para departamento | Funcional - flujo | Envia numero, piso, conserjeria, autorizacion, horario, acceso y disponibilidad. | `createSolicitud` recibio contexto de departamento con nuevos campos. | Aprobado | Alta | Valida inmueble residencial vertical. | No aplica |
| CP-SOL-008 | Crear solicitud para edificio | Funcional - flujo | Envia oficina/departamento, piso, conserjeria, autorizacion y horario permitido. | `createSolicitud` recibio contexto de edificio y autorizacion requerida. | Aprobado | Alta | Valida reglas dinamicas para edificio. | No aplica |
| CP-SOL-009 | Crear solicitud para local comercial | Funcional - flujo | Envia horario de atencion, fuera de horario, contacto, telefono y funcionamiento del local. | `createSolicitud` recibio contacto, telefono, horario y condiciones comerciales. | Aprobado | Alta | Valida contexto comercial. | No aplica |
| CP-SOL-010 | Espacio publico con advertencia | Funcional - UX/validacion | Muestra advertencia de permisos y permite enviar contexto minimo. | Se mostro advertencia de permisos municipales y el payload incluyo condicion de autorizacion previa. | Aprobado | Media | Valida aviso preventivo de factibilidad. | No aplica |
| CP-SOL-011 | Disponibilidad del cliente obligatoria | Funcional - validacion | Bloquea envio si falta disponibilidad. | No llamo `createSolicitud` y mostro error junto al campo de disponibilidad. | Aprobado | Alta | Evita solicitudes sin ventana de coordinacion. | No aplica |
| CP-SOL-012 | Condiciones o instrucciones de acceso obligatorias | Funcional - validacion | Bloquea envio si no hay condiciones ni instrucciones de acceso. | No llamo `createSolicitud` y mostro errores en los campos de acceso. | Aprobado | Alta | Evita solicitudes sin informacion de llegada. | No aplica |
| CP-SOL-013 | Payload con nuevos campos | Funcional - contrato frontend | `createSolicitud` recibe todos los campos nuevos esperados. | Se valido payload completo para departamento con tipo de inmueble, piso, acceso, horario y disponibilidad. | Aprobado | Alta | Cubre contrato con backend preparado. | No aplica |
| CP-REV-001 | Renderizado gestión de reseñas | Funcional - componente admin | Muestra panel de reseñas y botón actualizar. | Mostró encabezado, sección y botón `Actualizar reseñas`. | Aprobado | Baja | Valida entrada al módulo de moderación. | No aplica |
| CP-REV-002 | Listado de reseñas | Funcional - admin | Muestra reseña, solicitud, estado y motivo. | Mostró reseña `#101`, comentario, solicitud y reporte pendiente. | Aprobado | Media | Permite revisar contenido reportado. | No aplica |
| CP-REV-003 | Aprobar reseña reportada | Funcional - admin | Llama servicio de aprobación y actualiza estado. | Llamó `approveReview(101)` y cambió a `Aprobada`. | Aprobado | Media | Valida moderación positiva. | No aplica |
| CP-REV-004 | Ocultar reseña reportada | Funcional - admin | Llama servicio de ocultamiento y actualiza estado. | Llamó `hideReview(101)` y cambió a `Ocultada`. | Aprobado | Media | Valida moderación restrictiva. | No aplica |
| CP-ADMIN-001 | Renderizado dashboard admin | Funcional - componente admin | Muestra secciones principales del dashboard. | Mostró resumen, panel, estado, acciones y botón actualizar. | Aprobado | Baja | Verifica disponibilidad del panel. | No aplica |
| CP-ADMIN-002 | Carga métricas admin | Funcional - admin | Muestra métricas mockeadas principales. | Llamó `getAdminDashboard` y mostró usuarios, técnicos, reportes y cotizaciones. | Aprobado | Media | Valida resumen operativo. | No aplica |
| CP-ADMIN-003 | Error al cargar métricas | Funcional - admin negativa | Muestra error controlado y opción de reintento. | Mostró error y botón `Reintentar carga del panel`. | Aprobado | Media | Cubre falla de métricas. | No aplica |
| CP-ADMIN-004 | Renderizado gestión usuarios | Funcional - componente admin | Muestra pantalla, buscador y filtro. | Mostró gestión de usuarios, buscador y botón `Todos`. | Aprobado | Baja | Verifica entrada al módulo usuarios. | No aplica |
| CP-ADMIN-005 | Listado de usuarios | Funcional - admin | Lista usuarios ADMIN, CLIENTE y TECNICO. | Mostró usuarios mockeados con correo, comuna, rol y estado. | Aprobado | Media | Valida revisión administrativa de usuarios. | No aplica |
| CP-ADMIN-006 | Error al listar usuarios | Funcional - admin negativa | Muestra error controlado y no tabla incorrecta. | Mostró error y no renderizó usuarios mockeados. | Aprobado | Media | Cubre falla del servicio de usuarios. | No aplica |
| CP-ADMIN-DOC-001 | Visualización y validación de documentos técnicos | Funcional - admin | Admin ve documentos del técnico y aprueba documento pendiente. | Mostró `Certificado SEC`, enlace `Ver documento`, estado pendiente y luego `Documento aprobado`. | Aprobado | Alta | Cubre brecha funcional de validación documental. | Sí |
| CP-ADMIN-DOC-002 | Manejo de error al cargar documentos técnicos | Funcional - negativa admin | Muestra error controlado si fallan documentos. | Con rechazo mock `Error 500`, mostró mensaje y no mostró documento mockeado. | Aprobado | Media | Es prueba simulada de manejo de error, no falla real encontrada. | No aplica |
| CP-TEC-001 | Renderizado panel técnico | Funcional - componente técnico | Muestra panel y secciones principales. | Mostró panel, solicitudes, trabajos y botón actualizar. | Aprobado | Baja | Verifica entrada al módulo técnico. | No aplica |
| CP-TEC-002 | Carga de solicitudes técnico | Funcional - técnico | Muestra solicitudes disponibles y asignadas. | Llamó servicios y mostró solicitudes mockeadas. | Aprobado | Alta | Valida carga de trabajo técnico. | No aplica |
| CP-TEC-003 | Estado sin solicitudes | Funcional - técnico | Muestra mensajes vacíos controlados. | Mostró mensajes de ausencia de solicitudes y trabajos. | Aprobado | Baja | Evita pantalla vacía confusa. | No aplica |
| CP-TEC-004 | Error al cargar solicitudes | Funcional - técnico negativa | Muestra error entendible sin romper pantalla. | Al rechazar servicio, mostró error de carga. | Aprobado | Media | Cubre fallo de solicitudes. | No aplica |
| CP-TEC-005 | Información principal de solicitud | Funcional - técnico | Muestra servicio, dirección, urgencia, referencia o estado. | Visualizó datos principales de solicitudes disponibles/asignadas. | Aprobado | Media | Permite decisión informada del técnico. | No aplica |
| CP-TEC-006 | Crear cotización | Funcional - técnico | Envía payload correcto al completar cotización. | Llamó `createCotizacion` con solicitud, técnico, monto, mensaje y vigencia. | Aprobado | Alta | Valida flujo de cotización. | No aplica |

## Caso no funcional

| Caso | Título de prueba | Tipo de prueba | Resultado esperado | Resultado obtenido | Estado | Severidad | Observación | Corregido |
| ---- | ---------------- | -------------- | ------------------ | ------------------ | ------ | --------- | ----------- | --------- |
| CP-RNF-BUILD-001 | Build de producción sin errores TypeScript | No funcional - compilación/calidad estática | `npm.cmd run build` debe completar `tsc -b` y `vite build` sin errores. | Inicialmente falló por `TS6133` en imports no usados de `TecnicoDashboard.test.tsx`; luego aprobó tras corregir imports. | Fallido inicialmente, corregido y aprobado | Alta | Falla real encontrada: impedía generar build de producción aunque Vitest pasara. | Sí |
