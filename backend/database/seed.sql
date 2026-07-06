-- REGIONES
INSERT INTO region (id_region, nombre_region)
VALUES
(1, 'Tarapacá'),
(2, 'Antofagasta'),
(3, 'Atacama'),
(4, 'Coquimbo'),
(5, 'Valparaíso'),
(6, 'Metropolitana'),
(7, 'O’Higgins'),
(8, 'Maule'),
(9, 'Ñuble'),
(10, 'Biobío'),
(11, 'La Araucanía'),
(12, 'Los Ríos'),
(13, 'Los Lagos')
ON CONFLICT (id_region) DO NOTHING;

-- COMUNASS
INSERT INTO comuna (
  id_comuna,
  nombre_comuna,
  region_id_region
)
VALUES
(1, 'Iquique', 1),
(2, 'Antofagasta', 2),
(3, 'Calama', 2),
(4, 'Copiapó', 3),
(5, 'La Serena', 4),
(6, 'Coquimbo', 4),
(7, 'Valparaíso', 5),
(8, 'Viña del Mar', 5),
(9, 'Quilpué', 5),
(10, 'Santiago', 6),
(11, 'Providencia', 6),
(12, 'Maipú', 6),
(13, 'Puente Alto', 6),
(14, 'Las Condes', 6),
(15, 'Rancagua', 7),
(16, 'Talca', 8),
(17, 'Curicó', 8),
(18, 'Chillán', 9),
(19, 'Concepción', 10),
(20, 'Talcahuano', 10),
(21, 'San Pedro de la Paz', 10),
(22, 'Los Ángeles', 10),
(23, 'Temuco', 11),
(24, 'Valdivia', 12),
(25, 'Puerto Montt', 13)
ON CONFLICT (id_comuna) DO NOTHING;

-- SERVICIOS
INSERT INTO servicio (
  id_servicio,
  nombre_servicio,
  descripcion_servicio,
  estado_servicio
)
VALUES
(1, 'Electricidad', 'Servicios eléctricos', true),
(2, 'Gasfitería', 'Reparaciones de agua y gas', true),
(3, 'Carpintería', 'Trabajos de madera', true),
(4, 'Cerrajería', 'Servicios de cerraduras', true),
(5, 'Techumbre', 'Instalación y reparación de techumbres', true),
(6, 'Pintura', 'Pintura de interiores y exteriores', true),
(7, 'Albañilería', 'Construcción y reparación de muros', true),
(8, 'Jardinería', 'Mantención de jardines y áreas verdes', true)
ON CONFLICT (id_servicio) DO NOTHING;

-- USUARIO ADMIN
-- Contraseña real: admin123
INSERT INTO usuario (
  rut,
  nombre_completo,
  fecha_nacimiento,
  genero,
  correo,
  telefono,
  contrasena,
  estado_usuario,
  comuna_id_comuna,
  tipo_usuario
)
VALUES (
  '11111111-1',
  'Administrador FixYa',
  '1990-01-01',
  'Masculino',
  'admin@fixya.cl',
  '999999999',
  '$2y$12$yRSpEk4TrjXeHrte.UhMrOCTSTy2G8N.xVuKPs7k0isZpnic46q8q',
  true,
  19,
  'ADMIN'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

-- USUARIO CLIENTE PRUEBA
-- Solo para QA/desarrollo. Contrasena real: cliente123
INSERT INTO usuario (
  rut,
  nombre_completo,
  fecha_nacimiento,
  genero,
  correo,
  telefono,
  contrasena,
  estado_usuario,
  comuna_id_comuna,
  tipo_usuario
)
VALUES (
  '12345678-5',
  'Cliente Prueba FixYa',
  '1998-05-10',
  'Femenino',
  'cliente.prueba@fixya.local',
  '988888888',
  '$2y$12$89AnaEY3u/onkdv1JG2zr.meugUfo2ZtkvyguDtE4u8rJk3Q8zP5.',
  true,
  19,
  'CLIENTE'
)
ON CONFLICT (rut) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

-- USUARIO TECNICO PRUEBA
-- Solo para QA/desarrollo. Contrasena real: tecnico123
INSERT INTO usuario (
  rut,
  nombre_completo,
  fecha_nacimiento,
  genero,
  correo,
  telefono,
  contrasena,
  estado_usuario,
  comuna_id_comuna,
  tipo_usuario
)
VALUES (
  '87654321-4',
  'Tecnico Prueba FixYa',
  '1995-02-15',
  'Masculino',
  'tecnico.prueba@fixya.local',
  '977777777',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  19,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

-- USUARIO CLIENTE DEMO
-- Contrasena real: cliente123
INSERT INTO usuario (
  rut,
  nombre_completo,
  fecha_nacimiento,
  genero,
  correo,
  telefono,
  contrasena,
  estado_usuario,
  comuna_id_comuna,
  tipo_usuario
)
VALUES (
  '22222222-2',
  'Cliente Demo',
  '1998-05-10',
  'Femenino',
  'cliente@fixya.cl',
  '988888888',
  '$2y$12$89AnaEY3u/onkdv1JG2zr.meugUfo2ZtkvyguDtE4u8rJk3Q8zP5.',
  true,
  19,
  'CLIENTE'
)
ON CONFLICT (rut) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

-- USUARIO TECNICO DEMO
-- Contrasena real: tecnico123
INSERT INTO usuario (
  rut,
  nombre_completo,
  fecha_nacimiento,
  genero,
  correo,
  telefono,
  contrasena,
  estado_usuario,
  comuna_id_comuna,
  tipo_usuario
)
VALUES (
  '12311111-1',
  'Tecnico Demo',
  '1995-02-15',
  'Masculino',
  'tecnico@fixya.cl',
  '977777777',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  19,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

-- ROLES BASE
INSERT INTO usuario_rol (usuario_rut, rol, activo)
VALUES
  ('11111111-1', 'ADMIN', true),
  ('12345678-5', 'CLIENTE', true),
  ('87654321-4', 'TECNICO', true),
  ('22222222-2', 'CLIENTE', true),
  ('12311111-1', 'TECNICO', true)
ON CONFLICT (usuario_rut, rol) DO UPDATE SET
  activo = EXCLUDED.activo;

-- TECNICO PRUEBA
INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado,
  estado_verificacion
)
VALUES (
  '87654321-4',
  'Tecnico de prueba para validacion de flujos FixYa',
  5,
  'Avanzado',
  true,
  'APROBADO'
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado,
  estado_verificacion = EXCLUDED.estado_verificacion;

-- TECNICO DEMO
INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado,
  estado_verificacion
)
VALUES (
  '12311111-1',
  'Especialista en instalaciones electricas',
  5,
  'Senior',
  true,
  'APROBADO'
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado,
  estado_verificacion = EXCLUDED.estado_verificacion;

-- SERVICIOS DEL TECNICO PRUEBA
INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES
  ('87654321-4', 1),
  ('87654321-4', 2),
  ('87654321-4', 3),
  ('87654321-4', 4),
  ('12311111-1', 1)
ON CONFLICT DO NOTHING;

-- COMUNA DEL TECNICO PRUEBA
INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna
)
VALUES (
  '87654321-4',
  19
)
ON CONFLICT DO NOTHING;

-- COMUNA DEL TECNICO DEMO
INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna
)
VALUES (
  '12311111-1',
  19
)
ON CONFLICT DO NOTHING;

-- ==========================================================================
-- DATOS DE PRUEBA: 10 TÉCNICOS (demo defensa de título)
-- --------------------------------------------------------------------------
-- Contraseña única para todos los técnicos de prueba: Tecnico1234
-- Hash generado con app.security.hash_password  =>  bcrypt(sha256hex(pwd))
-- RUT ficticios con dígito verificador válido (solo para pruebas).
-- Distribuidos en 8 oficios y en distintas regiones/comunas para poblar
-- el catálogo público y el panel de analítica. Idempotente (ON CONFLICT).
-- ==========================================================================

-- USUARIOS TÉCNICOS DE PRUEBA
INSERT INTO usuario (
  rut, nombre_completo, fecha_nacimiento, genero, correo,
  telefono, contrasena, estado_usuario, comuna_id_comuna, tipo_usuario
)
VALUES
  ('16345201-8', 'Sofía Contreras Rojas', '1991-03-14', 'Femenino', 'sofia.contreras@gmail.com', '961234571', '$2b$12$xOhpcD8b2NfaGc6VeNMwZO557iZ2bE9MgNs3unO5kVNOxIPP65/E6', true, 11, 'TECNICO'),
  ('17890342-2', 'Matías Fuentes Morales', '1989-07-22', 'Masculino', 'matias.fuentes@gmail.com', '962345672', '$2b$12$xOhpcD8b2NfaGc6VeNMwZO557iZ2bE9MgNs3unO5kVNOxIPP65/E6', true, 12, 'TECNICO'),
  ('15234876-7', 'Camila Herrera Núñez', '1994-11-02', 'Femenino', 'camila.herrera@gmail.com', '963456773', '$2b$12$xOhpcD8b2NfaGc6VeNMwZO557iZ2bE9MgNs3unO5kVNOxIPP65/E6', true, 8, 'TECNICO'),
  ('18765123-0', 'Diego Vera Sanhueza', '1996-01-19', 'Masculino', 'diego.vera@gmail.com', '964567874', '$2b$12$xOhpcD8b2NfaGc6VeNMwZO557iZ2bE9MgNs3unO5kVNOxIPP65/E6', true, 19, 'TECNICO'),
  ('14567890-6', 'Francisca Muñoz Tapia', '1985-09-30', 'Femenino', 'francisca.munoz@gmail.com', '965678975', '$2b$12$xOhpcD8b2NfaGc6VeNMwZO557iZ2bE9MgNs3unO5kVNOxIPP65/E6', true, 5, 'TECNICO'),
  ('19345671-6', 'Ignacio Riquelme Soto', '1998-04-08', 'Masculino', 'ignacio.riquelme@gmail.com', '966789076', '$2b$12$xOhpcD8b2NfaGc6VeNMwZO557iZ2bE9MgNs3unO5kVNOxIPP65/E6', true, 23, 'TECNICO'),
  ('20123456-3', 'Valentina Cáceres Pino', '2000-06-25', 'Femenino', 'valentina.caceres@gmail.com', '967890177', '$2b$12$xOhpcD8b2NfaGc6VeNMwZO557iZ2bE9MgNs3unO5kVNOxIPP65/E6', true, 14, 'TECNICO'),
  ('13876540-3', 'Sebastián Navarro Fuentealba', '1982-12-11', 'Masculino', 'sebastian.navarro@gmail.com', '968901278', '$2b$12$xOhpcD8b2NfaGc6VeNMwZO557iZ2bE9MgNs3unO5kVNOxIPP65/E6', true, 7, 'TECNICO'),
  ('17456219-1', 'Antonia Salas Espinoza', '1990-08-17', 'Femenino', 'antonia.salas@gmail.com', '969012379', '$2b$12$xOhpcD8b2NfaGc6VeNMwZO557iZ2bE9MgNs3unO5kVNOxIPP65/E6', true, 13, 'TECNICO'),
  ('18234905-6', 'Cristóbal Bravo Miranda', '1993-05-05', 'Masculino', 'cristobal.bravo@gmail.com', '960123480', '$2b$12$xOhpcD8b2NfaGc6VeNMwZO557iZ2bE9MgNs3unO5kVNOxIPP65/E6', true, 16, 'TECNICO')
ON CONFLICT (rut) DO NOTHING;

-- PERFIL TÉCNICO DE PRUEBA
INSERT INTO tecnico (
  usuario_rut, descripcion_perfil, experiencia_anios, nivel_tecnico, tecnico_verificado
)
VALUES
  ('16345201-8', 'Gasfíter certificada especializada en detección de filtraciones, cambio de artefactos sanitarios y redes de agua potable.', 8, 'Avanzado', true),
  ('17890342-2', 'Electricista con experiencia en instalaciones domiciliarias, tableros eléctricos y certificación SEC.', 12, 'Avanzado', true),
  ('15234876-7', 'Especialista en techumbres: reparación de goteras, cambio de planchas y hojalatería.', 5, 'Intermedio', true),
  ('18765123-0', 'Pintor profesional de interiores y exteriores, esmalte al agua y tratamiento de humedad.', 4, 'Intermedio', true),
  ('14567890-6', 'Maestra carpintera dedicada a muebles a medida, terminaciones y reparación de estructuras de madera.', 15, 'Avanzado', true),
  ('19345671-6', 'Albañil enfocado en construcción de muros, radieres y reparaciones menores de obra gruesa.', 3, 'Inicial', false),
  ('20123456-3', 'Jardinera especializada en mantención de áreas verdes, poda y diseño de jardines.', 2, 'Inicial', true),
  ('13876540-3', 'Cerrajero de urgencias: apertura, cambio de cerraduras y sistemas de seguridad.', 18, 'Avanzado', true),
  ('17456219-1', 'Técnica en gasfitería y electricidad, orientada a mantención integral del hogar.', 9, 'Avanzado', true),
  ('18234905-6', 'Técnico eléctrico y en techumbres, con foco en soluciones para viviendas y locales comerciales.', 6, 'Intermedio', false)
ON CONFLICT (usuario_rut) DO NOTHING;

UPDATE tecnico
SET estado_verificacion = CASE
  WHEN tecnico_verificado = TRUE THEN 'APROBADO'
  ELSE 'PENDIENTE'
END
WHERE estado_verificacion IS NULL
   OR estado_verificacion = 'PENDIENTE';

-- OFICIOS DE CADA TÉCNICO (tecnico_servicio)
INSERT INTO tecnico_servicio (tecnico_usuario_rut, servicio_id_servicio)
VALUES
  ('16345201-8', 2),
  ('17890342-2', 1),
  ('15234876-7', 5),
  ('18765123-0', 6),
  ('14567890-6', 3),
  ('19345671-6', 7),
  ('20123456-3', 8),
  ('13876540-3', 4),
  ('17456219-1', 2), ('17456219-1', 1),
  ('18234905-6', 1), ('18234905-6', 5)
ON CONFLICT DO NOTHING;

-- COBERTURA DE COMUNAS DE CADA TÉCNICO (tecnico_comuna)
-- estado_cobertura se declara explícito: el default=True es solo a nivel ORM,
-- y el panel analítico filtra por estado_cobertura = true.
INSERT INTO tecnico_comuna (tecnico_usuario_rut, comuna_id_comuna, estado_cobertura)
VALUES
  ('16345201-8', 11, true), ('16345201-8', 10, true),
  ('17890342-2', 12, true), ('17890342-2', 10, true),
  ('15234876-7', 8, true),  ('15234876-7', 7, true),
  ('18765123-0', 19, true), ('18765123-0', 20, true),
  ('14567890-6', 5, true),  ('14567890-6', 6, true),
  ('19345671-6', 23, true),
  ('20123456-3', 14, true), ('20123456-3', 11, true),
  ('13876540-3', 7, true),  ('13876540-3', 9, true),
  ('17456219-1', 13, true), ('17456219-1', 10, true),
  ('18234905-6', 16, true)
ON CONFLICT DO NOTHING;


-- ==========================================================================
-- DATOS DE PRUEBA: CLIENTES Y SOLICITUDES (demo defensa de título)
-- --------------------------------------------------------------------------
-- Contraseña única para los clientes de prueba: Cliente1234
-- created_at distribuido en el tiempo para poblar "usuarios por mes".
-- ==========================================================================

-- CLIENTES DE PRUEBA
INSERT INTO usuario (
  rut, nombre_completo, fecha_nacimiento, genero, correo,
  telefono, contrasena, estado_usuario, comuna_id_comuna, tipo_usuario, created_at
)
VALUES
  ('15987654-8', 'Josefa Reyes Vidal', '1992-04-18', 'Femenino', 'josefa.reyes@gmail.com', '971112221', '$2b$12$HAMRe1QsgYMptsqxshdRfuCH8sZBXjec6U8/rfusKBPFxYrWaf8OW', true, 10, 'CLIENTE', '2026-02-18'),
  ('16234098-4', 'Tomás Álvarez Godoy', '1988-10-05', 'Masculino', 'tomas.alvarez@gmail.com', '971112222', '$2b$12$HAMRe1QsgYMptsqxshdRfuCH8sZBXjec6U8/rfusKBPFxYrWaf8OW', true, 8, 'CLIENTE', '2026-03-15'),
  ('17654321-6', 'Catalina Figueroa Rojas', '1996-02-27', 'Femenino', 'catalina.figueroa@gmail.com', '971112223', '$2b$12$HAMRe1QsgYMptsqxshdRfuCH8sZBXjec6U8/rfusKBPFxYrWaf8OW', true, 19, 'CLIENTE', '2026-04-10'),
  ('14098765-K', 'Benjamín Castro León', '1979-07-09', 'Masculino', 'benjamin.castro@gmail.com', '971112224', '$2b$12$HAMRe1QsgYMptsqxshdRfuCH8sZBXjec6U8/rfusKBPFxYrWaf8OW', true, 23, 'CLIENTE', '2026-05-06'),
  ('19876543-1', 'Isidora Pizarro Fuentes', '2001-11-30', 'Femenino', 'isidora.pizarro@gmail.com', '971112225', '$2b$12$HAMRe1QsgYMptsqxshdRfuCH8sZBXjec6U8/rfusKBPFxYrWaf8OW', true, 5, 'CLIENTE', '2026-06-02'),
  ('13456789-5', 'Vicente Cortés Araya', '1984-03-22', 'Masculino', 'vicente.cortes@gmail.com', '971112226', '$2b$12$HAMRe1QsgYMptsqxshdRfuCH8sZBXjec6U8/rfusKBPFxYrWaf8OW', true, 12, 'CLIENTE', '2026-06-28')
ON CONFLICT (rut) DO NOTHING;

-- ROLES PARA DATOS DEMO
INSERT INTO usuario_rol (usuario_rut, rol, activo)
VALUES
  ('16345201-8', 'TECNICO', true),
  ('17890342-2', 'TECNICO', true),
  ('15234876-7', 'TECNICO', true),
  ('18765123-0', 'TECNICO', true),
  ('14567890-6', 'TECNICO', true),
  ('19345671-6', 'TECNICO', true),
  ('20123456-3', 'TECNICO', true),
  ('13876540-3', 'TECNICO', true),
  ('17456219-1', 'TECNICO', true),
  ('18234905-6', 'TECNICO', true),
  ('15987654-8', 'CLIENTE', true),
  ('16234098-4', 'CLIENTE', true),
  ('17654321-6', 'CLIENTE', true),
  ('14098765-K', 'CLIENTE', true),
  ('19876543-1', 'CLIENTE', true),
  ('13456789-5', 'CLIENTE', true)
ON CONFLICT (usuario_rut, rol) DO UPDATE SET
  activo = EXCLUDED.activo;


-- ==========================================================================
-- DATOS DE PRUEBA: DOCUMENTOS TÉCNICOS (evidencia coherente con verificación)
-- --------------------------------------------------------------------------
-- Lógica del sistema (verificar_tecnico_automaticamente): un técnico se
-- verifica cuando tiene APROBADOS los documentos CERTIFICADO_TECNICO y
-- ANTECEDENTES. Por eso los técnicos verificados reciben esos documentos
-- (más cédula) en estado aprobado, y los pendientes reciben documentos
-- aún sin aprobar. El aprobador es el admin (11111111-1).
-- Archivos de evidencia servidos desde /uploads/documentos_tecnicos/.
-- ==========================================================================
INSERT INTO documento_tecnico (
  id_documento, tecnico_usuario_rut, tipo_documento, nombre_archivo, archivo_url,
  fecha_subida, documento_aprobado, fecha_aprobacion, usuario_rut
)
VALUES
  (9001, '12311111-1', 'CEDULA_IDENTIDAD', 'cedula_identidad_12311111-1.pdf', '/uploads/documentos_tecnicos/cedula_identidad.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9002, '12311111-1', 'CERTIFICADO_TECNICO', 'certificado_tecnico_12311111-1.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9003, '12311111-1', 'ANTECEDENTES', 'antecedentes_12311111-1.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9004, '16345201-8', 'CEDULA_IDENTIDAD', 'cedula_identidad_16345201-8.pdf', '/uploads/documentos_tecnicos/cedula_identidad.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9005, '16345201-8', 'CERTIFICADO_TECNICO', 'certificado_tecnico_16345201-8.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9006, '16345201-8', 'ANTECEDENTES', 'antecedentes_16345201-8.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9007, '17890342-2', 'CEDULA_IDENTIDAD', 'cedula_identidad_17890342-2.pdf', '/uploads/documentos_tecnicos/cedula_identidad.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9008, '17890342-2', 'CERTIFICADO_TECNICO', 'certificado_tecnico_17890342-2.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9009, '17890342-2', 'ANTECEDENTES', 'antecedentes_17890342-2.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9010, '15234876-7', 'CEDULA_IDENTIDAD', 'cedula_identidad_15234876-7.pdf', '/uploads/documentos_tecnicos/cedula_identidad.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9011, '15234876-7', 'CERTIFICADO_TECNICO', 'certificado_tecnico_15234876-7.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9012, '15234876-7', 'ANTECEDENTES', 'antecedentes_15234876-7.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9013, '18765123-0', 'CEDULA_IDENTIDAD', 'cedula_identidad_18765123-0.pdf', '/uploads/documentos_tecnicos/cedula_identidad.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9014, '18765123-0', 'CERTIFICADO_TECNICO', 'certificado_tecnico_18765123-0.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9015, '18765123-0', 'ANTECEDENTES', 'antecedentes_18765123-0.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9016, '14567890-6', 'CEDULA_IDENTIDAD', 'cedula_identidad_14567890-6.pdf', '/uploads/documentos_tecnicos/cedula_identidad.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9017, '14567890-6', 'CERTIFICADO_TECNICO', 'certificado_tecnico_14567890-6.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9018, '14567890-6', 'ANTECEDENTES', 'antecedentes_14567890-6.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9019, '20123456-3', 'CEDULA_IDENTIDAD', 'cedula_identidad_20123456-3.pdf', '/uploads/documentos_tecnicos/cedula_identidad.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9020, '20123456-3', 'CERTIFICADO_TECNICO', 'certificado_tecnico_20123456-3.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9021, '20123456-3', 'ANTECEDENTES', 'antecedentes_20123456-3.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9022, '13876540-3', 'CEDULA_IDENTIDAD', 'cedula_identidad_13876540-3.pdf', '/uploads/documentos_tecnicos/cedula_identidad.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9023, '13876540-3', 'CERTIFICADO_TECNICO', 'certificado_tecnico_13876540-3.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9024, '13876540-3', 'ANTECEDENTES', 'antecedentes_13876540-3.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9025, '17456219-1', 'CEDULA_IDENTIDAD', 'cedula_identidad_17456219-1.pdf', '/uploads/documentos_tecnicos/cedula_identidad.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9026, '17456219-1', 'CERTIFICADO_TECNICO', 'certificado_tecnico_17456219-1.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9027, '17456219-1', 'ANTECEDENTES', 'antecedentes_17456219-1.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-06-01', true, '2026-06-03', '11111111-1'),
  (9028, '19345671-6', 'CERTIFICADO_TECNICO', 'certificado_tecnico_19345671-6.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-07-01', false, NULL, NULL),
  (9029, '19345671-6', 'ANTECEDENTES', 'antecedentes_19345671-6.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-07-01', false, NULL, NULL),
  (9030, '18234905-6', 'CERTIFICADO_TECNICO', 'certificado_tecnico_18234905-6.pdf', '/uploads/documentos_tecnicos/certificado_tecnico.pdf', '2026-07-01', false, NULL, NULL),
  (9031, '18234905-6', 'ANTECEDENTES', 'antecedentes_18234905-6.pdf', '/uploads/documentos_tecnicos/antecedentes.pdf', '2026-07-01', false, NULL, NULL)
ON CONFLICT (id_documento) DO NOTHING;

-- ==========================================================================
-- DATOS DE PRUEBA: SOLICITUDES (demo defensa de título)
-- --------------------------------------------------------------------------
-- 25 solicitudes en los 5 estados y 8 oficios. Los estados ASIGNADO,
-- EN_PROCESO y FINALIZADO se asignan a un técnico VERIFICADO que ofrece
-- ese oficio y cubre esa comuna. Las FINALIZADAS incluyen costo y fecha
-- real. IDs explícitos 9001+ e idempotencia con ON CONFLICT.
-- ==========================================================================
INSERT INTO solicitud (
  id_solicitud, usuario_rut, servicio_id_servicio, tecnico_usuario_rut, comuna_id_comuna,
  titulo_solicitud, descripcion_problema, urgencia, direccion, estado_trabajo,
  tipo_problema, ubicacion_problema_referencia, costo_final, fecha_creacion, fecha_real, solicitud_activa
)
VALUES
  (9001, '15987654-8', 2, '16345201-8', 11, 'Filtración en la cocina', 'Cañería bajo el lavaplatos con filtración constante de agua potable.', 'ALTA', 'Av. Providencia 1234, depto 45', 'FINALIZADO', 'Fuga de agua', 'Cocina', 45000, '2026-04-10', '2026-04-13', false),
  (9002, '13456789-5', 2, '17456219-1', 13, 'Cambio de llave de paso', 'Se requiere cambiar la llave de paso principal del baño que quedó trabada.', 'MEDIA', 'Camino El Alba 456', 'FINALIZADO', 'Llave en mal estado', 'Bano', 28000, '2026-05-02', '2026-05-05', false),
  (9003, '13456789-5', 1, '17890342-2', 12, 'Tablero eléctrico saltado', 'El tablero se corta cada vez que se enciende el horno eléctrico.', 'ALTA', 'Av. Pajaritos 2890', 'FINALIZADO', 'Cortocircuito', 'Cocina', 60000, '2026-04-20', '2026-04-23', false),
  (9004, '15987654-8', 1, '17456219-1', 10, 'Instalación de enchufes nuevos', 'Necesito instalar tres enchufes en el living y el dormitorio principal.', 'MEDIA', 'Calle Compañía 1450', 'FINALIZADO', 'Instalacion electrica', 'Living', 42000, '2026-05-14', '2026-05-16', false),
  (9005, '17654321-6', 1, '12311111-1', 19, 'Revisión de instalación', 'Revisión general de la instalación eléctrica del departamento por cortes.', 'BAJA', 'Barros Arana 780', 'FINALIZADO', 'Revision electrica', 'General', 55000, '2026-04-08', '2026-04-11', false),
  (9006, '16234098-4', 5, '15234876-7', 8, 'Gotera en el dormitorio', 'Con las lluvias apareció una gotera sobre el dormitorio principal.', 'ALTA', '5 Norte 340', 'FINALIZADO', 'Gotera', 'Dormitorio', 85000, '2026-05-18', '2026-05-22', false),
  (9007, '16234098-4', 5, '15234876-7', 7, 'Filtración en la techumbre', 'Filtración de agua en el cielo del pasillo tras las lluvias del invierno.', 'MEDIA', 'Cerro Alegre 210', 'FINALIZADO', 'Filtracion techo', 'Pasillo', 90000, '2026-06-03', '2026-06-06', false),
  (9008, '17654321-6', 6, '18765123-0', 19, 'Pintura de living comedor', 'Pintar el living y comedor completo, incluye preparación de muros.', 'BAJA', 'Av. Los Carrera 1120', 'FINALIZADO', 'Pintura interior', 'Living comedor', 150000, '2026-05-10', '2026-05-15', false),
  (9009, '19876543-1', 3, '14567890-6', 5, 'Reparación de closet', 'Las puertas del closet del dormitorio están descolgadas y una bisagra rota.', 'MEDIA', 'Av. Francisco de Aguirre 230', 'FINALIZADO', 'Mueble danado', 'Dormitorio', 40000, '2026-04-15', '2026-04-18', false),
  (9010, '15987654-8', 8, '20123456-3', 14, 'Mantención de jardín', 'Poda de arbustos, corte de pasto y limpieza general del jardín.', 'BAJA', 'Av. Apoquindo 4500', 'FINALIZADO', 'Mantencion jardin', 'Patio trasero', 35000, '2026-05-25', '2026-05-27', false),
  (9011, '16234098-4', 4, '13876540-3', 7, 'Cambio de cerradura', 'Se trabó la cerradura de la puerta principal y necesito cambiarla.', 'ALTA', 'Cerro Concepción 145', 'FINALIZADO', 'Cerradura trabada', 'Puerta principal', 32000, '2026-04-28', '2026-04-28', false),
  (9012, '16234098-4', 4, '13876540-3', 9, 'Apertura de puerta', 'Quedé fuera de mi casa sin llaves y necesito apertura sin daños.', 'ALTA', 'Av. Los Carrera 890', 'FINALIZADO', 'Apertura de puerta', 'Acceso', 25000, '2026-06-10', '2026-06-10', false),
  (9013, '15987654-8', 2, '16345201-8', 10, 'Desagüe tapado en el baño', 'El desagüe de la ducha está tapado y el agua se acumula al bañarse.', 'MEDIA', 'Merced 640', 'FINALIZADO', 'Desague tapado', 'Bano', 38000, '2026-05-20', '2026-05-22', false),
  (9014, '15987654-8', 1, '17890342-2', 10, 'Cambio de automático', 'El interruptor automático del tablero está quemado y hay que cambiarlo.', 'MEDIA', 'Catedral 1980', 'EN_PROCESO', 'Automatico quemado', 'Tablero', NULL, '2026-06-25', NULL, true),
  (9015, '17654321-6', 6, '18765123-0', 20, 'Pintura de fachada', 'Pintura exterior de la fachada de la casa, incluye la reja.', 'MEDIA', 'Colón 450', 'EN_PROCESO', 'Pintura exterior', 'Fachada', NULL, '2026-06-20', NULL, true),
  (9016, '15987654-8', 8, '20123456-3', 11, 'Diseño de antejardín', 'Rediseñar el antejardín con plantas nativas y riego básico.', 'BAJA', 'Los Leones 230', 'EN_PROCESO', 'Diseno jardin', 'Antejardin', NULL, '2026-06-28', NULL, true),
  (9017, '15987654-8', 2, '17456219-1', 10, 'Calefont sin agua caliente', 'El calefont no calienta el agua, la llama se apaga a los segundos.', 'ALTA', 'Santo Domingo 2300', 'ASIGNADO', 'Calefont', 'Bano', NULL, '2026-06-30', NULL, true),
  (9018, '19876543-1', 3, '14567890-6', 6, 'Mueble de cocina a medida', 'Cotizar e instalar un mueble bajo lavaplatos a medida para la cocina.', 'BAJA', 'Videla 1450', 'ASIGNADO', 'Mueble a medida', 'Cocina', NULL, '2026-07-01', NULL, true),
  (9019, '16234098-4', 5, '15234876-7', 7, 'Revisión de canaletas', 'Las canaletas del techo están sueltas y con acumulación de hojas.', 'MEDIA', 'Av. Brasil 1230', 'ASIGNADO', 'Canaletas', 'Techo', NULL, '2026-06-29', NULL, true),
  (9020, '16234098-4', 4, '13876540-3', 7, 'Refuerzo de chapa', 'Necesito reforzar la chapa y agregar un cerrojo adicional a la puerta.', 'BAJA', 'Subida Ecuador 55', 'ASIGNADO', 'Chapa de seguridad', 'Puerta principal', NULL, '2026-07-03', NULL, true),
  (9021, '17654321-6', 1, NULL, 19, 'Instalación de luminarias', 'Instalar seis focos LED embutidos en el cielo del living comedor.', 'BAJA', 'Aníbal Pinto 340', 'INICIADO', 'Instalacion LED', 'Living', NULL, '2026-07-02', NULL, true),
  (9022, '14098765-K', 7, NULL, 23, 'Reparación de muro', 'Un muro del patio tiene grietas y se está desprendiendo el estuco.', 'MEDIA', 'Av. Alemania 0560', 'INICIADO', 'Grietas en muro', 'Patio', NULL, '2026-06-22', NULL, true),
  (9023, '16234098-4', 3, NULL, 8, 'Instalación de repisas', 'Instalar cuatro repisas flotantes de madera en el escritorio.', 'BAJA', 'Álvarez 680', 'INICIADO', 'Instalacion repisas', 'Escritorio', NULL, '2026-07-04', NULL, true),
  (9024, '14098765-K', 7, NULL, 23, 'Construcción de radier', 'Cotización para radier de estacionamiento, se posterga el proyecto.', 'BAJA', 'Recabarren 1200', 'CANCELADO', 'Radier', 'Estacionamiento', NULL, '2026-06-01', NULL, false),
  (9025, '15987654-8', 6, NULL, 11, 'Pintura de dormitorio', 'Pintar un dormitorio, pero decidí posponer el trabajo por ahora.', 'BAJA', 'Marchant Pereira 150', 'CANCELADO', 'Pintura interior', 'Dormitorio', NULL, '2026-06-05', NULL, false)
ON CONFLICT (id_solicitud) DO NOTHING;


-- ==========================================================================
-- DATOS DE PRUEBA: RESEÑAS (reputación de técnicos y ranking)
-- --------------------------------------------------------------------------
-- Una reseña por cada solicitud FINALIZADA (relación 1:1). Calificaciones
-- variadas para un ranking real. Comentarios con palabras clave que el
-- análisis de reputación reconoce. Una reseña queda reportada y pendiente
-- de moderación para poblar el panel de reseñas del admin. Idempotente.
-- ==========================================================================
INSERT INTO resena (
  id_resena, solicitud_id_solicitud, usuario_rut, calificacion, comentario,
  fecha_resena, resena_activa, resena_reportada, motivo_reporte, fecha_reporte,
  reporte_resuelto, fecha_resolucion, usuario_rut_reporta, admin_rut_resuelve
)
VALUES
  (9001, 9001, '15987654-8', 5.0, 'Excelente trabajo, muy puntual y dejó todo limpio y ordenado. La reparación quedó perfecta, totalmente recomendado.', '2026-04-14', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9002, 9002, '13456789-5', 5.0, 'Muy profesional y explicó todo con claridad. Trabajo impecable y a un precio justo, la recomiendo.', '2026-05-06', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9003, 9003, '13456789-5', 4.0, 'Solucionó el problema del tablero sin inconvenientes. Buen trato, aunque se demoró un poco en llegar.', '2026-04-24', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9004, 9004, '15987654-8', 5.0, 'Instalación rápida y prolija, muy amable y ordenada. Quedé muy conforme con el resultado.', '2026-05-17', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9005, 9005, '17654321-6', 4.5, 'Buen técnico, revisó todo con detalle y explicó cada punto. Trabajo profesional y responsable.', '2026-04-12', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9006, 9006, '16234098-4', 4.0, 'Reparó la gotera y quedó bien. Amable y cuidadosa con la limpieza del lugar.', '2026-05-23', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9007, 9007, '16234098-4', 3.5, 'El trabajo quedó correcto, pero la comunicación previa fue algo confusa y demoró en coordinar.', '2026-06-07', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9008, 9008, '17654321-6', 5.0, 'Pintura impecable, muy prolijo y ordenado. Cumplió los plazos y el acabado es excelente, recomendado.', '2026-05-16', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9009, 9009, '19876543-1', 4.5, 'Muy buena carpintera, dejó el closet como nuevo. Profesional, puntual y con un precio justo.', '2026-04-19', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9010, 9010, '15987654-8', 5.0, 'Dejó el jardín impecable, muy dedicada y ordenada. Excelente disposición, la recomiendo.', '2026-05-28', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9011, 9011, '16234098-4', 4.0, 'Cambió la cerradura rápido y quedó firme. Buen trato y una solución efectiva.', '2026-04-29', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL),
  (9012, 9012, '16234098-4', 3.0, 'El trabajo quedó bien pero llegó tarde y el cobro final fue mayor al presupuesto acordado.', '2026-06-11', 'S', 'S', 'El técnico reporta que la reseña no refleja el trabajo acordado', '2026-06-12', 'N', NULL, '13876540-3', NULL),
  (9013, 9013, '15987654-8', 4.5, 'Buena solución al problema del desagüe, profesional y amable. El precio me pareció justo.', '2026-05-23', 'S', 'N', NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id_resena) DO NOTHING;
-- SOLICITUDES DEL CLIENTE PRUEBA
INSERT INTO solicitud (
  id_solicitud,
  usuario_rut,
  servicio_id_servicio,
  tecnico_usuario_rut,
  comuna_id_comuna,
  titulo_solicitud,
  descripcion_problema,
  urgencia,
  direccion,
  solicitud_activa,
  estado_trabajo,
  tipo_problema,
  ubicacion_problema_referencia,
  tipo_inmueble,
  detalle_inmueble,
  piso,
  numero_departamento,
  tiene_conserjeria,
  requiere_autorizacion,
  horario_disponible,
  condiciones_acceso,
  instrucciones_acceso,
  persona_contacto,
  telefono_contacto,
  estacionamiento_disponible,
  tiene_mascotas
)
VALUES
  (
    9101,
    '12345678-5',
    1,
    NULL,
    19,
    'Reparacion electrica en cocina',
    'El enchufe principal de la cocina dejo de funcionar y salta el automatico al conectar electrodomesticos.',
    'MEDIA',
    'Av. Prueba 123, Concepcion',
    true,
    'INICIADO',
    'Falla electrica',
    'Cocina junto al lavaplatos',
    'Departamento',
    'Edificio con acceso por conserjeria',
    '5',
    '502',
    true,
    true,
    'Lunes 19:00 a 22:00, Miercoles 15:00 a 19:00',
    'Avisar en conserjeria antes de subir',
    'Llamar al contacto cuando llegue al edificio',
    'Cliente Prueba FixYa',
    '988888888',
    true,
    false
  ),
  (
    9102,
    '12345678-5',
    2,
    NULL,
    19,
    'Filtracion de agua en bano',
    'Hay una filtracion bajo el lavamanos del bano principal y el mueble se moja constantemente.',
    'ALTA',
    'Av. Prueba 123, Concepcion',
    true,
    'INICIADO',
    'Filtracion',
    'Bano principal bajo el lavamanos',
    'Departamento',
    'Edificio con acceso por conserjeria',
    '5',
    '502',
    true,
    true,
    'Martes 18:00 a 21:00, Jueves 19:00 a 22:00',
    'Avisar en conserjeria antes de subir',
    'Llamar al contacto cuando llegue al edificio',
    'Cliente Prueba FixYa',
    '988888888',
    true,
    false
  )
ON CONFLICT (id_solicitud) DO UPDATE SET
  usuario_rut = EXCLUDED.usuario_rut,
  servicio_id_servicio = EXCLUDED.servicio_id_servicio,
  tecnico_usuario_rut = EXCLUDED.tecnico_usuario_rut,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna,
  titulo_solicitud = EXCLUDED.titulo_solicitud,
  descripcion_problema = EXCLUDED.descripcion_problema,
  urgencia = EXCLUDED.urgencia,
  direccion = EXCLUDED.direccion,
  solicitud_activa = EXCLUDED.solicitud_activa,
  estado_trabajo = EXCLUDED.estado_trabajo,
  tipo_problema = EXCLUDED.tipo_problema,
  ubicacion_problema_referencia = EXCLUDED.ubicacion_problema_referencia,
  tipo_inmueble = EXCLUDED.tipo_inmueble,
  detalle_inmueble = EXCLUDED.detalle_inmueble,
  piso = EXCLUDED.piso,
  numero_departamento = EXCLUDED.numero_departamento,
  tiene_conserjeria = EXCLUDED.tiene_conserjeria,
  requiere_autorizacion = EXCLUDED.requiere_autorizacion,
  horario_disponible = EXCLUDED.horario_disponible,
  condiciones_acceso = EXCLUDED.condiciones_acceso,
  instrucciones_acceso = EXCLUDED.instrucciones_acceso,
  persona_contacto = EXCLUDED.persona_contacto,
  telefono_contacto = EXCLUDED.telefono_contacto,
  estacionamiento_disponible = EXCLUDED.estacionamiento_disponible,
  tiene_mascotas = EXCLUDED.tiene_mascotas;

INSERT INTO solicitud_disponibilidad (
  solicitud_id_solicitud,
  dia,
  hora_inicio,
  hora_fin
)
VALUES
  (9101, 'LUNES', '19:00', '22:00'),
  (9101, 'MIERCOLES', '15:00', '19:00'),
  (9102, 'MARTES', '18:00', '21:00'),
  (9102, 'JUEVES', '19:00', '22:00')
ON CONFLICT (solicitud_id_solicitud, dia) DO UPDATE SET
  hora_inicio = EXCLUDED.hora_inicio,
  hora_fin = EXCLUDED.hora_fin;

SELECT setval(
  pg_get_serial_sequence('solicitud', 'id_solicitud'),
  GREATEST((SELECT MAX(id_solicitud) FROM solicitud), 1)
);
