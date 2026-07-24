-- ============================================================
--  Actualización de catálogo de roles (tabla_grupo_1_rol)
--  - TUTOR pasa a llamarse EMPLEADO
--  - VOAE se divide en VOAE_DIRECCION y VOAE_DEPARTAMENTO
--    (los usuarios que ya tenían VOAE quedan como VOAE_DIRECCION;
--     puedes reasignar a VOAE_DEPARTAMENTO desde el panel de Usuarios)
--
--  Ejecutar en Adminer: pestaña "Comando SQL" -> pegar y ejecutar.
-- ============================================================

UPDATE tabla_grupo_1_rol
   SET nombre = 'EMPLEADO'
 WHERE nombre = 'TUTOR';

UPDATE tabla_grupo_1_rol
   SET nombre = 'VOAE_DIRECCION'
 WHERE nombre = 'VOAE';

INSERT INTO tabla_grupo_1_rol (nombre)
VALUES ('VOAE_DEPARTAMENTO')
ON CONFLICT DO NOTHING;

-- Verificación:
SELECT * FROM tabla_grupo_1_rol ORDER BY id_rol;
