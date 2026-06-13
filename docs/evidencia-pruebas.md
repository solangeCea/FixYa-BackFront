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
