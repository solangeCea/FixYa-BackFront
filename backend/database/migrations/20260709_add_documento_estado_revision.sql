-- Estado de revisión por documento técnico (PENDIENTE/APROBADO/RECHAZADO) y
-- motivo de rechazo. Antes solo existía el booleano documento_aprobado, que no
-- permitía distinguir "pendiente" de "rechazado" ni conservar el motivo.
-- Idempotente: se puede correr en cada arranque sin efectos secundarios.

ALTER TABLE documento_tecnico
    ADD COLUMN IF NOT EXISTS estado_documento VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE';

ALTER TABLE documento_tecnico
    ADD COLUMN IF NOT EXISTS motivo_rechazo VARCHAR(500);

-- Backfill: los documentos ya aprobados pasan a 'APROBADO'; el resto queda en
-- 'PENDIENTE' (el default). Solo corrige filas que aún tengan el valor por defecto
-- para no pisar estados fijados manualmente en corridas posteriores.
UPDATE documento_tecnico
   SET estado_documento = 'APROBADO'
 WHERE documento_aprobado = TRUE
   AND estado_documento = 'PENDIENTE';
