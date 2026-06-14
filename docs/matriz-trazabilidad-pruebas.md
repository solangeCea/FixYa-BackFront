# Matriz de trazabilidad de pruebas

Proyecto: FixYa  
Frontend: React + TypeScript + Vite  
Framework de pruebas: Vitest + Testing Library  
Resultado vigente: 11 archivos de prueba aprobados, 51 pruebas aprobadas  
Comando de ejecución: `npm.cmd run test:run`

## Matriz RF - Casos de prueba

| Requisito funcional | Descripción | Casos de prueba asociados | Evidencia | Estado |
| ------------------- | ----------- | ------------------------- | --------- | ------ |
| RF-001 | Registro de usuarios. | CP-REG-001, CP-REG-002, CP-REG-003, CP-REG-004, CP-REG-005, CP-REG-006; CP-SERV-USER-001, CP-SERV-USER-002 | `frontend/src/tests/auth/Register.test.tsx`; `frontend/src/tests/services/userService.test.ts`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-002 | Inicio de sesión con credenciales y rol correcto. | CP-AUTH-001, CP-AUTH-002, CP-AUTH-003, CP-AUTH-004, CP-AUTH-005, CP-AUTH-006; CP-SERV-AUTH-001, CP-SERV-AUTH-002 | `frontend/src/tests/auth/Login.test.tsx`; `frontend/src/tests/services/authService.test.ts`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-003 | Control de acceso por rol. | CP-ROUTE-001, CP-ROUTE-002, CP-ROUTE-003, CP-ROUTE-004, CP-ROUTE-005, CP-ROUTE-006; CP-AUTH-004 | `frontend/src/tests/routes/ProtectedRoute.test.tsx`; `frontend/src/tests/auth/Login.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-004 | Creación de solicitudes de servicio. | CP-SOL-001, CP-SOL-002, CP-SOL-004 | `frontend/src/tests/solicitudes/SolicitudForm.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-005 | Manejo de errores en solicitudes. | CP-SOL-002, CP-SOL-006 | `frontend/src/tests/solicitudes/SolicitudForm.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-006 | Carga de catálogos de servicios y comunas. | CP-SOL-003; CP-SERV-TECH-002 | `frontend/src/tests/solicitudes/SolicitudForm.test.tsx`; `frontend/src/tests/services/technicianService.test.ts`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-007 | Comunicación frontend-backend mediante servicios API. | CP-SERV-AUTH-001, CP-SERV-AUTH-002, CP-SERV-AUTH-003, CP-SERV-AUTH-004; CP-SERV-USER-001, CP-SERV-USER-002, CP-SERV-USER-003; CP-SERV-TECH-001, CP-SERV-TECH-002, CP-SERV-TECH-003, CP-SERV-TECH-004 | `frontend/src/tests/services/authService.test.ts`; `frontend/src/tests/services/userService.test.ts`; `frontend/src/tests/services/technicianService.test.ts`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-008 | Seguridad básica con token JWT. | CP-SERV-AUTH-003, CP-SERV-AUTH-004; CP-SERV-USER-003; CP-SERV-TECH-001, CP-SERV-TECH-002, CP-SERV-TECH-003; CP-ROUTE-006; CP-AUTH-004 | `frontend/src/tests/services/authService.test.ts`; `frontend/src/tests/services/userService.test.ts`; `frontend/src/tests/services/technicianService.test.ts`; `frontend/src/tests/routes/ProtectedRoute.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-009 | Mejora de accesibilidad en formularios. | CP-REG-001, CP-REG-006; CP-SOL-001, CP-SOL-004, CP-SOL-006 | `frontend/src/tests/auth/Register.test.tsx`; `frontend/src/tests/solicitudes/SolicitudForm.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-010 | Mejora UX de tipo de problema según servicio. | CP-SOL-005 | `frontend/src/tests/solicitudes/SolicitudForm.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-011 | Gestión y moderación de reseñas. | CP-REV-001, CP-REV-002, CP-REV-003, CP-REV-004 | `frontend/src/tests/reviews/ReviewManagement.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-012 | Gestión administrativa del sistema. | CP-ADMIN-001, CP-ADMIN-002, CP-ADMIN-003 | `frontend/src/tests/admin/AdminDashboard.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-013 | Visualización de usuarios del sistema. | CP-ADMIN-004, CP-ADMIN-005, CP-ADMIN-006 | `frontend/src/tests/admin/UserManagement.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-014 | Visualización de solicitudes por técnico. | CP-TEC-001, CP-TEC-002, CP-TEC-003, CP-TEC-004, CP-TEC-005 | `frontend/src/tests/tecnico/TecnicoDashboard.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |
| RF-015 | Gestión de cotizaciones por técnico. | CP-TEC-006 | `frontend/src/tests/tecnico/TecnicoDashboard.test.tsx`; `docs/evidencia-pruebas.md` | Aprobado |

## Resumen de cobertura

| Módulo | Archivo de prueba | Cantidad de casos | Estado |
| ------ | ----------------- | ----------------- | ------ |
| Login | `frontend/src/tests/auth/Login.test.tsx` | 6 | Aprobado |
| Register | `frontend/src/tests/auth/Register.test.tsx` | 6 | Aprobado |
| Rutas protegidas | `frontend/src/tests/routes/ProtectedRoute.test.tsx` | 6 | Aprobado |
| Servicios API - autenticación | `frontend/src/tests/services/authService.test.ts` | 4 | Aprobado |
| Servicios API - usuarios | `frontend/src/tests/services/userService.test.ts` | 3 | Aprobado |
| Servicios API - técnicos | `frontend/src/tests/services/technicianService.test.ts` | 4 | Aprobado |
| Solicitudes | `frontend/src/tests/solicitudes/SolicitudForm.test.tsx` | 6 | Aprobado |
| Reseñas y moderación | `frontend/src/tests/reviews/ReviewManagement.test.tsx` | 4 | Aprobado |
| Administración - dashboard | `frontend/src/tests/admin/AdminDashboard.test.tsx` | 3 | Aprobado |
| Administración - usuarios | `frontend/src/tests/admin/UserManagement.test.tsx` | 3 | Aprobado |
| Técnico - dashboard | `frontend/src/tests/tecnico/TecnicoDashboard.test.tsx` | 6 | Aprobado |

Total documentado: 51 casos de prueba aprobados.
