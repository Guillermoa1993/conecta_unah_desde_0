-- ============================================================
--  Reacciones a comentarios (publicaciones y eventos)
--  Nota: esta tabla es de Grupo_2 (nuestra), aunque referencia
--  tabla_grupo_1_comentario y tabla_grupo_1_usuario, que sí
--  pertenecen a Grupo_1 y ya existen en la base de datos.
-- ============================================================

CREATE TABLE IF NOT EXISTS tabla_grupo_2_reaccion_comentario (
  id_reaccion SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  id_comentario INT NOT NULL REFERENCES tabla_grupo_1_comentario(id_comentario) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('love', 'like', 'dislike', 'haha', 'wow', 'sad', 'angry')),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (id_usuario, id_comentario)
);

CREATE INDEX IF NOT EXISTS idx_reaccion_comentario_comentario
  ON tabla_grupo_2_reaccion_comentario (id_comentario);