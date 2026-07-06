CREATE TABLE IF NOT EXISTS usuario_rol (
  usuario_rut VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
  rol VARCHAR(20) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_rut, rol)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_usuario_rol_rol'
      AND conrelid = 'usuario_rol'::regclass
  ) THEN
    ALTER TABLE usuario_rol
    ADD CONSTRAINT chk_usuario_rol_rol CHECK (
      rol IN ('CLIENTE', 'TECNICO', 'ADMIN')
    );
  END IF;
END $$;

INSERT INTO usuario_rol (usuario_rut, rol, activo)
SELECT rut, tipo_usuario::text, TRUE
FROM usuario
ON CONFLICT (usuario_rut, rol) DO NOTHING;

INSERT INTO usuario_rol (usuario_rut, rol, activo)
SELECT usuario_rut, 'TECNICO', TRUE
FROM tecnico
ON CONFLICT (usuario_rut, rol) DO NOTHING;

ALTER TABLE tecnico
ADD COLUMN IF NOT EXISTS estado_verificacion VARCHAR(20),
ADD COLUMN IF NOT EXISTS fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_revision TIMESTAMP,
ADD COLUMN IF NOT EXISTS observacion_admin VARCHAR(1000),
ADD COLUMN IF NOT EXISTS admin_revisor_rut VARCHAR(12);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_tecnico_admin_revisor'
      AND conrelid = 'tecnico'::regclass
  ) THEN
    ALTER TABLE tecnico
    ADD CONSTRAINT fk_tecnico_admin_revisor
    FOREIGN KEY (admin_revisor_rut) REFERENCES usuario(rut);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_tecnico_estado_verificacion'
      AND conrelid = 'tecnico'::regclass
  ) THEN
    ALTER TABLE tecnico
    ADD CONSTRAINT chk_tecnico_estado_verificacion CHECK (
      estado_verificacion IN (
        'PENDIENTE',
        'EN_REVISION',
        'OBSERVADO',
        'APROBADO',
        'RECHAZADO',
        'SUSPENDIDO'
      )
    );
  END IF;
END $$;

UPDATE tecnico
SET estado_verificacion = CASE
  WHEN tecnico_verificado = TRUE THEN 'APROBADO'
  ELSE 'PENDIENTE'
END
WHERE estado_verificacion IS NULL;

ALTER TABLE tecnico
ALTER COLUMN estado_verificacion SET DEFAULT 'PENDIENTE',
ALTER COLUMN estado_verificacion SET NOT NULL;

INSERT INTO tecnico (
  usuario_rut,
  descripcion_perfil,
  experiencia_anios,
  nivel_tecnico,
  tecnico_verificado,
  estado_verificacion
)
SELECT
  ur.usuario_rut,
  'Perfil tecnico pendiente de completar',
  0,
  'Basico',
  FALSE,
  'PENDIENTE'
FROM usuario_rol ur
LEFT JOIN tecnico t ON t.usuario_rut = ur.usuario_rut
WHERE ur.rol = 'TECNICO'
  AND t.usuario_rut IS NULL;

CREATE INDEX IF NOT EXISTS ix_usuario_rol_usuario
ON usuario_rol (usuario_rut);

CREATE INDEX IF NOT EXISTS ix_usuario_rol_rol
ON usuario_rol (rol);

CREATE INDEX IF NOT EXISTS ix_tecnico_estado_verificacion
ON tecnico (estado_verificacion);
