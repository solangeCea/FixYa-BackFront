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
(5, 'Pintura', 'Servicios de pintura interior y exterior', true),
(6, 'Jardinería', 'Mantención y diseño de áreas verdes', true),
(7, 'Climatización', 'Instalación y mantención de aire acondicionado y calefacción', true),
(8, 'Albañilería', 'Reparaciones y trabajos de construcción menor', true),
(9, 'Reparación de electrodomésticos', 'Diagnóstico y reparación de electrodomésticos del hogar', true),
(10, 'Limpieza profunda', 'Limpieza detallada de hogares, oficinas y espacios comunes', true),
(11, 'Instalación de cámaras', 'Instalación y configuración de cámaras de seguridad', true),
(12, 'Mantención de calefont', 'Revisión, limpieza y mantención de calefont', true)
ON CONFLICT (id_servicio) DO UPDATE SET
  nombre_servicio = EXCLUDED.nombre_servicio,
  descripcion_servicio = EXCLUDED.descripcion_servicio,
  estado_servicio = EXCLUDED.estado_servicio;

SELECT setval(
pg_get_serial_sequence('servicio', 'id_servicio'),
COALESCE((SELECT MAX(id_servicio) FROM servicio), 1)
);

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

-- USUARIO CLIENTE
-- Contraseña real: cliente123
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
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

-- USUARIOS CLIENTES DEMO ADICIONALES
-- Contraseña real para clientes demo: cliente123
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
VALUES
(
  '22222223-3',
  'Camila Rojas Muñoz',
  '1996-03-12',
  'Femenino',
  'camila.rojas@fixya.cl',
  '988111111',
  '$2y$12$89AnaEY3u/onkdv1JG2zr.meugUfo2ZtkvyguDtE4u8rJk3Q8zP5.',
  true,
  19,
  'CLIENTE'
),
(
  '22222224-4',
  'Felipe Torres Araya',
  '1992-07-22',
  'Masculino',
  'felipe.torres@fixya.cl',
  '988222222',
  '$2y$12$89AnaEY3u/onkdv1JG2zr.meugUfo2ZtkvyguDtE4u8rJk3Q8zP5.',
  true,
  20,
  'CLIENTE'
),
(
  '22222225-5',
  'Daniela Pérez Soto',
  '1999-11-05',
  'Femenino',
  'daniela.perez@fixya.cl',
  '988333333',
  '$2y$12$89AnaEY3u/onkdv1JG2zr.meugUfo2ZtkvyguDtE4u8rJk3Q8zP5.',
  true,
  21,
  'CLIENTE'
),
(
  '22222226-6',
  'Matías González Vidal',
  '1988-09-18',
  'Masculino',
  'matias.gonzalez@fixya.cl',
  '988444444',
  '$2y$12$89AnaEY3u/onkdv1JG2zr.meugUfo2ZtkvyguDtE4u8rJk3Q8zP5.',
  true,
  10,
  'CLIENTE'
),
(
  '22222227-7',
  'Valentina Morales Fuentes',
  '1994-01-30',
  'Femenino',
  'valentina.morales@fixya.cl',
  '988555555',
  '$2y$12$89AnaEY3u/onkdv1JG2zr.meugUfo2ZtkvyguDtE4u8rJk3Q8zP5.',
  true,
  11,
  'CLIENTE'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

-- USUARIO TÉCNICO
-- Contraseña real: tecnico123
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
  'Técnico Demo',
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
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

SELECT setval(
pg_get_serial_sequence('usuario', 'id_usuario'),
COALESCE((SELECT MAX(id_usuario) FROM usuario), 1)
);

-- TÉCNICO
INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12311111-1',
  'Especialista en instalaciones eléctricas',
  5,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

-- TÉCNICO SERVICIO
INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12311111-1',
  1
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

-- TÉCNICO COMUNA
INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12311111-1',
  19,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICOS DEMO SERVICIOS 9 A 12
-- Contraseña real para técnicos demo: tecnico123

-- TÉCNICO REPARACIÓN DE ELECTRODOMÉSTICOS: Iván Navarro Reyes
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
  '12399991-1',
  'Iván Navarro Reyes',
  '1982-05-11',
  'Masculino',
  'ivan.navarro@fixya.cl',
  '977999911',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  10,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12399991-1',
  'Técnico senior en diagnóstico y reparación de electrodomésticos',
  12,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12399991-1',
  9
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12399991-1',
  10,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO REPARACIÓN DE ELECTRODOMÉSTICOS: Lorena Acuña Torres
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
  '12399992-2',
  'Lorena Acuña Torres',
  '1990-09-24',
  'Femenino',
  'lorena.acuna@fixya.cl',
  '977999922',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  11,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12399992-2',
  'Técnica en mantención y reparación de electrodomésticos del hogar',
  6,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12399992-2',
  9
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12399992-2',
  11,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO REPARACIÓN DE ELECTRODOMÉSTICOS: Franco Molina Pérez
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
  '12399993-3',
  'Franco Molina Pérez',
  '1998-03-16',
  'Masculino',
  'franco.molina@fixya.cl',
  '977999933',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  20,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12399993-3',
  'Técnico junior en diagnóstico y apoyo a reparación de electrodomésticos',
  2,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12399993-3',
  9
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12399993-3',
  20,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO LIMPIEZA PROFUNDA: Daniela Castillo Vega
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
  '12410101-1',
  'Daniela Castillo Vega',
  '1987-07-08',
  'Femenino',
  'daniela.castillo@fixya.cl',
  '977101011',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  19,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12410101-1',
  'Especialista senior en limpieza profunda de hogares y espacios comunes',
  8,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12410101-1',
  10
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12410101-1',
  19,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO LIMPIEZA PROFUNDA: Mario Sepúlveda Díaz
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
  '12410102-2',
  'Mario Sepúlveda Díaz',
  '1992-12-02',
  'Masculino',
  'mario.sepulveda@fixya.cl',
  '977101022',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  21,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12410102-2',
  'Técnico en limpieza detallada de oficinas, hogares y espacios comunes',
  4,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12410102-2',
  10
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12410102-2',
  21,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO LIMPIEZA PROFUNDA: Camila Paredes Soto
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
  '12410103-3',
  'Camila Paredes Soto',
  '2000-01-19',
  'Femenino',
  'camila.paredes@fixya.cl',
  '977101033',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  8,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12410103-3',
  'Técnica junior en limpieza profunda y orden de espacios interiores',
  1,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12410103-3',
  10
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12410103-3',
  8,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO INSTALACIÓN DE CÁMARAS: Renato Silva Fuentes
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
  '12411111-1',
  'Renato Silva Fuentes',
  '1986-10-14',
  'Masculino',
  'renato.silva@fixya.cl',
  '977111111',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  10,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12411111-1',
  'Técnico senior en instalación y configuración de cámaras de seguridad',
  9,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12411111-1',
  11
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12411111-1',
  10,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO INSTALACIÓN DE CÁMARAS: Sofía Morales Araya
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
  '12411112-2',
  'Sofía Morales Araya',
  '1992-04-05',
  'Femenino',
  'sofia.morales@fixya.cl',
  '977111122',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  11,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12411112-2',
  'Técnica en instalación de cámaras, cableado y configuración básica',
  5,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12411112-2',
  11
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12411112-2',
  11,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO INSTALACIÓN DE CÁMARAS: Diego Rojas Pino
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
  '12411113-3',
  'Diego Rojas Pino',
  '1999-02-28',
  'Masculino',
  'diego.rojas@fixya.cl',
  '977111133',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  7,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12411113-3',
  'Técnico junior en instalación de cámaras y soporte en terreno',
  2,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12411113-3',
  11
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12411113-3',
  7,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO MANTENCIÓN DE CALEFONT: Carlos Figueroa Lagos
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
  '12412121-1',
  'Carlos Figueroa Lagos',
  '1983-06-17',
  'Masculino',
  'carlos.figueroa@fixya.cl',
  '977121211',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  19,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12412121-1',
  'Técnico senior en revisión, limpieza y mantención de calefont',
  11,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12412121-1',
  12
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12412121-1',
  19,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO MANTENCIÓN DE CALEFONT: Valeria Muñoz Rivas
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
  '12412122-2',
  'Valeria Muñoz Rivas',
  '1990-11-10',
  'Femenino',
  'valeria.munoz@fixya.cl',
  '977121222',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  20,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12412122-2',
  'Técnica en mantención preventiva y limpieza de calefont',
  6,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12412122-2',
  12
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12412122-2',
  20,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO MANTENCIÓN DE CALEFONT: Pablo Herrera Soto
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
  '12412123-3',
  'Pablo Herrera Soto',
  '1997-08-23',
  'Masculino',
  'pablo.herrera@fixya.cl',
  '977121233',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  12,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12412123-3',
  'Técnico junior en apoyo a revisión y mantención de calefont',
  3,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12412123-3',
  12
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12412123-3',
  12,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICOS DEMO PINTURA Y JARDINERÍA
-- Contraseña real para técnicos demo: tecnico123

-- TÉCNICO PINTURA: Patricia Lagos Herrera
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
  '12355551-1',
  'Patricia Lagos Herrera',
  '1983-09-12',
  'Femenino',
  'patricia.lagos@fixya.cl',
  '977555511',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  19,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12355551-1',
  'Pintora senior en terminaciones interiores y exteriores',
  11,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12355551-1',
  5
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12355551-1',
  19,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO PINTURA: Diego Contreras Silva
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
  '12355552-2',
  'Diego Contreras Silva',
  '1992-03-24',
  'Masculino',
  'diego.contreras@fixya.cl',
  '977555522',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  20,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12355552-2',
  'Pintor en preparación de superficies y renovación de espacios',
  5,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12355552-2',
  5
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12355552-2',
  20,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO PINTURA: Javiera Pino Morales
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
  '12355553-3',
  'Javiera Pino Morales',
  '1999-08-17',
  'Femenino',
  'javiera.pino@fixya.cl',
  '977555533',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  10,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12355553-3',
  'Pintora junior en trabajos de pintura interior y retoques',
  2,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12355553-3',
  5
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12355553-3',
  10,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO JARDINERÍA: Sebastián Riquelme Soto
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
  '12366661-1',
  'Sebastián Riquelme Soto',
  '1986-01-29',
  'Masculino',
  'sebastian.riquelme@fixya.cl',
  '977666611',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  21,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12366661-1',
  'Jardinero senior en mantención y diseño de áreas verdes',
  9,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12366661-1',
  6
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12366661-1',
  21,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO JARDINERÍA: Marcela Tapia Fuentes
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
  '12366662-2',
  'Marcela Tapia Fuentes',
  '1990-10-05',
  'Femenino',
  'marcela.tapia@fixya.cl',
  '977666622',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  11,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12366662-2',
  'Jardinera en poda, riego y mantención de jardines residenciales',
  6,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12366662-2',
  6
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12366662-2',
  11,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO JARDINERÍA: Cristóbal Vega Muñoz
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
  '12366663-3',
  'Cristóbal Vega Muñoz',
  '1997-12-03',
  'Masculino',
  'cristobal.vega@fixya.cl',
  '977666633',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  8,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12366663-3',
  'Jardinero junior en corte, limpieza y mantención básica de áreas verdes',
  3,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12366663-3',
  6
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12366663-3',
  8,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICOS DEMO CARPINTERÍA Y CERRAJERÍA
-- Contraseña real para técnicos demo: tecnico123

-- TÉCNICO CARPINTERÍA: Luis Cárdenas Molina
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
  '12333331-1',
  'Luis Cárdenas Molina',
  '1982-06-21',
  'Masculino',
  'luis.cardenas@fixya.cl',
  '977333311',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  21,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12333331-1',
  'Carpintero senior en muebles, terminaciones y reparaciones domiciliarias',
  12,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12333331-1',
  3
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12333331-1',
  21,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO CARPINTERÍA: Fernanda Silva Reyes
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
  '12333332-2',
  'Fernanda Silva Reyes',
  '1993-02-14',
  'Femenino',
  'fernanda.silva@fixya.cl',
  '977333322',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  22,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12333332-2',
  'Carpintera en mantención, armado e instalación de estructuras de madera',
  6,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12333332-2',
  3
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12333332-2',
  22,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO CARPINTERÍA: Gabriel Soto Núñez
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
  '12333333-3',
  'Gabriel Soto Núñez',
  '1998-04-08',
  'Masculino',
  'gabriel.soto@fixya.cl',
  '977333333',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  11,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12333333-3',
  'Carpintero junior en reparaciones menores y trabajos de terminación',
  3,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12333333-3',
  3
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12333333-3',
  11,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO CERRAJERÍA: Héctor Paredes Lagos
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
  '12344441-1',
  'Héctor Paredes Lagos',
  '1984-11-19',
  'Masculino',
  'hector.paredes@fixya.cl',
  '977444411',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  19,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12344441-1',
  'Cerrajero senior en apertura, cambio e instalación de cerraduras',
  10,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12344441-1',
  4
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12344441-1',
  19,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO CERRAJERÍA: Claudia Muñoz Peña
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
  '12344442-2',
  'Claudia Muñoz Peña',
  '1991-05-26',
  'Femenino',
  'claudia.munoz@fixya.cl',
  '977444422',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  12,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12344442-2',
  'Cerrajera en mantención, duplicado e instalación de sistemas de seguridad',
  4,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12344442-2',
  4
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12344442-2',
  12,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO CERRAJERÍA: Tomás Espinoza Rojas
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
  '12344443-3',
  'Tomás Espinoza Rojas',
  '1999-07-07',
  'Masculino',
  'tomas.espinoza@fixya.cl',
  '977444433',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  7,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12344443-3',
  'Cerrajero junior en aperturas, cambios de chapa y reparaciones menores',
  2,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12344443-3',
  4
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12344443-3',
  7,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICOS DEMO ADICIONALES
-- Contraseña real para técnicos demo: tecnico123

-- TÉCNICO ELECTRICIDAD: Marcelo Fuentes Rivas
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
  '12311112-2',
  'Marcelo Fuentes Rivas',
  '1990-04-14',
  'Masculino',
  'marcelo.fuentes@fixya.cl',
  '977111112',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  20,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12311112-2',
  'Técnico en instalaciones eléctricas domiciliarias',
  4,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12311112-2',
  1
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12311112-2',
  20,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO ELECTRICIDAD: Andrea Leiva Soto
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
  '12311113-3',
  'Andrea Leiva Soto',
  '1987-08-09',
  'Femenino',
  'andrea.leiva@fixya.cl',
  '977111113',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  21,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12311113-3',
  'Especialista senior en mantención e instalaciones eléctricas',
  8,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12311113-3',
  1
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12311113-3',
  21,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO GASFITERÍA: Rodrigo Salinas Vera
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
  '12322221-1',
  'Rodrigo Salinas Vera',
  '1985-05-27',
  'Masculino',
  'rodrigo.salinas@fixya.cl',
  '977222211',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  19,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12322221-1',
  'Gasfíter senior en reparaciones sanitarias y redes domiciliarias',
  9,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12322221-1',
  2
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12322221-1',
  19,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO GASFITERÍA: Paola Herrera Díaz
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
  '12322222-2',
  'Paola Herrera Díaz',
  '1991-10-03',
  'Femenino',
  'paola.herrera@fixya.cl',
  '977222222',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  20,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12322222-2',
  'Técnica en mantención y reparación de instalaciones de agua',
  5,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12322222-2',
  2
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12322222-2',
  20,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO GASFITERÍA: Nicolás Aravena Pino
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
  '12322223-3',
  'Nicolás Aravena Pino',
  '1998-12-16',
  'Masculino',
  'nicolas.aravena@fixya.cl',
  '977222233',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  10,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12322223-3',
  'Técnico junior en reparaciones de gasfitería domiciliaria',
  2,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12322223-3',
  2
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12322223-3',
  10,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICOS DEMO CLIMATIZACIÓN Y ALBAÑILERÍA
-- Contraseña real para técnicos demo: tecnico123

-- TÉCNICO CLIMATIZACIÓN: Mauricio Herrera Lagos
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
  '12377771-1',
  'Mauricio Herrera Lagos',
  '1984-04-18',
  'Masculino',
  'mauricio.herrera@fixya.cl',
  '977777711',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  10,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12377771-1',
  'Técnico senior en instalación y mantención de climatización',
  10,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12377771-1',
  7
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12377771-1',
  10,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO CLIMATIZACIÓN: Carolina Figueroa Rivas
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
  '12377772-2',
  'Carolina Figueroa Rivas',
  '1991-06-09',
  'Femenino',
  'carolina.figueroa@fixya.cl',
  '977777722',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  11,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12377772-2',
  'Técnica en mantención preventiva de aire acondicionado y calefacción',
  5,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12377772-2',
  7
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12377772-2',
  11,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO CLIMATIZACIÓN: Esteban Mella Castro
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
  '12377773-3',
  'Esteban Mella Castro',
  '1998-11-22',
  'Masculino',
  'esteban.mella@fixya.cl',
  '977777733',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  12,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12377773-3',
  'Técnico junior en apoyo a instalaciones de climatización residencial',
  2,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12377773-3',
  7
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12377773-3',
  12,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO ALBAÑILERÍA: Juan Pablo Medina Soto
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
  '12388881-1',
  'Juan Pablo Medina Soto',
  '1980-08-15',
  'Masculino',
  'juan.medina@fixya.cl',
  '977888811',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  19,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12388881-1',
  'Albañil senior en reparaciones estructurales y construcción menor',
  14,
  'Senior',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12388881-1',
  8
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12388881-1',
  19,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO ALBAÑILERÍA: Roxana Araya Paredes
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
  '12388882-2',
  'Roxana Araya Paredes',
  '1989-02-27',
  'Femenino',
  'roxana.araya@fixya.cl',
  '977888822',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  20,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12388882-2',
  'Albañila en terminaciones, reparaciones y obras menores',
  7,
  'Intermedio',
  true
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12388882-2',
  8
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12388882-2',
  20,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;

-- TÉCNICO ALBAÑILERÍA: Pedro Castillo Rojas
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
  '12388883-3',
  'Pedro Castillo Rojas',
  '1997-07-30',
  'Masculino',
  'pedro.castillo@fixya.cl',
  '977888833',
  '$2y$12$7MKIL5rQJ8sekD8SZrfQZ.zNnxsVRjkswP0G49986PzfB9dZl9CfG',
  true,
  22,
  'TECNICO'
)
ON CONFLICT (rut) DO UPDATE SET
  correo = EXCLUDED.correo,
  contrasena = EXCLUDED.contrasena,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_usuario = EXCLUDED.estado_usuario,
  comuna_id_comuna = EXCLUDED.comuna_id_comuna;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado
)
VALUES (
  '12388883-3',
  'Albañil junior en apoyo a reparaciones y construcción menor',
  3,
  'Junior',
  false
)
ON CONFLICT (usuario_rut) DO UPDATE SET
  descripcion_perfil = EXCLUDED.descripcion_perfil,
  experiencia_anios = EXCLUDED.experiencia_anios,
  nivel_tecnico = EXCLUDED.nivel_tecnico,
  tecnico_verificado = EXCLUDED.tecnico_verificado;

INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES (
  '12388883-3',
  8
)
ON CONFLICT (tecnico_usuario_rut, servicio_id_servicio) DO NOTHING;

INSERT INTO tecnico_comuna (
  tecnico_usuario_rut,
  comuna_id_comuna,
  estado_cobertura
)
VALUES (
  '12388883-3',
  22,
  true
)
ON CONFLICT (tecnico_usuario_rut, comuna_id_comuna) DO UPDATE SET
  estado_cobertura = EXCLUDED.estado_cobertura;
