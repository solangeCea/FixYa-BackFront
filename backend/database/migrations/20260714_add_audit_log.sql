-- Fase B — Audit Log: registro de auditoría de acciones administrativas.
-- Idempotente (CREATE TABLE / INDEX IF NOT EXISTS) para poder re-aplicarse en
-- despliegues sucesivos sin fallar.
CREATE TABLE IF NOT EXISTS audit_log (
    id_audit             SERIAL PRIMARY KEY,
    admin_rut            VARCHAR(12) REFERENCES usuario(rut) ON DELETE SET NULL,
    admin_correo         VARCHAR(150),
    accion               VARCHAR(50)  NOT NULL,
    entidad_tipo         VARCHAR(30)  NOT NULL,
    entidad_id           VARCHAR(50),
    usuario_afectado_rut VARCHAR(12),
    motivo               VARCHAR(1000),
    estado_antes         VARCHAR(50),
    estado_despues       VARCHAR(50),
    detalle              VARCHAR(1000),
    ip                   VARCHAR(64),
    fecha                TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_audit_log_admin_rut ON audit_log (admin_rut);
CREATE INDEX IF NOT EXISTS ix_audit_log_accion ON audit_log (accion);
CREATE INDEX IF NOT EXISTS ix_audit_log_entidad_tipo ON audit_log (entidad_tipo);
CREATE INDEX IF NOT EXISTS ix_audit_log_usuario_afectado_rut ON audit_log (usuario_afectado_rut);
CREATE INDEX IF NOT EXISTS ix_audit_log_fecha ON audit_log (fecha);
