-- ============================================================
--  MÓDULO 4: SEGURIDAD — UNAH Conecta / ConectaPumas (Grupo 4)
--  Tablas: usuarios, roles, permisos, usuarios_roles, roles_permisos
-- ============================================================

CREATE TABLE IF NOT EXISTS tabla_grupo_4_usuarios (
    id_usuario      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL,
    correo          VARCHAR(150)    NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255)    NOT NULL,
    estado          SMALLINT        NOT NULL DEFAULT 1
                                    CHECK (estado IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_tg4_usuarios_correo ON tabla_grupo_4_usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_tg4_usuarios_estado ON tabla_grupo_4_usuarios(estado);

CREATE TABLE IF NOT EXISTS tabla_grupo_4_roles (
    id_rol      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_rol  VARCHAR(50)     NOT NULL UNIQUE,
    codigo_rol  VARCHAR(30)     NOT NULL UNIQUE,
    descripcion VARCHAR(255)    NULL
);

INSERT INTO tabla_grupo_4_roles (nombre_rol, codigo_rol, descripcion) VALUES
    ('Administrador', 'admin',      'Acceso total al sistema. Gestiona usuarios, roles y configuraciones.'),
    ('Estudiante',    'estudiante', 'Puede inscribirse y participar en cursos disponibles.'),
    ('Tutor',         'tutor',      'Puede crear y gestionar cursos avalados por la UNAH.'),
    ('Moderador',     'moderador',  'Revisa y aprueba contenidos antes de su publicación.'),
    ('Auditor',       'auditor',    'Solo lectura. Accede a bitácoras y reportes del sistema.')
ON CONFLICT (codigo_rol) DO NOTHING;

CREATE TABLE IF NOT EXISTS tabla_grupo_4_permisos (
    id_permiso      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_permiso  VARCHAR(50)     NOT NULL UNIQUE,
    modulo          VARCHAR(50)     NOT NULL,
    descripcion     VARCHAR(255)    NULL
);

CREATE INDEX IF NOT EXISTS idx_tg4_permisos_modulo ON tabla_grupo_4_permisos(modulo);

INSERT INTO tabla_grupo_4_permisos (nombre_permiso, modulo, descripcion) VALUES
    ('seguridad:ver_roles',         'Seguridad', 'Puede visualizar la lista de roles del sistema'),
    ('seguridad:crear_roles',       'Seguridad', 'Puede crear nuevos roles en el sistema'),
    ('seguridad:editar_roles',      'Seguridad', 'Puede modificar roles existentes'),
    ('seguridad:eliminar_roles',    'Seguridad', 'Puede eliminar roles del sistema'),
    ('seguridad:ver_permisos',      'Seguridad', 'Puede visualizar permisos del sistema'),
    ('seguridad:crear_permisos',    'Seguridad', 'Puede crear nuevos permisos'),
    ('seguridad:editar_permisos',   'Seguridad', 'Puede modificar permisos existentes'),
    ('seguridad:eliminar_permisos', 'Seguridad', 'Puede eliminar permisos del sistema'),
    ('usuarios:ver',                'Usuarios',  'Puede visualizar la lista de usuarios'),
    ('usuarios:crear',              'Usuarios',  'Puede registrar nuevos usuarios'),
    ('usuarios:editar',             'Usuarios',  'Puede modificar datos de usuarios'),
    ('usuarios:eliminar',           'Usuarios',  'Puede eliminar usuarios del sistema'),
    ('eventos:ver',                 'Eventos',   'Puede visualizar eventos disponibles'),
    ('eventos:crear',               'Eventos',   'Puede crear nuevos eventos'),
    ('eventos:editar',              'Eventos',   'Puede modificar eventos existentes'),
    ('eventos:eliminar',            'Eventos',   'Puede eliminar eventos del sistema'),
    ('bitacora:ver',                'Bitácora',  'Puede consultar el registro de actividad del sistema'),
    ('respaldos:gestionar',         'Respaldos', 'Puede generar y consultar respaldos de la base de datos')
ON CONFLICT (nombre_permiso) DO NOTHING;

CREATE TABLE IF NOT EXISTS tabla_grupo_4_usuarios_roles (
    id_usuario  INT     NOT NULL,
    id_rol      INT     NOT NULL,
    PRIMARY KEY (id_usuario, id_rol),
    CONSTRAINT fk_tg4_ur_usuario FOREIGN KEY (id_usuario) REFERENCES tabla_grupo_4_usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_tg4_ur_rol     FOREIGN KEY (id_rol)     REFERENCES tabla_grupo_4_roles(id_rol)        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tg4_ur_usuario ON tabla_grupo_4_usuarios_roles(id_usuario);
CREATE INDEX IF NOT EXISTS idx_tg4_ur_rol     ON tabla_grupo_4_usuarios_roles(id_rol);

CREATE TABLE IF NOT EXISTS tabla_grupo_4_roles_permisos (
    id_rol      INT     NOT NULL,
    id_permiso  INT     NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    CONSTRAINT fk_tg4_rp_rol     FOREIGN KEY (id_rol)     REFERENCES tabla_grupo_4_roles(id_rol)      ON DELETE CASCADE,
    CONSTRAINT fk_tg4_rp_permiso FOREIGN KEY (id_permiso) REFERENCES tabla_grupo_4_permisos(id_permiso) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tg4_rp_rol     ON tabla_grupo_4_roles_permisos(id_rol);
CREATE INDEX IF NOT EXISTS idx_tg4_rp_permiso ON tabla_grupo_4_roles_permisos(id_permiso);

-- Asignar todos los permisos al rol Administrador (id=1)
INSERT INTO tabla_grupo_4_roles_permisos (id_rol, id_permiso)
    SELECT 1, id_permiso FROM tabla_grupo_4_permisos
ON CONFLICT DO NOTHING;

-- Estudiante (id=2)
INSERT INTO tabla_grupo_4_roles_permisos (id_rol, id_permiso)
    SELECT 2, id_permiso FROM tabla_grupo_4_permisos
    WHERE nombre_permiso IN ('eventos:ver', 'usuarios:ver')
ON CONFLICT DO NOTHING;

-- Tutor (id=3)
INSERT INTO tabla_grupo_4_roles_permisos (id_rol, id_permiso)
    SELECT 3, id_permiso FROM tabla_grupo_4_permisos
    WHERE nombre_permiso IN ('eventos:ver','eventos:crear','eventos:editar','usuarios:ver')
ON CONFLICT DO NOTHING;

-- Moderador (id=4)
INSERT INTO tabla_grupo_4_roles_permisos (id_rol, id_permiso)
    SELECT 4, id_permiso FROM tabla_grupo_4_permisos
    WHERE nombre_permiso IN ('eventos:ver','eventos:editar','usuarios:ver',
                             'seguridad:ver_roles','seguridad:ver_permisos')
ON CONFLICT DO NOTHING;

-- Auditor (id=5)
INSERT INTO tabla_grupo_4_roles_permisos (id_rol, id_permiso)
    SELECT 5, id_permiso FROM tabla_grupo_4_permisos
    WHERE nombre_permiso IN ('seguridad:ver_roles','seguridad:ver_permisos',
                             'usuarios:ver','bitacora:ver')
ON CONFLICT DO NOTHING;

-- ── Columnas adicionales para soportar la pantalla de Gestión de Usuarios ──
ALTER TABLE tabla_grupo_4_usuarios ADD COLUMN IF NOT EXISTS apellido              VARCHAR(100) NULL;
ALTER TABLE tabla_grupo_4_usuarios ADD COLUMN IF NOT EXISTS telefono              VARCHAR(20)  NULL;
ALTER TABLE tabla_grupo_4_usuarios ADD COLUMN IF NOT EXISTS motivo_inhabilitacion VARCHAR(500) NULL;
ALTER TABLE tabla_grupo_4_usuarios ADD COLUMN IF NOT EXISTS modulos_acceso        TEXT[]       NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS tabla_grupo_4_usuarios_permisos (
    id_usuario  INT     NOT NULL,
    id_permiso  INT     NOT NULL,
    PRIMARY KEY (id_usuario, id_permiso),
    CONSTRAINT fk_tg4_up_usuario FOREIGN KEY (id_usuario)  REFERENCES tabla_grupo_4_usuarios(id_usuario)  ON DELETE CASCADE,
    CONSTRAINT fk_tg4_up_permiso FOREIGN KEY (id_permiso)  REFERENCES tabla_grupo_4_permisos(id_permiso)  ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tg4_up_usuario ON tabla_grupo_4_usuarios_permisos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_tg4_up_permiso ON tabla_grupo_4_usuarios_permisos(id_permiso);
