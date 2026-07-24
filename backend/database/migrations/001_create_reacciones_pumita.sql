-- ============================================================
--  Reacciones/Zumbidos Pumita + notificaciones enriquecidas
-- ============================================================

ALTER TABLE tabla_grupo_1_usuario
  ADD COLUMN IF NOT EXISTS permite_reacciones_perfil BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE tabla_grupo_1_notificaciones
  ADD COLUMN IF NOT EXISTS leida BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS id_emisor INT REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referencia_tipo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS referencia_id INT;

CREATE TABLE IF NOT EXISTS tabla_grupo_1_reacciones_pumita (
  id_reaccion SERIAL PRIMARY KEY,
  id_emisor INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  id_receptor INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('APOYO', 'FELICITACION', 'SALUDO', 'RUGIDO_PUMA')),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reacciones_pumita_receptor_fecha
  ON tabla_grupo_1_reacciones_pumita (id_receptor, fecha_creacion DESC);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_fecha
  ON tabla_grupo_1_notificaciones (id_usuario, fecha_creacion DESC);

INSERT INTO tabla_grupo_1_tipo_notificacion (nombre)
SELECT 'REACCION_PUMITA'
WHERE NOT EXISTS (
  SELECT 1 FROM tabla_grupo_1_tipo_notificacion WHERE nombre = 'REACCION_PUMITA'
);