-- ============================================================
--  Agrega columnas de geolocalización que el código ya esperaba
--  pero que nunca se migraron a la base de datos real.
-- ============================================================

ALTER TABLE tabla_grupo_3_eventos
  ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION;
ALTER TABLE tabla_grupo_3_eventos
  ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION;

ALTER TABLE tabla_grupo_2_inscripciones_evento
  ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION;
ALTER TABLE tabla_grupo_2_inscripciones_evento
  ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION;
ALTER TABLE tabla_grupo_2_inscripciones_evento
  ADD COLUMN IF NOT EXISTS estado_verificacion VARCHAR(30);