-- Indica si el monto de la cotización incluye o no los materiales.
-- El PDF de referencia muestra esta condición explícitamente. Idempotente.

ALTER TABLE cotizacion
    ADD COLUMN IF NOT EXISTS materiales_incluidos BOOLEAN NOT NULL DEFAULT FALSE;
