-- ============================================================
--  Ajustes a tablas de Grupo_2 para el feed (publicaciones,
--  comentarios y reacciones a posts). Estas tablas ya existian
--  vacias (0 filas), por eso es seguro renombrar/agregar columnas.
-- ============================================================

-- tabla_grupo_2_publicaciones
--   - "contenido" pasa a llamarse "descripcion" (el codigo espera "descripcion")
--   - se agregan: titulo, categoria, tags, imagen_url, fecha_creacion
ALTER TABLE tabla_grupo_2_publicaciones RENAME COLUMN contenido TO descripcion;
ALTER TABLE tabla_grupo_2_publicaciones ADD COLUMN IF NOT EXISTS titulo VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE tabla_grupo_2_publicaciones ADD COLUMN IF NOT EXISTS categoria VARCHAR(30) NOT NULL DEFAULT 'Academico';
ALTER TABLE tabla_grupo_2_publicaciones ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE tabla_grupo_2_publicaciones ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE tabla_grupo_2_publicaciones ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW();

-- tabla_grupo_2_comentario
--   - "comentario" pasa a llamarse "contenido" (el codigo espera "contenido")
--   - se agregan: id_evento, parent_id, reply_to, reply_to_text, fecha_creacion
ALTER TABLE tabla_grupo_2_comentario RENAME COLUMN comentario TO contenido;
ALTER TABLE tabla_grupo_2_comentario ADD COLUMN IF NOT EXISTS id_evento INT REFERENCES tabla_grupo_3_eventos(id) ON DELETE CASCADE;
ALTER TABLE tabla_grupo_2_comentario ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES tabla_grupo_2_comentario(id_comentario) ON DELETE CASCADE;
ALTER TABLE tabla_grupo_2_comentario ADD COLUMN IF NOT EXISTS reply_to VARCHAR(150);
ALTER TABLE tabla_grupo_2_comentario ADD COLUMN IF NOT EXISTS reply_to_text TEXT;
ALTER TABLE tabla_grupo_2_comentario ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW();
-- ya existia id_publicacion, no hace falta tocarlo. Se hace opcional (nullable)
-- para permitir comentarios en eventos sin publicacion asociada:
ALTER TABLE tabla_grupo_2_comentario ALTER COLUMN id_publicacion DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grupo2_comentario_evento      ON tabla_grupo_2_comentario (id_evento);
CREATE INDEX IF NOT EXISTS idx_grupo2_comentario_publicacion ON tabla_grupo_2_comentario (id_publicacion);

-- tabla_grupo_2_reacciones
--   - le faltaba id_usuario (critico: sin esto no se sabe quien reacciono)
--   - se agregan: id_usuario, id_evento, fecha_creacion
ALTER TABLE tabla_grupo_2_reacciones ADD COLUMN IF NOT EXISTS id_usuario INT REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE;
ALTER TABLE tabla_grupo_2_reacciones ADD COLUMN IF NOT EXISTS id_evento INT REFERENCES tabla_grupo_3_eventos(id) ON DELETE CASCADE;
ALTER TABLE tabla_grupo_2_reacciones ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE tabla_grupo_2_reacciones ALTER COLUMN id_publicacion DROP NOT NULL;

-- Evita reacciones duplicadas del mismo usuario al mismo post/evento
-- (se agrega solo si no existe ya una restriccion similar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_reaccion_usuario_publicacion'
  ) THEN
    ALTER TABLE tabla_grupo_2_reacciones
      ADD CONSTRAINT uniq_reaccion_usuario_publicacion UNIQUE (id_usuario, id_publicacion);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_reaccion_usuario_evento'
  ) THEN
    ALTER TABLE tabla_grupo_2_reacciones
      ADD CONSTRAINT uniq_reaccion_usuario_evento UNIQUE (id_usuario, id_evento);
  END IF;
END $$;