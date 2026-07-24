-- ============================================================
--  UNAH CONECTA PUMAS — Tablas y datos semilla Grupo 1
--  Ejecutar con: npm run db:init
-- ============================================================

-- ── Tablas de catálogos ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS tabla_grupo_1_rol (
  id_rol   SERIAL PRIMARY KEY,
  nombre   VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tabla_grupo_1_estado_usuario (
  id_estado SERIAL PRIMARY KEY,
  estado    VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tabla_grupo_1_carreras (
  id_carrera SERIAL PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tabla_grupo_1_tipo_notificacion (
  id_tipo SERIAL PRIMARY KEY,
  nombre  VARCHAR(100) NOT NULL UNIQUE
);

-- ── Tabla principal de usuarios ──────────────────────────────

CREATE TABLE IF NOT EXISTS tabla_grupo_1_usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  correo     VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  id_rol     INT NOT NULL REFERENCES tabla_grupo_1_rol(id_rol),
  id_estado  INT NOT NULL REFERENCES tabla_grupo_1_estado_usuario(id_estado),
  id_carrera INT REFERENCES tabla_grupo_1_carreras(id_carrera),
  permite_reacciones_perfil BOOLEAN NOT NULL DEFAULT TRUE
);
);

-- ── Tablas de registro y auditoría ───────────────────────────

CREATE TABLE IF NOT EXISTS tabla_grupo_1_notificaciones (
  id_notificacion SERIAL PRIMARY KEY,
  id_usuario      INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario),
  id_tipo         INT NOT NULL REFERENCES tabla_grupo_1_tipo_notificacion(id_tipo),
  mensaje         TEXT NOT NULL,
  leida           BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion  TIMESTAMP NOT NULL DEFAULT NOW(),
  id_emisor       INT REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE SET NULL,
  referencia_tipo VARCHAR(100),
  referencia_id   INT
);

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

CREATE TABLE IF NOT EXISTS tabla_grupo_1_sesion (
  id_sesion   SERIAL PRIMARY KEY,
  id_usuario  INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario),
  fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tabla_grupo_1_bitacora (
  id_bitacora SERIAL PRIMARY KEY,
  id_usuario  INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario),
  accion      TEXT NOT NULL,
  fecha       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tabla_grupo_1_parametros (
  id_parametro SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL UNIQUE,
  valor        VARCHAR(255) NOT NULL
);

-- ── Datos semilla ────────────────────────────────────────────

INSERT INTO tabla_grupo_1_rol (nombre) VALUES
  ('ESTUDIANTE'), ('TUTOR'), ('ADMIN'), ('VOAE')
ON CONFLICT DO NOTHING;

INSERT INTO tabla_grupo_1_estado_usuario (estado) VALUES
  ('ACTIVO'), ('INACTIVO'), ('SUSPENDIDO')
ON CONFLICT DO NOTHING;

INSERT INTO tabla_grupo_1_tipo_notificacion (nombre) VALUES
  ('EVENTO_APROBADO'), ('EVENTO_RECHAZADO'), ('NUEVA_INSCRIPCION'),
 ('EVENTO_CANCELADO'), ('CONSTANCIA_EMITIDA'), ('RECORDATORIO'), ('SISTEMA'),
  ('REACCION_PUMITA')
ON CONFLICT DO NOTHING;

INSERT INTO tabla_grupo_1_carreras (nombre) VALUES
  ('Ingeniería en Sistemas'), ('Ingeniería Civil'), ('Ingeniería Industrial'),
  ('Administración de Empresas'), ('Contaduría Pública'), ('Derecho'),
  ('Medicina'), ('Psicología'), ('Comunicación Social'), ('Matemáticas')
ON CONFLICT DO NOTHING;
