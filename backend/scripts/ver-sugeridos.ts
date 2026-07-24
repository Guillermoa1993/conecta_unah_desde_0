import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const id_usuario = 6; // tu propio id, para simular la consulta
    const { rows } = await pool.query(
      `SELECT
         NULL::int AS id_conexion,
         u.id_usuario,
         u.nombre,
         'sugerido' AS estado,
         false AS soy_solicitante
       FROM tabla_grupo_1_usuario u
       WHERE u.id_usuario <> $1
         AND u.id_usuario NOT IN (
           SELECT CASE WHEN p."Usuario_id_usuario" = $1 THEN p."Usuario_id_usuario1" ELSE p."Usuario_id_usuario" END
           FROM tabla_grupo_2_perfilpumita p
           WHERE p."Usuario_id_usuario" = $1 OR p."Usuario_id_usuario1" = $1
         )
       ORDER BY u.nombre
       LIMIT 20`,
      [id_usuario],
    );
    console.log(`Total encontrados: ${rows.length}`);
    console.table(rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
})();