# Plan de pruebas funcionales

Proyecto: FixYa  
Frontend: React + TypeScript + Vite  
Backend: FastAPI  
Base de datos: PostgreSQL  
Framework de pruebas: Vitest + Testing Library

## Introducción

Este documento define el plan de pruebas funcionales aplicado al frontend de FixYa. El objetivo es dejar evidencia ordenada de los casos validados, los requisitos funcionales cubiertos, las herramientas utilizadas, los hallazgos corregidos y las mejoras aplicadas durante la etapa de aseguramiento de calidad.

Las pruebas automatizadas se ejecutan sobre el frontend y utilizan mocks para simular servicios, contexto de autenticación, navegación, catálogos y respuestas del backend. Por lo tanto, la suite no depende del backend real para validar los flujos cubiertos.

## Objeto

Validar que los flujos principales del frontend de FixYa funcionen correctamente desde la perspectiva del usuario y del control de acceso, incluyendo autenticación, registro, rutas protegidas, comunicación con servicios API, creación de solicitudes de servicio, panel técnico, moderación de reseñas y gestión administrativa del sistema.

## Alcance

El alcance de esta etapa considera:

- Login por rol Cliente, Técnico y Admin.
- Bloqueo de login cuando el rol seleccionado no coincide con el usuario autenticado.
- Registro de usuarios Cliente con validaciones de formulario.
- Control de acceso por rol mediante rutas protegidas.
- Servicios API del frontend para autenticación, usuarios y técnicos.
- Creación de solicitudes de servicio.
- Visualización de solicitudes disponibles y trabajos asignados para técnicos.
- Creación de cotizaciones desde el panel técnico.
- Carga de catálogos de servicios y comunas.
- Manejo de error del backend al crear solicitudes.
- Gestión y moderación de reseñas reportadas desde el panel administrador.
- Visualización de métricas del panel administrador.
- Visualización y búsqueda inicial de usuarios del sistema.
- Visualización y validación de documentos técnicos desde el módulo administrativo.
- Accesibilidad básica mediante asociación explícita de labels e inputs.
- Mejora UX del campo tipo de problema según servicio.

Quedan fuera de esta etapa:

- Pruebas end-to-end con navegador real.
- Pruebas contra backend real y base de datos real.
- Pruebas de carga, rendimiento y estrés.
- Pruebas visuales o de regresión por captura de pantalla.

## Herramientas usadas

| Herramienta | Uso |
| ----------- | --- |
| Vitest | Ejecución de pruebas unitarias y funcionales del frontend. |
| Testing Library | Renderizado e interacción con componentes desde una perspectiva de usuario. |
| jest-dom | Matchers adicionales para validar el DOM. |
| user-event | Simulación de interacción de usuario en formularios. |
| jsdom | Entorno de DOM para ejecutar pruebas de React sin navegador real. |
| Mocks de Vitest | Simulación de servicios API, contexto de autenticación y navegación. |

## Estrategia de ejecución

La estrategia usada combina pruebas funcionales de componentes con pruebas unitarias de servicios API del frontend.

- Las pruebas de componentes renderizan pantallas o rutas relevantes y validan comportamiento observable.
- Las pruebas de servicios mockean `fetch` o funciones equivalentes para validar endpoints, payloads, headers y errores HTTP.
- Las pruebas de autenticación mockean login, usuario actual, contexto y navegación.
- Las pruebas de solicitudes mockean catálogos, usuario autenticado y creación de solicitud.
- Las pruebas de técnico mockean solicitudes disponibles, trabajos asignados, métricas, servicios y creación de cotización.
- Las pruebas de reseñas mockean listado y acciones de moderación desde `reviewService`.
- Las pruebas administrativas mockean métricas del dashboard, listado de usuarios y comunas.
- Las pruebas administrativas de técnicos mockean perfiles técnicos, usuarios asociados y documentos técnicos para validar la revisión documental.
- Las pruebas no dependen del backend real ni de datos reales en PostgreSQL.

Comando estándar de ejecución:

```powershell
npm.cmd run test:run
```

Configuración relevante:

- Entorno de pruebas: `jsdom`.
- Archivo setup: `src/test/setup.ts`.
- Ejecución estable de archivos de prueba: `fileParallelism: false`.

## Inventario de casos de prueba

| Módulo | Archivo | Casos | Cantidad | Estado |
| ------ | ------- | ----- | -------- | ------ |
| Login | `frontend/src/tests/auth/Login.test.tsx` | CP-AUTH-001 a CP-AUTH-006 | 6 | Aprobado |
| Register | `frontend/src/tests/auth/Register.test.tsx` | CP-REG-001 a CP-REG-006 | 6 | Aprobado |
| Rutas protegidas | `frontend/src/tests/routes/ProtectedRoute.test.tsx` | CP-ROUTE-001 a CP-ROUTE-006 | 6 | Aprobado |
| Servicios API - autenticación | `frontend/src/tests/services/authService.test.ts` | CP-SERV-AUTH-001 a CP-SERV-AUTH-004 | 4 | Aprobado |
| Servicios API - usuarios | `frontend/src/tests/services/userService.test.ts` | CP-SERV-USER-001 a CP-SERV-USER-003 | 3 | Aprobado |
| Servicios API - técnicos | `frontend/src/tests/services/technicianService.test.ts` | CP-SERV-TECH-001 a CP-SERV-TECH-004 | 4 | Aprobado |
| Solicitudes | `frontend/src/tests/solicitudes/SolicitudForm.test.tsx` | CP-SOL-001 a CP-SOL-006 | 6 | Aprobado |
| Reseñas y moderación | `frontend/src/tests/reviews/ReviewManagement.test.tsx` | CP-REV-001 a CP-REV-004 | 4 | Aprobado |
| Administración - dashboard | `frontend/src/tests/admin/AdminDashboard.test.tsx` | CP-ADMIN-001 a CP-ADMIN-003 | 3 | Aprobado |
| Administración - usuarios | `frontend/src/tests/admin/UserManagement.test.tsx` | CP-ADMIN-004 a CP-ADMIN-006 | 3 | Aprobado |
| Administración - técnicos | `frontend/src/tests/admin/TechnicianManagement.test.tsx` | CP-ADMIN-DOC-001 a CP-ADMIN-DOC-002 | 2 | Aprobado |
| Técnico - dashboard | `frontend/src/tests/tecnico/TecnicoDashboard.test.tsx` | CP-TEC-001 a CP-TEC-006 | 6 | Aprobado |

Total inventariado: 53 casos de prueba.

## Brecha funcional cubierta

Durante la revisión funcional del sistema se identificó una brecha importante en el módulo administrativo: el administrador no podía visualizar los documentos subidos por los técnicos, como certificados, títulos o antecedentes.

Esto afecta directamente la validación de técnicos, ya que el sistema debe permitir comprobar la evidencia antes de aprobar o verificar un perfil técnico.

Para cubrir esta brecha se agregó el flujo como nuevo requisito funcional y se incorporó una prueba automatizada.

| Campo | Detalle |
| ----- | ------- |
| RF agregado | RF-016: Validación de documentos técnicos. |
| Casos agregados | CP-ADMIN-DOC-001, CP-ADMIN-DOC-002. |
| Objetivo | Verificar que el administrador pueda visualizar y validar documentos asociados a técnicos. |
| Estado actual | Aprobado con prueba automatizada. |

## Matriz de trazabilidad

La trazabilidad entre requisitos funcionales y casos de prueba se mantiene en `docs/matriz-trazabilidad-pruebas.md`.

La matriz cubre desde `RF-001` hasta `RF-016` y relaciona cada requisito con sus casos automatizados, archivo de evidencia y estado de aprobación.

## Resumen de resultados

Comando usado:

```powershell
npm.cmd run test:run
```

Resultado actual:

- 12 archivos de prueba aprobados.
- 53 pruebas aprobadas.
- 0 pruebas fallidas.
- Las pruebas usan mocks y no dependen del backend real.

Verificación no funcional adicional:

```powershell
npm.cmd run build
```

- Resultado inicial: fallido por errores TypeScript `TS6133` en `frontend/src/tests/tecnico/TecnicoDashboard.test.tsx`.
- Resultado después de corregir: aprobado.
- Caso documentado: `CP-RNF-BUILD-001`.

Distribución:

| Grupo | Cantidad | Estado |
| ----- | -------- | ------ |
| Login | 6 | Aprobado |
| Register | 6 | Aprobado |
| Rutas protegidas | 6 | Aprobado |
| Servicios API | 11 | Aprobado |
| Solicitudes | 6 | Aprobado |
| Reseñas y moderación | 4 | Aprobado |
| Administración | 8 | Aprobado |
| Técnico | 6 | Aprobado |

## Hallazgos corregidos

| Hallazgo | Descripción | Caso asociado | Estado |
| -------- | ----------- | ------------- | ------ |
| AUTH-ROL-001 | El login permitía acceso cuando el rol seleccionado no coincidía con el `tipo_usuario` real del usuario autenticado. | CP-AUTH-004 | Corregido y aprobado |
| QA-REG-001 | Algunos labels del formulario Register no estaban asociados explícitamente a sus inputs mediante `htmlFor/id`. | CP-REG-006 | Corregido y aprobado |
| QA-SOL-001 | Algunos labels del formulario de solicitud no estaban asociados explícitamente a sus inputs/selects mediante `htmlFor/id`. | CP-SOL-004 | Corregido y aprobado |
| UX-SOL-001 | El campo tipo de problema debía guiar mejor al usuario con opciones dependientes del servicio seleccionado. | CP-SOL-005 | Corregido y aprobado |
| RNF-BUILD-001 | El build de producción fallaba por imports declarados y no usados en una prueba técnica, incumpliendo la verificación no funcional de compilación. | CP-RNF-BUILD-001 | Fallido inicialmente, corregido y aprobado |

## Mejoras aplicadas

- Se configuró Vitest con entorno `jsdom` y setup de Testing Library.
- Se estabilizó la ejecución de Vitest con `fileParallelism: false` para evitar fallos de memoria por workers paralelos en la suite completa.
- Se organizó la estructura de pruebas en `frontend/src/tests/`.
- Se agregó suite de Login con casos positivos, negativos y validación de rol.
- Se agregó suite de Register con validaciones, accesibilidad y registro exitoso.
- Se agregó suite de rutas protegidas para validar acceso por rol.
- Se agregaron pruebas de servicios API para autenticación, usuarios y técnicos.
- Se agregó suite de solicitudes con renderizado, validaciones, catálogos, creación exitosa, tipo de problema dinámico y error del backend.
- Se agregó suite de técnico con renderizado del panel, carga de solicitudes, estados vacíos, error controlado, información principal y creación de cotización.
- Se agregó suite de reseñas y moderación con renderizado, listado, aprobación y ocultamiento de reseñas reportadas.
- Se agregó suite de administración con renderizado de dashboard, carga de métricas, error controlado y listado de usuarios.
- Se agregó prueba administrativa para visualizar documentos técnicos y validar su aprobación desde el perfil técnico.
- Se agregó prueba negativa administrativa para validar manejo de error cuando no cargan los documentos técnicos.
- Se corrigió una falla real de build eliminando imports no usados en `TecnicoDashboard.test.tsx`.
- Se mejoró la asociación explícita entre labels e inputs en Register y solicitud.
- Se ajustó el campo tipo de problema para mostrar opciones según el servicio seleccionado.
- Se agregó documentación de evidencia y matriz de trazabilidad.

## Conclusión

La suite funcional actual de FixYa cubre los flujos principales del frontend y deja evidencia concreta para una etapa formal de validación. Los requisitos funcionales base están trazados contra casos de prueba automatizados y todos los casos registrados se encuentran aprobados.

El proyecto queda con una base de QA más defendible para informe y presentación académica: los casos están organizados por módulo, usan mocks para evitar dependencia del backend real, validan comportamiento observable y documentan hallazgos corregidos junto con mejoras de seguridad, accesibilidad y experiencia de usuario.
