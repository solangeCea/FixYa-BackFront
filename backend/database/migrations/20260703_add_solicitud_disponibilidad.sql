CREATE TABLE IF NOT EXISTS solicitud_disponibilidad (
  id_disponibilidad SERIAL PRIMARY KEY,
  solicitud_id_solicitud INTEGER NOT NULL REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
  dia VARCHAR(12) NOT NULL,
  hora_inicio VARCHAR(5) NOT NULL,
  hora_fin VARCHAR(5) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_solicitud_disponibilidad_dia'
      AND conrelid = 'solicitud_disponibilidad'::regclass
  ) THEN
    ALTER TABLE solicitud_disponibilidad
    ADD CONSTRAINT uq_solicitud_disponibilidad_dia UNIQUE (solicitud_id_solicitud, dia);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_solicitud_disponibilidad_dia'
      AND conrelid = 'solicitud_disponibilidad'::regclass
  ) THEN
    ALTER TABLE solicitud_disponibilidad
    ADD CONSTRAINT chk_solicitud_disponibilidad_dia CHECK (
      dia IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_solicitud_disponibilidad_hora_inicio'
      AND conrelid = 'solicitud_disponibilidad'::regclass
  ) THEN
    ALTER TABLE solicitud_disponibilidad
    ADD CONSTRAINT chk_solicitud_disponibilidad_hora_inicio CHECK (
      hora_inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_solicitud_disponibilidad_hora_fin'
      AND conrelid = 'solicitud_disponibilidad'::regclass
  ) THEN
    ALTER TABLE solicitud_disponibilidad
    ADD CONSTRAINT chk_solicitud_disponibilidad_hora_fin CHECK (
      hora_fin ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_solicitud_disponibilidad_rango'
      AND conrelid = 'solicitud_disponibilidad'::regclass
  ) THEN
    ALTER TABLE solicitud_disponibilidad
    ADD CONSTRAINT chk_solicitud_disponibilidad_rango CHECK (hora_fin > hora_inicio);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_solicitud_disponibilidad_solicitud
ON solicitud_disponibilidad (solicitud_id_solicitud);
