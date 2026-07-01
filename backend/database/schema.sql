-- ============================================================
--  UNAH CONECTA PUMAS — Schema de Base de Datos
--  PostgreSQL 15+
-- ============================================================

-- gen_random_uuid() es nativa en PostgreSQL 13+ (no requiere extensión)

-- ── Usuarios ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          VARCHAR(150) NOT NULL,
  correo          VARCHAR(200) UNIQUE NOT NULL,
  contrasena_hash TEXT NOT NULL,
  rol             VARCHAR(20) NOT NULL CHECK (rol IN ('ESTUDIANTE','TUTOR','ADMIN','VOAE')),
  estado          VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO','INACTIVO','SUSPENDIDO')),
  numero_cuenta   VARCHAR(20),
  carrera         VARCHAR(150),
  centro_regional VARCHAR(100),
  telefono        VARCHAR(20),
  foto_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Eventos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo                VARCHAR(200) NOT NULL,
  descripcion           TEXT NOT NULL,
  categoria             VARCHAR(20) NOT NULL CHECK (categoria IN ('ACADEMICO','CULTURAL','DEPORTIVO','SOCIAL')),
  tipo_actividad        VARCHAR(20) NOT NULL CHECK (tipo_actividad IN ('Presencial','Virtual','Híbrido')),
  tipo_evento           VARCHAR(20) NOT NULL CHECK (tipo_evento IN ('HORAS_VOAE','RECREACION')),
  visibilidad           VARCHAR(20) NOT NULL DEFAULT 'PUBLICO' CHECK (visibilidad IN ('PUBLICO','PRIVADO')),
  estado                VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_APROBACION'
                          CHECK (estado IN ('BORRADOR','PENDIENTE_APROBACION','PROGRAMADO','EN_CURSO','FINALIZADO','RECHAZADO')),
  centro_regional       VARCHAR(100) NOT NULL,
  fecha_inicio          DATE NOT NULL,
  fecha_fin             DATE NOT NULL,
  hora_inicio           TIME NOT NULL,
  hora_fin              TIME NOT NULL,
  ubicacion             VARCHAR(300),
  latitud               NUMERIC(10,7),
  longitud              NUMERIC(10,7),
  enlace_virtual        TEXT,
  cupo_maximo           INTEGER NOT NULL CHECK (cupo_maximo > 0),
  duracion_horas        NUMERIC(5,1) NOT NULL CHECK (duracion_horas > 0),
  tipo_duracion         VARCHAR(10) NOT NULL DEFAULT 'TOTALES' CHECK (tipo_duracion IN ('TOTALES','DIARIAS')),
  requiere_inscripcion  BOOLEAN NOT NULL DEFAULT TRUE,
  portada_url           TEXT,
  tutor_id              UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  aprobado_por          UUID REFERENCES usuarios(id),
  motivo_rechazo        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Inscripciones ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inscripciones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  evento_id         UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  estado            VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADA'
                      CHECK (estado IN ('PENDIENTE','CONFIRMADA','CANCELADA','ASISTIO','NO_ASISTIO')),
  fecha_inscripcion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (estudiante_id, evento_id)
);

-- ── Asistencias ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asistencias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  evento_id       UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  metodo          VARCHAR(10) NOT NULL CHECK (metodo IN ('QR','MANUAL')),
  estado          VARCHAR(10) NOT NULL DEFAULT 'PRESENTE' CHECK (estado IN ('PRESENTE','AUSENTE','TARDANZA')),
  fecha_hora      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registrado_por  UUID REFERENCES usuarios(id),
  UNIQUE (estudiante_id, evento_id)
);

-- ── Constancias VOAE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS constancias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  evento_id       UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  horas_otorgadas NUMERIC(5,1) NOT NULL CHECK (horas_otorgadas > 0),
  estado          VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                    CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA','EMITIDA')),
  fecha_emision   TIMESTAMPTZ,
  aprobado_por    UUID REFERENCES usuarios(id),
  motivo_rechazo  TEXT,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (estudiante_id, evento_id)
);

-- ── Notificaciones ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo      VARCHAR(200) NOT NULL,
  mensaje     TEXT NOT NULL,
  tipo        VARCHAR(30) NOT NULL
                CHECK (tipo IN ('EVENTO_APROBADO','EVENTO_RECHAZADO','NUEVA_INSCRIPCION',
                                'EVENTO_CANCELADO','CONSTANCIA_EMITIDA','RECORDATORIO','SISTEMA')),
  leida       BOOLEAN NOT NULL DEFAULT FALSE,
  evento_id   UUID REFERENCES eventos(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_eventos_estado        ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_tutor         ON eventos(tutor_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_estud   ON inscripciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_evento  ON inscripciones(evento_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_evento    ON asistencias(evento_id);
CREATE INDEX IF NOT EXISTS idx_constancias_estud     ON constancias(estudiante_id);
-- Índice de notificaciones omitido: la tabla pre-existente usa columna id_usuario
