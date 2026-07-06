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
(4, 'Cerrajería', 'Servicios de cerraduras', true)
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

-- ROLES BASE
INSERT INTO usuario_rol (usuario_rut, rol, activo)
VALUES
  ('11111111-1', 'ADMIN', true),
  ('12345678-5', 'CLIENTE', true),
  ('87654321-4', 'TECNICO', true)
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

-- SERVICIOS DEL TECNICO PRUEBA
INSERT INTO tecnico_servicio (
  tecnico_usuario_rut,
  servicio_id_servicio
)
VALUES
  ('87654321-4', 1),
  ('87654321-4', 2),
  ('87654321-4', 3),
  ('87654321-4', 4)
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
    9001,
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
    9002,
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
  (9001, 'LUNES', '19:00', '22:00'),
  (9001, 'MIERCOLES', '15:00', '19:00'),
  (9002, 'MARTES', '18:00', '21:00'),
  (9002, 'JUEVES', '19:00', '22:00')
ON CONFLICT (solicitud_id_solicitud, dia) DO UPDATE SET
  hora_inicio = EXCLUDED.hora_inicio,
  hora_fin = EXCLUDED.hora_fin;

SELECT setval(
  pg_get_serial_sequence('solicitud', 'id_solicitud'),
  GREATEST((SELECT MAX(id_solicitud) FROM solicitud), 1)
);
