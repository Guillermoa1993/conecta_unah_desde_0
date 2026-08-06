-- ============================================================
--  Agrega el campo "lugar" a las publicaciones, para soportar
--  el mapa embebido (igual que el módulo Eventos) en vez de
--  un simple link/URL.
--
--  Formato esperado (igual al que ya usa tabla_grupo_3_eventos.ubicacion
--  vía el componente EventDetailMapPreview):
--    "Dirección o nombre del lugar|https://www.google.com/maps/...|lat,lng"
--  El campo también acepta texto libre sin coordenadas (solo dirección).
--
--  Ejecutar con: npx ts-node scripts/aplicar-migracion-generica.ts 011_add_lugar_publicaciones.sql
-- ============================================================

ALTER TABLE tabla_grupo_2_publicaciones
  ADD COLUMN IF NOT EXISTS lugar TEXT;