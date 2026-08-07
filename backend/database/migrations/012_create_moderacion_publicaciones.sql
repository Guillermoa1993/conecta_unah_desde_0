-- ============================================================
--  Moderación de publicaciones: reportes de estudiantes + sanciones
-- ============================================================

CREATE TABLE IF NOT EXISTS tabla_grupo_4_reporte_publicacion (
  id_reporte        SERIAL PRIMARY KEY,
  id_publicacion    INT NOT NULL REFERENCES tabla_grupo_2_publicaciones(id_publicacion) ON DELETE CASCADE,
  id_usuario_reporta INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  motivo            TEXT NOT NULL,
  estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente', 'aprobado', 'descartado')),
  fecha_creacion    TIMESTAMP NOT NULL DEFAULT NOW(),
  id_admin_resuelve INT REFERENCES tabla_grupo_1_usuario(id_usuario),
  fecha_resolucion  TIMESTAMP,
  UNIQUE (id_publicacion, id_usuario_reporta)
);

CREATE INDEX IF NOT EXISTS idx_reporte_publicacion_estado
  ON tabla_grupo_4_reporte_publicacion (estado);
