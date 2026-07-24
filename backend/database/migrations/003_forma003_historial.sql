-- ============================================================
--  Historial de Forma 003 por período académico (Grupo 2)
-- ============================================================

CREATE TABLE IF NOT EXISTS tabla_grupo_2_forma003_historial (
  id_registro         SERIAL PRIMARY KEY,
  id_usuario          INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  periodo             VARCHAR(50) NOT NULL,
  carnet_base64       TEXT NOT NULL,
  forma003_base64     TEXT NOT NULL,
  estado              VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                        CHECK (estado IN ('PENDIENTE', 'VALIDADO', 'RECHAZADO')),
  id_admin_validador  INT REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE SET NULL,
  comentario_rechazo  TEXT,
  fecha_carga         TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_validacion    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forma003_usuario_fecha
  ON tabla_grupo_2_forma003_historial (id_usuario, fecha_carga DESC);