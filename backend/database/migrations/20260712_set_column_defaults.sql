-- Fija el DEFAULT a nivel de BD en columnas NOT NULL agregadas en migraciones
-- previas. Necesario porque create_all() crea la columna sin server default
-- (el default del modelo es solo de Python), por lo que los INSERT crudos del
-- seed en una base ya creada violaban NOT NULL. Idempotente: SET DEFAULT se
-- puede correr en cada arranque sin efectos secundarios.

ALTER TABLE documento_tecnico ALTER COLUMN estado_documento SET DEFAULT 'PENDIENTE';
ALTER TABLE cotizacion       ALTER COLUMN materiales_incluidos SET DEFAULT false;
ALTER TABLE chat             ALTER COLUMN activo SET DEFAULT true;
ALTER TABLE mensaje_chat     ALTER COLUMN leido SET DEFAULT false;
ALTER TABLE mensaje_chat     ALTER COLUMN es_sistema SET DEFAULT false;
