-- ============================================================
--  UNAH CONECTA PUMAS — Datos semilla Grupo 1
--  Ejecutar con: npm run db:init
-- ============================================================

INSERT INTO tabla_grupo_1_rol (nombre) VALUES
  ('ESTUDIANTE'), ('TUTOR'), ('ADMIN'), ('VOAE')
ON CONFLICT DO NOTHING;

INSERT INTO tabla_grupo_1_estado_usuario (estado) VALUES
  ('ACTIVO'), ('INACTIVO'), ('SUSPENDIDO')
ON CONFLICT DO NOTHING;

INSERT INTO tabla_grupo_1_tipo_notificacion (nombre) VALUES
  ('EVENTO_APROBADO'), ('EVENTO_RECHAZADO'), ('NUEVA_INSCRIPCION'),
  ('EVENTO_CANCELADO'), ('CONSTANCIA_EMITIDA'), ('RECORDATORIO'), ('SISTEMA')
ON CONFLICT DO NOTHING;

INSERT INTO tabla_grupo_1_carreras (nombre) VALUES
  ('Ingeniería en Sistemas'), ('Ingeniería Civil'), ('Ingeniería Industrial'),
  ('Administración de Empresas'), ('Contaduría Pública'), ('Derecho'),
  ('Medicina'), ('Psicología'), ('Comunicación Social'), ('Matemáticas')
ON CONFLICT DO NOTHING;
