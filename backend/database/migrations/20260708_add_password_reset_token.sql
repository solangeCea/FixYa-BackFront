-- Token de un solo uso para recuperación de contraseña. Idempotente.
CREATE TABLE IF NOT EXISTS password_reset_token (
    id SERIAL PRIMARY KEY,
    usuario_rut VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expira_en TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_password_reset_token_hash ON password_reset_token (token_hash);
