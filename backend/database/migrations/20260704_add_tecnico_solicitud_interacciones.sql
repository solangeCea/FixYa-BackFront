CREATE TABLE IF NOT EXISTS tecnico_solicitud_descartada (
  id_descarte SERIAL PRIMARY KEY,
  solicitud_id_solicitud INTEGER NOT NULL REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
  tecnico_usuario_rut VARCHAR(12) NOT NULL REFERENCES tecnico(usuario_rut) ON DELETE CASCADE,
  fecha_descarte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_tecnico_solicitud_descartada'
      AND conrelid = 'tecnico_solicitud_descartada'::regclass
  ) THEN
    ALTER TABLE tecnico_solicitud_descartada
    ADD CONSTRAINT uq_tecnico_solicitud_descartada
    UNIQUE (solicitud_id_solicitud, tecnico_usuario_rut);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_tecnico_solicitud_descartada_solicitud
ON tecnico_solicitud_descartada (solicitud_id_solicitud);

CREATE INDEX IF NOT EXISTS ix_tecnico_solicitud_descartada_tecnico
ON tecnico_solicitud_descartada (tecnico_usuario_rut);

CREATE TABLE IF NOT EXISTS reporte_solicitud (
  id_reporte SERIAL PRIMARY KEY,
  solicitud_id_solicitud INTEGER NOT NULL REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
  tecnico_usuario_rut VARCHAR(12) NOT NULL REFERENCES tecnico(usuario_rut) ON DELETE CASCADE,
  motivo VARCHAR(150) NOT NULL,
  comentario VARCHAR(1000),
  estado_reporte VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  fecha_reporte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_revision TIMESTAMP,
  admin_rut_resuelve VARCHAR(12) REFERENCES usuario(rut),
  observacion_admin VARCHAR(1000)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_reporte_solicitud_tecnico'
      AND conrelid = 'reporte_solicitud'::regclass
  ) THEN
    ALTER TABLE reporte_solicitud
    ADD CONSTRAINT uq_reporte_solicitud_tecnico
    UNIQUE (solicitud_id_solicitud, tecnico_usuario_rut);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_reporte_solicitud_estado'
      AND conrelid = 'reporte_solicitud'::regclass
  ) THEN
    ALTER TABLE reporte_solicitud
    ADD CONSTRAINT chk_reporte_solicitud_estado CHECK (
      estado_reporte IN ('PENDIENTE', 'EN_REVISION', 'DESCARTADO', 'CONFIRMADO')
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_reporte_solicitud_solicitud
ON reporte_solicitud (solicitud_id_solicitud);

CREATE INDEX IF NOT EXISTS ix_reporte_solicitud_tecnico
ON reporte_solicitud (tecnico_usuario_rut);

CREATE INDEX IF NOT EXISTS ix_reporte_solicitud_estado
ON reporte_solicitud (estado_reporte);
