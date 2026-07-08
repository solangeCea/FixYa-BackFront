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


-- =============================================================================
-- USUARIOS DE DEMOSTRACION (dataset limpio, sin documentos sembrados)
-- 2 admins - 16 tecnicos (2 por servicio, verificados) - 4 clientes
-- Contrasenas: Admin1234 / Tecnico1234 / Cliente1234
-- =============================================================================

INSERT INTO usuario (rut, nombre_completo, fecha_nacimiento, genero, correo, telefono, contrasena, estado_usuario, comuna_id_comuna, tipo_usuario) VALUES
  ('21000101-8', 'Vanesa Gonzalez Navarro', '1992-05-12', 'Femenino', 'vanesa.gonzalez@fixya.cl', '990010101', '$2b$12$94VenAWUJmuR2tUZpU4UzeCEzqLDEm2t.m99LbRsK1Hq92kiqf.p2', true, 1, 'ADMIN'),
  ('21000202-2', 'Daniel Orellana Soto', '1988-09-03', 'Masculino', 'daniel.orellana@fixya.cl', '990010202', '$2b$12$94VenAWUJmuR2tUZpU4UzeCEzqLDEm2t.m99LbRsK1Hq92kiqf.p2', true, 1, 'ADMIN')
ON CONFLICT (rut) DO NOTHING;

INSERT INTO usuario (rut, nombre_completo, fecha_nacimiento, genero, correo, telefono, contrasena, estado_usuario, comuna_id_comuna, tipo_usuario) VALUES
  ('22010011-1', 'Matias Fuentes Morales', '1989-07-22', 'Masculino', 'matias.fuentes@fixya.cl', '961000011', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 12, 'TECNICO'),
  ('22010022-7', 'Antonia Salas Espinoza', '1990-08-17', 'Femenino', 'antonia.salas@fixya.cl', '961000022', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 13, 'TECNICO'),
  ('22020011-6', 'Sofia Contreras Rojas', '1991-03-14', 'Femenino', 'sofia.contreras@fixya.cl', '962000011', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 11, 'TECNICO'),
  ('22020022-1', 'Rodrigo Pizarro Leon', '1986-02-09', 'Masculino', 'rodrigo.pizarro@fixya.cl', '962000022', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 10, 'TECNICO'),
  ('22030011-0', 'Francisca Munoz Tapia', '1985-09-30', 'Femenino', 'francisca.munoz@fixya.cl', '963000011', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 5, 'TECNICO'),
  ('22030022-6', 'Tomas Reyes Alarcon', '1994-04-18', 'Masculino', 'tomas.reyes@fixya.cl', '963000022', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 6, 'TECNICO'),
  ('22040011-5', 'Sebastian Navarro Fuentealba', '1982-12-11', 'Masculino', 'sebastian.navarro@fixya.cl', '964000011', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 7, 'TECNICO'),
  ('22040022-0', 'Daniela Vergara Rojas', '1993-06-27', 'Femenino', 'daniela.vergara@fixya.cl', '964000022', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 9, 'TECNICO'),
  ('22050011-K', 'Camila Herrera Nunez', '1994-11-02', 'Femenino', 'camila.herrera@fixya.cl', '965000011', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 8, 'TECNICO'),
  ('22050022-5', 'Cristobal Bravo Miranda', '1993-05-05', 'Masculino', 'cristobal.bravo@fixya.cl', '965000022', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 16, 'TECNICO'),
  ('22060011-4', 'Diego Vera Sanhueza', '1996-01-19', 'Masculino', 'diego.vera@fixya.cl', '966000011', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 19, 'TECNICO'),
  ('22060022-K', 'Paula Cortes Marin', '1991-10-08', 'Femenino', 'paula.cortes@fixya.cl', '966000022', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 20, 'TECNICO'),
  ('22070011-9', 'Ignacio Riquelme Soto', '1990-04-08', 'Masculino', 'ignacio.riquelme@fixya.cl', '967000011', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 23, 'TECNICO'),
  ('22070022-4', 'Marcelo Aravena Diaz', '1987-01-23', 'Masculino', 'marcelo.aravena@fixya.cl', '967000022', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 7, 'TECNICO'),
  ('22080011-3', 'Valentina Caceres Pino', '1995-06-25', 'Femenino', 'valentina.caceres@fixya.cl', '968000011', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 14, 'TECNICO'),
  ('22080022-9', 'Felipe Munoz Carrasco', '1992-03-30', 'Masculino', 'felipe.munoz@fixya.cl', '968000022', '$2b$12$rsE37Xd/mnnUo90izBlqw.JbfP.Li1GIFSd52AlTRhTXkBO3FX1C2', true, 11, 'TECNICO')
ON CONFLICT (rut) DO NOTHING;

INSERT INTO usuario (rut, nombre_completo, fecha_nacimiento, genero, correo, telefono, contrasena, estado_usuario, comuna_id_comuna, tipo_usuario) VALUES
  ('23000011-5', 'Josefa Reyes Vidal', '1995-02-14', 'Femenino', 'josefa.reyes@gmail.com', '970000011', '$2b$12$uBFuxbAZg/kPdeFh8Y2eZ./RKwrxnG9SEjcvvx5fOKA80.JkP36VW', true, 10, 'CLIENTE'),
  ('23000022-0', 'Catalina Figueroa Rojas', '1990-07-19', 'Femenino', 'catalina.figueroa@gmail.com', '970000022', '$2b$12$uBFuxbAZg/kPdeFh8Y2eZ./RKwrxnG9SEjcvvx5fOKA80.JkP36VW', true, 12, 'CLIENTE'),
  ('23000033-6', 'Andres Soto Lagos', '1988-11-05', 'Masculino', 'andres.soto@gmail.com', '970000033', '$2b$12$uBFuxbAZg/kPdeFh8Y2eZ./RKwrxnG9SEjcvvx5fOKA80.JkP36VW', true, 8, 'CLIENTE'),
  ('23000044-1', 'Martin Espinoza Ruiz', '1993-09-21', 'Masculino', 'martin.espinoza@gmail.com', '970000044', '$2b$12$uBFuxbAZg/kPdeFh8Y2eZ./RKwrxnG9SEjcvvx5fOKA80.JkP36VW', true, 5, 'CLIENTE')
ON CONFLICT (rut) DO NOTHING;

INSERT INTO usuario_rol (usuario_rut, rol, activo) VALUES
  ('21000101-8', 'ADMIN', true),
  ('21000202-2', 'ADMIN', true),
  ('22010011-1', 'TECNICO', true),
  ('22010022-7', 'TECNICO', true),
  ('22020011-6', 'TECNICO', true),
  ('22020022-1', 'TECNICO', true),
  ('22030011-0', 'TECNICO', true),
  ('22030022-6', 'TECNICO', true),
  ('22040011-5', 'TECNICO', true),
  ('22040022-0', 'TECNICO', true),
  ('22050011-K', 'TECNICO', true),
  ('22050022-5', 'TECNICO', true),
  ('22060011-4', 'TECNICO', true),
  ('22060022-K', 'TECNICO', true),
  ('22070011-9', 'TECNICO', true),
  ('22070022-4', 'TECNICO', true),
  ('22080011-3', 'TECNICO', true),
  ('22080022-9', 'TECNICO', true),
  ('23000011-5', 'CLIENTE', true),
  ('23000022-0', 'CLIENTE', true),
  ('23000033-6', 'CLIENTE', true),
  ('23000044-1', 'CLIENTE', true)
ON CONFLICT DO NOTHING;

INSERT INTO tecnico (usuario_rut, descripcion_perfil, experiencia_anios, nivel_tecnico, tecnico_verificado, estado_verificacion) VALUES
  ('22010011-1', 'Electricista con certificacion SEC, instalaciones domiciliarias y tableros electricos.', 12, 'Avanzado', true, 'APROBADO'),
  ('22010022-7', 'Tecnica electrica orientada a mantencion integral del hogar y locales comerciales.', 9, 'Avanzado', true, 'APROBADO'),
  ('22020011-6', 'Gasfiter certificada en deteccion de filtraciones y redes de agua potable.', 8, 'Avanzado', true, 'APROBADO'),
  ('22020022-1', 'Gasfiter en instalacion y reparacion de artefactos sanitarios y calefont.', 11, 'Avanzado', true, 'APROBADO'),
  ('22030011-0', 'Maestra carpintera de muebles a medida, terminaciones y estructuras de madera.', 15, 'Avanzado', true, 'APROBADO'),
  ('22030022-6', 'Carpintero en revestimientos, puertas, ventanas y reparaciones de madera.', 6, 'Intermedio', true, 'APROBADO'),
  ('22040011-5', 'Cerrajero de urgencias: apertura, cambio de cerraduras y sistemas de seguridad.', 18, 'Avanzado', true, 'APROBADO'),
  ('22040022-0', 'Cerrajera en instalacion de cerraduras de seguridad y control de acceso.', 7, 'Intermedio', true, 'APROBADO'),
  ('22050011-K', 'Especialista en techumbres: reparacion de goteras, cambio de planchas y hojalateria.', 5, 'Intermedio', true, 'APROBADO'),
  ('22050022-5', 'Tecnico en techumbres y cubiertas para viviendas y locales comerciales.', 6, 'Intermedio', true, 'APROBADO'),
  ('22060011-4', 'Pintor profesional de interiores y exteriores, esmalte al agua y tratamiento de humedad.', 4, 'Intermedio', true, 'APROBADO'),
  ('22060022-K', 'Pintora en terminaciones finas, estuco y recuperacion de muros.', 8, 'Avanzado', true, 'APROBADO'),
  ('22070011-9', 'Albanil en construccion de muros, radieres y reparaciones de obra gruesa.', 10, 'Avanzado', true, 'APROBADO'),
  ('22070022-4', 'Albanil en estucos, enchapes y ampliaciones menores.', 13, 'Avanzado', true, 'APROBADO'),
  ('22080011-3', 'Jardinera en mantencion de areas verdes, poda y diseno de jardines.', 6, 'Intermedio', true, 'APROBADO'),
  ('22080022-9', 'Jardinero en riego automatico, cesped y control de plagas de jardin.', 7, 'Intermedio', true, 'APROBADO')
ON CONFLICT (usuario_rut) DO NOTHING;

INSERT INTO tecnico_servicio (tecnico_usuario_rut, servicio_id_servicio) VALUES
  ('22010011-1', 1),
  ('22010022-7', 1),
  ('22020011-6', 2),
  ('22020022-1', 2),
  ('22030011-0', 3),
  ('22030022-6', 3),
  ('22040011-5', 4),
  ('22040022-0', 4),
  ('22050011-K', 5),
  ('22050022-5', 5),
  ('22060011-4', 6),
  ('22060022-K', 6),
  ('22070011-9', 7),
  ('22070022-4', 7),
  ('22080011-3', 8),
  ('22080022-9', 8)
ON CONFLICT DO NOTHING;

INSERT INTO tecnico_comuna (tecnico_usuario_rut, comuna_id_comuna, estado_cobertura) VALUES
  ('22010011-1', 12, true),
  ('22010022-7', 13, true),
  ('22020011-6', 11, true),
  ('22020022-1', 10, true),
  ('22030011-0', 5, true),
  ('22030022-6', 6, true),
  ('22040011-5', 7, true),
  ('22040022-0', 9, true),
  ('22050011-K', 8, true),
  ('22050022-5', 16, true),
  ('22060011-4', 19, true),
  ('22060022-K', 20, true),
  ('22070011-9', 23, true),
  ('22070022-4', 7, true),
  ('22080011-3', 14, true),
  ('22080022-9', 11, true)
ON CONFLICT DO NOTHING;

