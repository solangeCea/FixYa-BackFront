# Evidencia de pruebas

## Hallazgo AUTH-ROL-001: Login permite acceso con rol seleccionado incorrecto

**Descripción del error:**  
En la pantalla de Login, el sistema permitía autenticar a un usuario aunque el rol seleccionado por la persona no coincidiera con el `tipo_usuario` real devuelto por el backend. Por ejemplo, al seleccionar rol Cliente e ingresar credenciales válidas de Admin, la aplicación redirigía al panel de administración.

**Riesgo funcional y de seguridad:**  
El flujo confundía la intención de acceso seleccionada en la interfaz con la identidad real autenticada. Esto podía permitir navegación a un dashboard distinto al rol elegido, mantener una sesión activa inesperada y conservar un token válido pese a que el control de rol de la pantalla no fue satisfecho.

**Caso de prueba asociado:**  
CP-AUTH-004: Credenciales correctas pero rol seleccionado incorrecto.

**Resultado antes de corregir:**  
La prueba fallaba. Vitest evidenció que, al seleccionar Cliente y autenticar credenciales de Admin, se renderizaba `Dashboard admin`, la sesión quedaba como `sesion-activa:ADMIN` y `localStorage` mantenía `admin-token`.

**Mejora aplicada:**  
Se agregó validación en `Login.tsx` para normalizar y comparar el rol seleccionado con el `tipo_usuario` real obtenido desde `GET /usuarios/me`. Si no coinciden, el flujo no redirige, limpia el token, limpia `sessionStorage`, deja el contexto de usuario en `null` y muestra el mensaje: "El rol seleccionado no corresponde a este usuario. Revisa tu selección e inténtalo nuevamente." El token se guarda solo cuando la comparación de roles es válida.

**Resultado después de corregir:**  
La prueba CP-AUTH-004 pasa correctamente. El sistema bloquea el acceso cuando el rol seleccionado no coincide con el usuario autenticado.

**Comando usado para ejecutar la prueba:**  
```powershell
npm.cmd run test:run
```

## Suite de pruebas AUTH-LOGIN

| Caso | Objetivo | Resultado esperado | Resultado obtenido | Estado | Comando usado |
| --- | --- | --- | --- | --- | --- |
| CP-AUTH-001 Login cliente correcto | Validar autenticación exitosa con rol Cliente y usuario `CLIENTE`. | Guarda sesión y redirige a `/cliente/dashboard`. | Se guardó `cliente-token`, la sesión quedó activa como `CLIENTE` y se invocó navegación a `/cliente/dashboard`. | Aprobado | `npm.cmd run test:run` |
| CP-AUTH-002 Login técnico correcto | Validar autenticación exitosa con rol Técnico y usuario `TECNICO`. | Guarda sesión y redirige a `/tecnico/dashboard`. | Se guardó `tecnico-token`, la sesión quedó activa como `TECNICO` y se invocó navegación a `/tecnico/dashboard`. | Aprobado | `npm.cmd run test:run` |
| CP-AUTH-003 Login admin correcto | Validar autenticación exitosa con rol Administrador y usuario `ADMIN`. | Guarda sesión y redirige a `/admin/panel`. | Se guardó `admin-token`, la sesión quedó activa como `ADMIN` y se invocó navegación a `/admin/panel`. | Aprobado | `npm.cmd run test:run` |
| CP-AUTH-004 Bloqueo por rol incorrecto | Verificar que credenciales válidas de otro rol no permitan acceso. | No redirige, limpia sesión y muestra error de rol. | No se invocó navegación, la sesión quedó inactiva, no quedó token en `localStorage` y se mostró el mensaje de rol incorrecto. | Aprobado | `npm.cmd run test:run` |
| CP-AUTH-005 Login sin rol seleccionado | Validar que no se intente autenticar si no se selecciona rol. | No llama al servicio de login, no redirige y muestra mensaje de selección de rol. | No se llamó `login`, no se llamó `obtenerUsuarioActual`, no se invocó navegación y se mostró el mensaje de selección de rol. | Aprobado | `npm.cmd run test:run` |
| CP-AUTH-006 Credenciales inválidas | Validar manejo de error ante credenciales incorrectas. | No redirige, no guarda sesión y muestra error claro. | No se llamó `obtenerUsuarioActual`, no se invocó navegación, la sesión quedó inactiva, no quedó token y se mostró el mensaje de credenciales inválidas. | Aprobado | `npm.cmd run test:run` |

**Nota de organización:**  
Se reorganizó la estructura de pruebas para separar los archivos de test del código de componentes, dejando la suite de Login en `src/tests/auth/Login.test.tsx`. Esto mejora la mantenibilidad, trazabilidad y claridad del proyecto para la etapa de validación.

## Suite de pruebas AUTH-REGISTER

| Caso | Objetivo | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| CP-REG-001 Renderizado del formulario | Validar que el formulario de registro muestre sus campos principales y el botón de envío. | Se muestran campos principales como nombre, RUT, fecha de nacimiento, correo, teléfono, contraseña, confirmación y botón de crear cuenta. | El formulario renderizó correctamente los campos principales y el botón `Crear cuenta cliente`. | Aprobado |
| CP-REG-002 Campos obligatorios | Verificar que el formulario no envíe datos vacíos al backend. | No llama al servicio de registro y muestra errores en campos obligatorios. | No se llamó `createUser`; se mostraron errores obligatorios y mensajes específicos para fecha de nacimiento y confirmación de contraseña. | Aprobado |
| CP-REG-003 Correo inválido | Validar formato de correo antes de enviar la solicitud. | No llama al backend y muestra un mensaje de correo inválido cerca del campo correo. | No se llamó `createUser`; se mostró el mensaje de correo válido dentro del bloque del campo correo. | Aprobado |
| CP-REG-004 Contraseña débil | Validar reglas mínimas de contraseña antes de enviar la solicitud. | No llama al backend y muestra un mensaje claro cerca del campo contraseña. | No se llamó `createUser`; se mostró el mensaje de mínimo 8 caracteres en el bloque del campo contraseña. | Aprobado |
| CP-REG-005 Mostrar/ocultar contraseña | Verificar el botón de visibilidad de contraseña. | El input inicia como `password`, cambia a `text` al presionar el botón y vuelve a `password` al presionarlo nuevamente. | El botón alternó correctamente el tipo del input entre `password` y `text`. | Aprobado |
| CP-REG-006 Registro exitoso Cliente | Validar el flujo exitoso de registro para un usuario Cliente con datos válidos. | Llama a `createUser` con el payload correcto y navega según el flujo actual. | Se llamó `createUser` con los datos esperados, no quedaron errores de validación y se invocó navegación a `/login`. | Aprobado |

**Comando usado:**  
```powershell
npm.cmd run test:run
```

## Suite de pruebas ROUTE-PROTECTED

| Caso | Objetivo | Resultado esperado | Resultado obtenido | Estado | Comando usado |
| --- | --- | --- | --- | --- | --- |
| CP-ROUTE-001 Usuario no autenticado | Validar que una persona sin sesión no pueda entrar a una ruta protegida. | No muestra contenido protegido y redirige a login. | No se mostró `Contenido cliente`, no se consultó usuario actual y se renderizó la ruta `/login`. | Aprobado | `npm.cmd run test:run` |
| CP-ROUTE-002 Cliente accede a ruta cliente | Verificar que un usuario `CLIENTE` pueda entrar a su dashboard. | Muestra el contenido protegido de cliente. | Se obtuvo el usuario con token `cliente-token` y se mostró `Contenido cliente`. | Aprobado | `npm.cmd run test:run` |
| CP-ROUTE-003 Cliente bloqueado en ruta admin | Verificar que un usuario `CLIENTE` no pueda entrar a rutas `ADMIN`. | No muestra contenido admin y redirige según el flujo actual. | No se mostró `Contenido admin`; el flujo redirigió al dashboard del rol real y mostró `Contenido cliente`. | Aprobado | `npm.cmd run test:run` |
| CP-ROUTE-004 Técnico accede a ruta técnico | Verificar que un usuario `TECNICO` pueda entrar a su dashboard. | Muestra el contenido protegido técnico. | Se obtuvo el usuario con token `tecnico-token` y se mostró `Contenido tecnico`. | Aprobado | `npm.cmd run test:run` |
| CP-ROUTE-005 Admin accede a ruta admin | Verificar que un usuario `ADMIN` pueda entrar al panel admin. | Muestra el contenido protegido admin. | Se obtuvo el usuario con token `admin-token` y se mostró `Contenido admin`. | Aprobado | `npm.cmd run test:run` |
| CP-ROUTE-006 Token inválido o usuario no cargado | Validar que un token inválido no permita acceder a rutas privadas. | No muestra contenido protegido, limpia sesión y redirige a login. | `obtenerUsuarioActual` rechazó el token, se removió `token` de `localStorage`, no se mostró contenido admin y se renderizó `/login`. | Aprobado | `npm.cmd run test:run` |

## Suite de pruebas SERVICES-API

| Caso | Servicio probado | Objetivo | Resultado esperado | Resultado obtenido | Estado | Comando usado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-SERV-AUTH-001 | `authService.login` | Validar login exitoso. | Llama a `/usuarios/login`, envía correo/contraseña y retorna token. | Se llamó el endpoint correcto con método `POST`, `Content-Type: application/json`, body esperado y retornó `access_token`. | Aprobado | `npm.cmd run test:run` |
| CP-SERV-AUTH-002 | `authService.login` | Validar manejo de credenciales inválidas. | Ante respuesta no exitosa, lanza error controlado. | Con respuesta `ok: false`, lanzó `Credenciales incorrectas`. | Aprobado | `npm.cmd run test:run` |
| CP-SERV-AUTH-003 | `authService.obtenerUsuarioActual` | Validar consulta de usuario autenticado con token. | Envía `Authorization: Bearer <token>` y retorna datos del usuario. | Se llamó `/usuarios/me` con `Authorization: Bearer jwt-token` y retornó usuario `CLIENTE`. | Aprobado | `npm.cmd run test:run` |
| CP-SERV-AUTH-004 | `authService.obtenerUsuarioActual` | Validar manejo de token inválido o error al obtener usuario. | Ante respuesta no exitosa, lanza error controlado. | Con respuesta `ok: false`, lanzó `No se pudo obtener usuario`. | Aprobado | `npm.cmd run test:run` |
| CP-SERV-USER-001 | `userService.createUser` | Validar creación exitosa de usuario. | Llama a `/usuarios/`, envía payload esperado y retorna usuario creado. | Se llamó el endpoint correcto con método `POST`, JSON esperado y retornó usuario `CLIENTE`. | Aprobado | `npm.cmd run test:run` |
| CP-SERV-USER-002 | `userService.createUser` | Validar error al crear usuario duplicado o inválido. | Maneja error `400/409` usando mensaje del backend si existe. | Con `detail: El correo ya existe`, lanzó ese mensaje. | Aprobado | `npm.cmd run test:run` |
| CP-SERV-USER-003 | `userService.getUsers` | Validar listado de usuarios con JWT. | Envía `Authorization: Bearer <token>` y retorna lista de usuarios. | Se leyó `admin-token` desde `localStorage`, se envió Authorization y retornó lista de usuarios. | Aprobado | `npm.cmd run test:run` |
| CP-SERV-TECH-001 | `technicianService.getTechnicians` | Validar listado de técnicos con JWT. | Llama a `/tecnicos/`, envía Authorization y retorna técnicos. | Se envió `Authorization: Bearer admin-token` y retornó lista de técnicos. | Aprobado | `npm.cmd run test:run` |
| CP-SERV-TECH-002 | `technicianService.searchTechnicians` | Validar búsqueda por servicio y comuna. | Construye URL con `servicio_id` y `comuna_id`, envía Authorization y retorna técnicos filtrados. | Se llamó `/tecnicos/buscar?servicio_id=100&comuna_id=10` con token y retornó técnicos. | Aprobado | `npm.cmd run test:run` |
| CP-SERV-TECH-003 | `technicianService.getTechnicianProfile` | Validar obtención de perfil técnico por RUT. | Llama a `/tecnicos/{rut}/perfil`, envía Authorization y retorna perfil. | Se llamó el endpoint con RUT `22.222.222-2`, token técnico y retornó perfil. | Aprobado | `npm.cmd run test:run` |
| CP-SERV-TECH-004 | `technicianService.getTechnicians` | Validar error HTTP del backend. | Ante error `500` o respuesta fallida, lanza error controlado. | Con respuesta `ok: false`, lanzó un error de obtención de técnicos. | Aprobado | `npm.cmd run test:run` |

## Suite de pruebas ADMIN

| Caso | Resultado esperado | Resultado obtenido | Estado | Comando usado |
| --- | --- | --- | --- | --- |
| CP-ADMIN-001 Renderizado dashboard | El dashboard administrativo se renderiza correctamente y muestra secciones principales. | Se mostró `Resumen operativo`, `Panel administrativo`, `Estado del sistema`, `Acciones rápidas` y el botón `Actualizar panel`. | Aprobado | `npm.cmd run test:run` |
| CP-ADMIN-002 Carga de métricas | Al mockear `dashboardService`, se muestran métricas como usuarios, técnicos, reportes, solicitudes y cotizaciones. | Se llamó `getAdminDashboard` y se visualizaron métricas mockeadas de usuarios, técnicos verificados, reportes pendientes y cotizaciones. | Aprobado | `npm.cmd run test:run` |
| CP-ADMIN-003 Error al cargar métricas | Si el servicio falla, la pantalla no se rompe y muestra un error controlado. | Al rechazar `getAdminDashboard`, se mostró `No pudimos cargar el resumen administrativo` y el botón `Reintentar carga del panel`. | Aprobado | `npm.cmd run test:run` |
| CP-ADMIN-004 Renderizado gestión usuarios | La pantalla de gestión de usuarios se renderiza correctamente. | Se mostró `Gestión de usuarios`, texto descriptivo, buscador por nombre/correo/RUT y filtro `Todos`. | Aprobado | `npm.cmd run test:run` |
| CP-ADMIN-005 Listado de usuarios | Al mockear `userService`, se muestran usuarios con rol ADMIN, CLIENTE y TECNICO. | Se mostraron usuarios mockeados Cliente, Técnico y Admin con correo, comuna, rol y estado. | Aprobado | `npm.cmd run test:run` |
| CP-ADMIN-006 Error al listar usuarios | Si `userService` falla, se muestra mensaje controlado y la pantalla no se rompe. | Al rechazar `getUsers`, se mostró `No pudimos cargar los usuarios registrados` y no se renderizó la tabla con usuarios mockeados. | Aprobado | `npm.cmd run test:run` |

## Suite de pruebas TECNICO-DASHBOARD

| Caso | Resultado esperado | Resultado obtenido | Estado | Comando usado |
| --- | --- | --- | --- | --- |
| CP-TEC-001 Renderizado panel técnico | El panel técnico se renderiza correctamente y muestra la sección principal. | Se mostró `Panel de trabajos técnicos`, `Solicitudes y trabajos`, `Solicitudes Disponibles`, `Mis Trabajos` y el botón `Actualizar trabajos`. | Aprobado | `npm.cmd run test:run` |
| CP-TEC-002 Carga de solicitudes | Al mockear solicitudes desde los servicios, se muestran solicitudes disponibles y asignadas. | Se llamaron `getSolicitudes` y `getSolicitudesTecnico`, mostrando `Filtracion urgente en cocina` e `Instalacion de enchufes` con sus descripciones. | Aprobado | `npm.cmd run test:run` |
| CP-TEC-003 Estado sin solicitudes | Si los servicios retornan listas vacías, se muestra un mensaje controlado. | Se mostraron los mensajes `Aún no hay solicitudes disponibles para tomar` y `Aún no tienes trabajos asignados`. | Aprobado | `npm.cmd run test:run` |
| CP-TEC-004 Error al cargar solicitudes | Si falla la carga, la pantalla no se rompe y muestra un error entendible. | Al rechazar `getSolicitudes`, se mostró `No pudimos cargar tus trabajos y solicitudes disponibles`. | Aprobado | `npm.cmd run test:run` |
| CP-TEC-005 Visualización de información principal | Se muestran datos relevantes de una solicitud, como servicio, dirección, urgencia, referencia o estado. | Se visualizaron servicio `Gasfiteria`, direcciones, urgencia y referencias principales de solicitudes disponibles/asignadas. | Aprobado | `npm.cmd run test:run` |
| CP-TEC-006 Crear cotización | Al completar monto, detalle y vigencia, se llama al servicio de cotización con el payload correcto. | Se llamó `createCotizacion` con solicitud, técnico, monto, mensaje y vigencia esperados; se mostró el mensaje de cotización enviada correctamente. | Aprobado | `npm.cmd run test:run` |

## Suite de pruebas REVIEW-MANAGEMENT

| Caso | Resultado esperado | Resultado obtenido | Estado | Comando usado |
| --- | --- | --- | --- | --- |
| CP-REV-001 Renderizado | El panel se renderiza correctamente y muestra la sección de gestión de reseñas. | Se mostró el encabezado `Gestión de reseñas`, la sección `Reseñas del sistema` y el botón `Actualizar reseñas`. | Aprobado | `npm.cmd run test:run` |
| CP-REV-002 Listado de reseñas | Al mockear reseñas desde `reviewService`, se muestran comentario, solicitud, estado y datos principales. | Se mostró `Reseña #101`, el comentario mockeado, la solicitud asociada, el estado `Reportada pendiente` y el motivo del reporte. | Aprobado | `npm.cmd run test:run` |
| CP-REV-003 Aprobar reseña | Al aprobar una reseña reportada pendiente, se llama al servicio correspondiente y se muestra confirmación o estado actualizado. | Se llamó `approveReview(101)`, se mostró el mensaje `Reseña aprobada` y el estado visual cambió a `Aprobada` sin mantener el botón de aprobación. | Aprobado | `npm.cmd run test:run` |
| CP-REV-004 Ocultar reseña | Al ocultar una reseña reportada pendiente, se llama al servicio correspondiente y se muestra confirmación o estado actualizado. | Se llamó `hideReview(101)`, se mostró el mensaje `Reseña ocultada` y el estado visual cambió a `Ocultada` sin mantener el botón de ocultar. | Aprobado | `npm.cmd run test:run` |

## Suite de pruebas SOLICITUDES - Parte inicial

| Caso | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- |
| CP-SOL-001 Renderizado del formulario | Se muestran los campos principales y el botón para enviar la solicitud. | Se renderizó el formulario dentro de `ClienteDashboard` con servicio, comuna, título, descripción, urgencia, dirección, tipo de problema, referencia y botón `Solicitar servicio`. | Aprobado |
| CP-SOL-002 Campos obligatorios | Al enviar sin completar datos, no llama al backend y muestra errores de validación. | No se llamó `createSolicitud`; se mostraron errores para título, descripción, dirección, tipo de problema y referencia de ubicación. | Aprobado |
| CP-SOL-003 Carga de servicios | Al cargar catálogos mockeados, se muestran servicios activos para seleccionar. | Se mostraron `Gasfiteria` y `Electricidad`; el servicio inactivo no apareció en el select. | Aprobado |
| CP-SOL-004 Creación exitosa de solicitud | Al completar el formulario con datos válidos, llama a `createSolicitud` con el payload esperado y muestra confirmación. | Se llamó `createSolicitud` una vez con usuario, servicio, comuna, título, descripción, urgencia, dirección, tipo de problema y referencia; se mostró el mensaje de solicitud enviada correctamente. | Aprobado |
| CP-SOL-005 Tipo de problema dinámico | Al cambiar el servicio seleccionado, las opciones de tipo de problema se actualizan y no mantienen una selección anterior inválida. | Al seleccionar Electricidad se mostraron opciones como `Enchufe`, `Cables` e `Iluminación`; al cambiar a Gasfitería se mostraron `Fuga de agua`, `Cañería` y `Baño`, se removió `Enchufe` y el valor seleccionado quedó limpio. | Aprobado |
| CP-SOL-006 Error del backend al crear solicitud | Si el backend falla al crear la solicitud, la pantalla no se rompe, no queda en carga infinita, no muestra éxito y conserva los datos ingresados. | Se mockeó `createSolicitud` con rechazo `Error 500`; se mostró el mensaje de error, el botón volvió a quedar habilitado, no se mostró mensaje de éxito y el formulario mantuvo los datos completados. | Aprobado |

**Comando usado:**  
```powershell
npm.cmd run test:run
```

## Mejora QA-SOL-001: Asociación explícita de labels e inputs en solicitud

**Observación detectada:**  
Los labels visibles del formulario de solicitud dentro de `ClienteDashboard` no estaban asociados explícitamente a sus controles mediante `htmlFor/id`.

**Mejora aplicada:**  
Se agregó `htmlFor` en los labels y `id` correspondiente en los controles de servicio, comuna, título, descripción, urgencia, dirección, tipo de problema, foto del problema y referencia de ubicación, manteniendo los atributos `name` existentes.

**Caso relacionado:**  
CP-SOL-004: Creación exitosa de solicitud.

**Resultado de pruebas:**  
La suite completa quedó aprobada con 51 pruebas.

**Comando usado:**  
```powershell
npm.cmd run test:run
```

## Mejora UX-SOL-001: Tipo de problema dinámico según servicio

**Observación detectada:**  
El campo `tipo_problema` debía guiar mejor al cliente mostrando opciones relacionadas con el servicio seleccionado, en lugar de depender de opciones genéricas o poco alineadas con cada categoría.

**Mejora aplicada:**  
Se ajustó el mapa de opciones por servicio para Electricidad, Gasfitería, Carpintería y Cerrajería. Además, los servicios sin categoría definida muestran `Otro` como alternativa disponible.

**Impacto en experiencia de usuario:**  
El cliente recibe alternativas más claras y contextualizadas, reduce errores al describir la solicitud y facilita que el técnico entienda rápidamente el tipo de problema reportado.

**Caso relacionado:**  
CP-SOL-005: Tipo de problema cambia según servicio seleccionado.

**Resultado de pruebas:**  
La suite completa quedó aprobada con 51 pruebas.

**Comando usado:**  
```powershell
npm.cmd run test:run
```

## CP-SOL-006: Error del backend al crear solicitud

**Objetivo:**  
Validar que el formulario maneje correctamente un fallo del backend al crear una solicitud, sin romper la pantalla ni perder los datos ingresados por el cliente.

**Resultado esperado:**  
La aplicación debe mostrar un mensaje de error claro, no debe mostrar mensaje de éxito, no debe quedar en estado de carga infinito y no debe limpiar el formulario como si la solicitud hubiera sido creada.

**Resultado obtenido:**  
Al mockear `createSolicitud` con un rechazo `Error 500`, el componente mostró el mensaje `No pudimos enviar la solicitud`, no renderizó el mensaje de éxito, el botón `Solicitar servicio` quedó habilitado nuevamente y los campos completados conservaron sus valores.

**Estado:**  
Aprobado.

**Comando usado:**  
```powershell
npm.cmd run test:run
```

**Mejora aplicada:**  
No fue necesario modificar la lógica del componente. El comportamiento de error ya estaba implementado mediante `catch` y `finally`; se agregó cobertura automatizada para dejar evidencia del caso negativo.

## Mejora QA-TEST-001: Configuración estable de Vitest

**Observación detectada:**  
Durante la ejecución completa de la suite, Vitest podía agotar memoria al levantar varios workers en paralelo en el entorno local de Windows.

**Mejora aplicada:**  
Se configuró `fileParallelism: false` en `vite.config.ts` para ejecutar los archivos de prueba de forma secuencial y estabilizar el comando estándar `npm.cmd run test:run`.

**Impacto:**  
La suite completa puede ejecutarse de forma consistente con 11 archivos de prueba y 51 pruebas aprobadas.

**Comando usado:**  
```powershell
npm.cmd run test:run
```

## Mejora QA-REG-001: Asociación explícita de labels e inputs en Register

**Observación detectada:**  
Algunos labels visibles del formulario Register no estaban asociados explícitamente a sus controles mediante `htmlFor/id`.

**Riesgo o impacto:**  
La falta de asociación explícita afecta accesibilidad, mantenibilidad y claridad de pruebas, porque usuarios con tecnologías asistivas y pruebas orientadas al comportamiento no pueden identificar los campos de forma tan confiable.

**Mejora aplicada:**  
Se agregó `htmlFor` en los labels visibles y `id` correspondiente en inputs/selects del formulario, manteniendo los atributos `name` usados por la lógica existente. Las pruebas de Register fueron ajustadas para consultar campos por label con Testing Library cuando corresponde.

**Caso de prueba relacionado:**  
CP-REG-006: Registro exitoso de usuario Cliente.

**Resultado después de ejecutar pruebas:**  
La suite completa quedó aprobada con 12 pruebas: 6 de Login y 6 de Register.

**Comando usado:**  
```powershell
npm.cmd run test:run
```
