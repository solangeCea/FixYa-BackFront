-- Fase D — Gestión de conflictos y cancelación con revisión admin. Idempotente.

CREATE TABLE IF NOT EXISTS conflicto_solicitud (
    id_conflicto           SERIAL PRIMARY KEY,
    solicitud_id_solicitud INTEGER NOT NULL REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
    reportante_rut         VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    reportante_rol         VARCHAR(10) NOT NULL,
    tipo                   VARCHAR(40) NOT NULL,
    descripcion            VARCHAR(1000) NOT NULL,
    estado                 VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE',
    fecha_reporte          TIMESTAMP NOT NULL DEFAULT now(),
    fecha_revision         TIMESTAMP,
    admin_rut_resuelve     VARCHAR(12) REFERENCES usuario(rut),
    observacion_admin      VARCHAR(1000)
);

CREATE INDEX IF NOT EXISTS ix_conflicto_solicitud_solicitud ON conflicto_solicitud (solicitud_id_solicitud);
CREATE INDEX IF NOT EXISTS ix_conflicto_solicitud_reportante ON conflicto_solicitud (reportante_rut);
CREATE INDEX IF NOT EXISTS ix_conflicto_solicitud_estado ON conflicto_solicitud (estado);

CREATE TABLE IF NOT EXISTS conflicto_evidencia (
    id_evidencia   SERIAL PRIMARY KEY,
    conflicto_id   INTEGER NOT NULL REFERENCES conflicto_solicitud(id_conflicto) ON DELETE CASCADE,
    nombre_archivo VARCHAR(200) NOT NULL,
    archivo_url    VARCHAR(300) NOT NULL,
    fecha_subida   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_conflicto_evidencia_conflicto ON conflicto_evidencia (conflicto_id);

CREATE TABLE IF NOT EXISTS cancelacion_solicitud (
    id_cancelacion         SERIAL PRIMARY KEY,
    solicitud_id_solicitud INTEGER NOT NULL REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
    solicitante_rut        VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    solicitante_rol        VARCHAR(10) NOT NULL,
    motivo                 VARCHAR(1000) NOT NULL,
    estado                 VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE',
    estado_previo          VARCHAR(20),
    fecha_solicitud        TIMESTAMP NOT NULL DEFAULT now(),
    fecha_resolucion       TIMESTAMP,
    admin_rut_resuelve     VARCHAR(12) REFERENCES usuario(rut),
    observacion_admin      VARCHAR(1000)
);

CREATE INDEX IF NOT EXISTS ix_cancelacion_solicitud_solicitud ON cancelacion_solicitud (solicitud_id_solicitud);
CREATE INDEX IF NOT EXISTS ix_cancelacion_solicitud_estado ON cancelacion_solicitud (estado);
