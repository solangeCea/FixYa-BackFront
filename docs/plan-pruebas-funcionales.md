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

Validar que los flujos principales del frontend de FixYa funcionen correctamente desde la perspectiva del usuario y del control de acceso, incluyendo autenticación, registro, rutas protegidas, comunicación con servicios API y creación de solicitudes de servicio.

## Alcance

El alcance de esta etapa considera:

- Login por rol Cliente, Técnico y Admin.
- Bloqueo de login cuando el rol seleccionado no coincide con el usuario autenticado.
- Registro de usuarios Cliente con validaciones de formulario.
- Control de acceso por rol mediante rutas protegidas.
- Servicios API del frontend para autenticación, usuarios y técnicos.
- Creación de solicitudes de servicio.
- Carga de catálogos de servicios y comunas.
- Manejo de error del backend al crear solicitudes.
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

Total inventariado: 35 casos de prueba.

## Resumen de resultados

Comando usado:

```powershell
npm.cmd run test:run
```

Resultado actual:

- 7 archivos de prueba aprobados.
- 35 pruebas aprobadas.
- 0 pruebas fallidas.
- Las pruebas usan mocks y no dependen del backend real.

Distribución:

| Grupo | Cantidad | Estado |
| ----- | -------- | ------ |
| Login | 6 | Aprobado |
| Register | 6 | Aprobado |
| Rutas protegidas | 6 | Aprobado |
| Servicios API | 11 | Aprobado |
| Solicitudes | 6 | Aprobado |

## Hallazgos corregidos

| Hallazgo | Descripción | Caso asociado | Estado |
| -------- | ----------- | ------------- | ------ |
| AUTH-ROL-001 | El login permitía acceso cuando el rol seleccionado no coincidía con el `tipo_usuario` real del usuario autenticado. | CP-AUTH-004 | Corregido y aprobado |
| QA-REG-001 | Algunos labels del formulario Register no estaban asociados explícitamente a sus inputs mediante `htmlFor/id`. | CP-REG-006 | Corregido y aprobado |
| QA-SOL-001 | Algunos labels del formulario de solicitud no estaban asociados explícitamente a sus inputs/selects mediante `htmlFor/id`. | CP-SOL-004 | Corregido y aprobado |
| UX-SOL-001 | El campo tipo de problema debía guiar mejor al usuario con opciones dependientes del servicio seleccionado. | CP-SOL-005 | Corregido y aprobado |

## Mejoras aplicadas

- Se configuró Vitest con entorno `jsdom` y setup de Testing Library.
- Se organizó la estructura de pruebas en `frontend/src/tests/`.
- Se agregó suite de Login con casos positivos, negativos y validación de rol.
- Se agregó suite de Register con validaciones, accesibilidad y registro exitoso.
- Se agregó suite de rutas protegidas para validar acceso por rol.
- Se agregaron pruebas de servicios API para autenticación, usuarios y técnicos.
- Se agregó suite de solicitudes con renderizado, validaciones, catálogos, creación exitosa, tipo de problema dinámico y error del backend.
- Se mejoró la asociación explícita entre labels e inputs en Register y solicitud.
- Se ajustó el campo tipo de problema para mostrar opciones según el servicio seleccionado.
- Se agregó documentación de evidencia y matriz de trazabilidad.

## Conclusión

La suite funcional actual de FixYa cubre los flujos principales del frontend y deja evidencia concreta para una etapa formal de validación. Los requisitos funcionales base están trazados contra casos de prueba automatizados y todos los casos registrados se encuentran aprobados.

El proyecto queda con una base de QA más defendible para informe y presentación académica: los casos están organizados por módulo, usan mocks para evitar dependencia del backend real, validan comportamiento observable y documentan hallazgos corregidos junto con mejoras de seguridad, accesibilidad y experiencia de usuario.
