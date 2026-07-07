-- Campos para el comprobante profesional de trabajo finalizado. Idempotente.
ALTER TABLE solicitud ADD COLUMN IF NOT EXISTS costo_materiales NUMERIC(10, 2);
ALTER TABLE solicitud ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50);
ALTER TABLE solicitud ADD COLUMN IF NOT EXISTS garantia VARCHAR(300);
ALTER TABLE solicitud ADD COLUMN IF NOT EXISTS observaciones_finales VARCHAR(1000);
ALTER TABLE solicitud ADD COLUMN IF NOT EXISTS comprobante_codigo VARCHAR(40);
ALTER TABLE solicitud ADD COLUMN IF NOT EXISTS archivo_comprobante_url VARCHAR(300);
