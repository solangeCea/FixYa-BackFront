-- Flujo de "cambio de alcance": una cotización aceptada puede anularse porque el
-- trabajo real resultó mucho mayor, y se genera una nueva cotización vinculada.
-- Idempotente.

-- Vínculo de la nueva cotización con la cotización original (trazabilidad).
ALTER TABLE cotizacion
    ADD COLUMN IF NOT EXISTS cotizacion_origen_id INTEGER REFERENCES cotizacion(id_cotizacion);

-- Plazo estimado del trabajo (texto libre), usado en el PDF y el cambio de alcance.
ALTER TABLE cotizacion
    ADD COLUMN IF NOT EXISTS plazo_estimado VARCHAR(150);

-- Marca de mensaje automático del sistema dentro del chat (avisos del flujo).
ALTER TABLE mensaje_chat
    ADD COLUMN IF NOT EXISTS es_sistema BOOLEAN NOT NULL DEFAULT FALSE;

-- El estado 'ANULADA_CAMBIO_ALCANCE' no cabe en varchar(20): se amplía la columna.
ALTER TABLE cotizacion
    ALTER COLUMN estado_cotizacion TYPE VARCHAR(30);
