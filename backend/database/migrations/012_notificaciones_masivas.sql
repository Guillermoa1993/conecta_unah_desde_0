-- ============================================================
--  Soporte para el Centro de Notificaciones (envío masivo)
--  - titulo: encabezado corto de la notificación (antes solo
--    existía "mensaje")
--  - destinatario_grupo: a qué grupo se envió (Todos,
--    Estudiantes, Tutores, Personal VOAE), usado para
--    reconstruir el historial de envíos masivos
-- ============================================================

ALTER TABLE tabla_grupo_1_notificaciones
  ADD COLUMN IF NOT EXISTS titulo VARCHAR(150),
  ADD COLUMN IF NOT EXISTS destinatario_grupo VARCHAR(50);

-- Tipos usados por los anuncios masivos del Centro de Notificaciones,
-- para poder mostrar el mismo semáforo info/advertencia/éxito que ya
-- tenía el panel.
INSERT INTO tabla_grupo_1_tipo_notificacion (nombre)
VALUES ('ANUNCIO_INFO'), ('ANUNCIO_ADVERTENCIA'), ('ANUNCIO_EXITO')
ON CONFLICT DO NOTHING;