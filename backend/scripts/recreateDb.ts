import pool from '../src/infrastructure/database/db';

const sql = `
-- Drop existing Grupo 3 tables if they exist
DROP TABLE IF EXISTS tabla_grupo_3_bitacora_evento CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_codigos_asistencia CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_qr_tokens CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_respuestas_encuesta CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_encuestas CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_actividades_acreditadas CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_horas_acumuladas CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_asistencias CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_inscripcion CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_eventos_carreras CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_eventos CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_categorias CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_moderadores CASCADE;
DROP TABLE IF EXISTS tabla_grupo_3_constancias CASCADE;

-- 1. Categorías de evento
CREATE TABLE tabla_grupo_3_categorias (
  id              SERIAL PRIMARY KEY,
  codigo          VARCHAR(50) UNIQUE NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  nombre_largo    VARCHAR(200) NOT NULL,
  color_hex       VARCHAR(7) NOT NULL,
  limite_horas    INTEGER NOT NULL DEFAULT 15,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Eventos
CREATE TABLE tabla_grupo_3_eventos (
  id                    SERIAL PRIMARY KEY,
  tutor_id              INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario),
  codigo_actividad      VARCHAR(50) UNIQUE,
  titulo                VARCHAR(300) NOT NULL,
  descripcion           TEXT NOT NULL,
  categoria             VARCHAR(50) NOT NULL,
  tipo_actividad        VARCHAR(50) NOT NULL DEFAULT 'Presencial',
  entidad_organizadora  VARCHAR(200),
  imagen_url            TEXT,
  imagenes_adicionales  TEXT[],
  fecha_inicio          TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_fin             TIMESTAMP WITH TIME ZONE NOT NULL,
  duracion_horas        NUMERIC(5,1) NOT NULL CHECK (duracion_horas > 0),
  cupo_maximo           INTEGER NOT NULL CHECK (cupo_maximo >= 1),
  lugar                 VARCHAR(300),
  enlace_virtual        TEXT,
  asistencias_requeridas INTEGER NOT NULL DEFAULT 1 CHECK (asistencias_requeridas >= 1),
  estado                VARCHAR(50) NOT NULL DEFAULT 'BORRADOR',
  motivo_rechazo        TEXT,
  aprobado_por          INT REFERENCES tabla_grupo_1_usuario(id_usuario),
  created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Carreras permitidas por evento
CREATE TABLE tabla_grupo_3_eventos_carreras (
  id              SERIAL PRIMARY KEY,
  evento_id       INT NOT NULL REFERENCES tabla_grupo_3_eventos(id) ON DELETE CASCADE,
  carrera         VARCHAR(200) NOT NULL,
  UNIQUE (evento_id, carrera)
);

-- 4. Inscripciones
CREATE TABLE tabla_grupo_3_inscripcion (
  id              SERIAL PRIMARY KEY,
  evento_id       INT NOT NULL REFERENCES tabla_grupo_3_eventos(id) ON DELETE CASCADE,
  estudiante_id   INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  origen          VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
  estado          VARCHAR(50) NOT NULL DEFAULT 'INSCRITO',
  inscrito_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  cancelado_at    TIMESTAMP WITH TIME ZONE,
  UNIQUE (evento_id, estudiante_id)
);

-- 5. Asistencias
CREATE TABLE tabla_grupo_3_asistencias (
  id                    SERIAL PRIMARY KEY,
  evento_id             INT NOT NULL REFERENCES tabla_grupo_3_eventos(id) ON DELETE CASCADE,
  estudiante_id         INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  inscripcion_id        INT REFERENCES tabla_grupo_3_inscripcion(id) ON DELETE SET NULL,
  escaneado_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  estado_validacion     VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  validado_por          INT REFERENCES tabla_grupo_1_usuario(id_usuario),
  validado_at           TIMESTAMP WITH TIME ZONE,
  motivo_rechazo        TEXT,
  encuesta_completada   BOOLEAN NOT NULL DEFAULT FALSE,
  tipo_registro         VARCHAR(50) NOT NULL DEFAULT 'ENTRADA',
  UNIQUE (evento_id, estudiante_id, tipo_registro)
);

-- 6. Horas acumuladas por estudiante por categoría
CREATE TABLE tabla_grupo_3_horas_acumuladas (
  id              SERIAL PRIMARY KEY,
  estudiante_id   INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  categoria       VARCHAR(50) NOT NULL,
  total_horas     NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (total_horas >= 0),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (estudiante_id, categoria)
);

-- 7. Actividades acreditadas (historial del estudiante)
CREATE TABLE tabla_grupo_3_actividades_acreditadas (
  id                SERIAL PRIMARY KEY,
  estudiante_id     INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  asistencia_id     INT NOT NULL REFERENCES tabla_grupo_3_asistencias(id) ON DELETE CASCADE,
  horas_acreditadas NUMERIC(5,1) NOT NULL CHECK (horas_acreditadas > 0),
  categoria         VARCHAR(50) NOT NULL,
  estado            VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  acreditado_at     TIMESTAMP WITH TIME ZONE,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Encuestas de satisfacción
CREATE TABLE tabla_grupo_3_encuestas (
  id                    SERIAL PRIMARY KEY,
  asistencia_id         INT NOT NULL REFERENCES tabla_grupo_3_asistencias(id) UNIQUE,
  calificacion_evento   INTEGER NOT NULL CHECK (calificacion_evento BETWEEN 1 AND 5),
  calificacion_tutor    INTEGER NOT NULL CHECK (calificacion_tutor BETWEEN 1 AND 5),
  comentario            TEXT,
  enviado_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Respuestas detalladas de encuesta
CREATE TABLE tabla_grupo_3_respuestas_encuesta (
  id              SERIAL PRIMARY KEY,
  encuesta_id     INT NOT NULL REFERENCES tabla_grupo_3_encuestas(id) ON DELETE CASCADE,
  aspecto         VARCHAR(200) NOT NULL
);

-- 10. Tokens QR
CREATE TABLE tabla_grupo_3_qr_tokens (
  id              SERIAL PRIMARY KEY,
  evento_id       INT NOT NULL REFERENCES tabla_grupo_3_eventos(id) ON DELETE CASCADE,
  tipo            VARCHAR(50) NOT NULL,
  token           TEXT NOT NULL,
  imagen_url      TEXT,
  expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at         TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. Códigos de asistencia (token efímero de 6 dígitos para marcar asistencia)
CREATE TABLE tabla_grupo_3_codigos_asistencia (
  id              SERIAL PRIMARY KEY,
  evento_id       INT NOT NULL REFERENCES tabla_grupo_3_eventos(id) ON DELETE CASCADE,
  codigo          VARCHAR(6) NOT NULL,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  generado_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expira_at       TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 12. Moderadores
CREATE TABLE tabla_grupo_3_moderadores (
  id                    SERIAL PRIMARY KEY,
  usuario_id            INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  asignado_por          INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  permisos              VARCHAR(50)[] NOT NULL,
  activo                BOOLEAN NOT NULL DEFAULT TRUE,
  motivo_desactivacion  TEXT,
  tipo_rol              VARCHAR(20) NOT NULL DEFAULT 'MODERADOR',
  created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id)
);

-- 13. Bitácora de eventos
CREATE TABLE tabla_grupo_3_bitacora_evento (
  id              SERIAL PRIMARY KEY,
  evento_id       INT NOT NULL REFERENCES tabla_grupo_3_eventos(id) ON DELETE CASCADE,
  usuario_id      INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  accion          VARCHAR(200) NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 14. Constancias (horas acreditadas y aprobadas)
CREATE TABLE tabla_grupo_3_constancias (
  id              SERIAL PRIMARY KEY,
  estudiante_id   INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  evento_id       INT NOT NULL REFERENCES tabla_grupo_3_eventos(id) ON DELETE CASCADE,
  horas_otorgadas NUMERIC(5, 2) NOT NULL,
  estado          VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  aprobado_por    INT REFERENCES tabla_grupo_1_usuario(id_usuario),
  motivo_rechazo  TEXT,
  pdf_url         TEXT,
  fecha_emision   TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed Categories
INSERT INTO tabla_grupo_3_categorias (codigo, nombre, nombre_largo, color_hex, limite_horas) VALUES
  ('ACADEMICO', 'Académico',   'Científico-Académico', '#3b82f6', 15),
  ('CULTURAL',  'Cultural',    'Cultural-Artístico',    '#8b5cf6', 15),
  ('DEPORTIVO', 'Deportivo',   'Deportivo',             '#22c55e', 15),
  ('SOCIAL',    'Social',      'Social',                '#f59e0b', 15)
ON CONFLICT (codigo) DO NOTHING;
`;

async function recreateDb() {
  const client = await pool.connect();
  try {
    console.log('🔄 Conectando para recrear tablas del Grupo 3...');
    await client.query(sql);
    console.log('✅ Tablas del Grupo 3 recreadas con éxito.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al recrear tablas:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

recreateDb();
