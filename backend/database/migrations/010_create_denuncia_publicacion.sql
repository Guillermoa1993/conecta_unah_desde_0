-- ============================================================
--  Módulo de Denuncias para Publicaciones
--  Ejecutar con: npx ts-node scripts/aplicar-migracion-generica.ts 010_create_denuncia_publicacion.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS tabla_grupo_2_denuncia_publicacion (
  id_denuncia SERIAL PRIMARY KEY,
  id_publicacion INT NOT NULL REFERENCES tabla_grupo_2_publicaciones(id_publicacion) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  motivo VARCHAR(100) NOT NULL,
  detalle TEXT,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_denuncia_publicacion_publicacion
  ON tabla_grupo_2_denuncia_publicacion (id_publicacion);