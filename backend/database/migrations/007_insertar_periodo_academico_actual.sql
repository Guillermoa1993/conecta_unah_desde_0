-- ============================================================
--  Parámetro: período académico activo (para validar Forma 003)
-- ============================================================

INSERT INTO tabla_grupo_1_parametros (nombre, valor)
SELECT 'PERIODO_ACADEMICO_ACTUAL', 'II PAC 2026'
WHERE NOT EXISTS (
  SELECT 1 FROM tabla_grupo_1_parametros WHERE nombre = 'PERIODO_ACADEMICO_ACTUAL'
);