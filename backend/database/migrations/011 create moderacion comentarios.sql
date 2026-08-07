-- ============================================================
--  Moderación de comentarios: reportes de estudiantes + sanciones
--  escalonadas aplicadas por un admin.
--  Tablas de Grupo_4 (Seguridad), referencian tabla_grupo_1_usuario
--  y tabla_grupo_2_comentario que ya existen en la base de datos.
-- ============================================================

-- Reportes que cualquier usuario puede levantar sobre un comentario.
CREATE TABLE IF NOT EXISTS tabla_grupo_4_reporte_comentario (
  id_reporte        SERIAL PRIMARY KEY,
  id_comentario     INT NOT NULL REFERENCES tabla_grupo_2_comentario(id_comentario) ON DELETE CASCADE,
  id_usuario_reporta INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  motivo            TEXT NOT NULL,
  estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente', 'aprobado', 'descartado')),
  fecha_creacion    TIMESTAMP NOT NULL DEFAULT NOW(),
  id_admin_resuelve INT REFERENCES tabla_grupo_1_usuario(id_usuario),
  fecha_resolucion  TIMESTAMP,
  UNIQUE (id_comentario, id_usuario_reporta)
);

CREATE INDEX IF NOT EXISTS idx_reporte_comentario_estado
  ON tabla_grupo_4_reporte_comentario (estado);

-- Historial de sanciones aplicadas a un usuario. El "nivel" de sanción
-- (72h, shadowban, bloqueo permanente) se calcula al momento de aplicar
-- según cuántas sanciones previas ya tiene ese usuario.
CREATE TABLE IF NOT EXISTS tabla_grupo_4_sancion_usuario (
  id_sancion      SERIAL PRIMARY KEY,
  id_usuario      INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  id_comentario   INT REFERENCES tabla_grupo_2_comentario(id_comentario) ON DELETE SET NULL,
  id_reporte      INT REFERENCES tabla_grupo_4_reporte_comentario(id_reporte) ON DELETE SET NULL,
  tipo_sancion    VARCHAR(30) NOT NULL
                     CHECK (tipo_sancion IN ('suspension_72h', 'shadowban', 'bloqueo_permanente')),
  nivel           SMALLINT NOT NULL, -- 1, 2 o 3: cuántas infracciones lleva el usuario
  motivo          TEXT NOT NULL,
  id_admin_aplico INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario),
  fecha_inicio    TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_fin       TIMESTAMP, -- NULL = indefinida (shadowban o bloqueo permanente)
  activa          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_sancion_usuario_usuario
  ON tabla_grupo_4_sancion_usuario (id_usuario);
CREATE INDEX IF NOT EXISTS idx_sancion_usuario_activa
  ON tabla_grupo_4_sancion_usuario (id_usuario, activa);