-- ============================================================
--  Flujo de aprobación de publicaciones (2 decisiones reales):
--
--  1) Estudiante crea la publicación         -> estado 'pendiente'
--  2) Coordinación la revisa:
--       - si no es válida -> 'rechazado' (fin del flujo)
--       - si es válida, la remite a VOAE -> 'en_revision_voae'
--  3) VOAE decide (es la máxima autoridad):
--       - aprueba -> 'aprobado_voae'
--       - rechaza -> 'rechazado'
--  4) Coordinación publica lo aprobado por VOAE (clic "Aceptar")
--                                             -> 'publicado' (visible en el feed)
--
--  IMPORTANTE: la tabla real de publicaciones en esta base de datos
--  es "tabla_grupo_2_publicaciones" (ver migración 006), no
--  "tabla_grupo_1_publicacion" como traía el paquete original.
-- ============================================================

ALTER TABLE tabla_grupo_2_publicaciones
  ADD COLUMN IF NOT EXISTS estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_revision_voae', 'aprobado_voae', 'publicado', 'rechazado'));

ALTER TABLE tabla_grupo_2_publicaciones
  ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;

ALTER TABLE tabla_grupo_2_publicaciones
  ADD COLUMN IF NOT EXISTS revisado_por_coordinacion INT REFERENCES tabla_grupo_1_usuario(id_usuario);

ALTER TABLE tabla_grupo_2_publicaciones
  ADD COLUMN IF NOT EXISTS revisado_por_voae INT REFERENCES tabla_grupo_1_usuario(id_usuario);

ALTER TABLE tabla_grupo_2_publicaciones
  ADD COLUMN IF NOT EXISTS rechazado_por INT REFERENCES tabla_grupo_1_usuario(id_usuario);

ALTER TABLE tabla_grupo_2_publicaciones
  ADD COLUMN IF NOT EXISTS fecha_revision TIMESTAMP;

-- Las publicaciones que ya existían antes de este flujo se consideran
-- ya publicadas, para que no desaparezcan del feed general.
UPDATE tabla_grupo_2_publicaciones SET estado = 'publicado' WHERE estado = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_publicacion_estado ON tabla_grupo_2_publicaciones (estado);

INSERT INTO tabla_grupo_1_rol (nombre) VALUES ('COORDINACION') ON CONFLICT DO NOTHING;

INSERT INTO tabla_grupo_1_tipo_notificacion (nombre) VALUES
  ('PUBLICACION_PUBLICADA'), ('PUBLICACION_RECHAZADA')
ON CONFLICT DO NOTHING;