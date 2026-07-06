-- Análisis de IA para reseñas: moderación + clasificación (categorías,
-- sentimiento y resumen/etiqueta). Idempotente: se puede correr en cada arranque.
ALTER TABLE resena ADD COLUMN IF NOT EXISTS categorias VARCHAR(300);
ALTER TABLE resena ADD COLUMN IF NOT EXISTS sentimiento VARCHAR(20);
ALTER TABLE resena ADD COLUMN IF NOT EXISTS resumen_ia VARCHAR(300);
ALTER TABLE resena ADD COLUMN IF NOT EXISTS analisis_modo VARCHAR(30);
