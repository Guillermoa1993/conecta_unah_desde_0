import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id_usuario,
        u.nombre,
        LENGTH(p.foto_url) AS tamano_foto_bytes,
        LEFT(p.foto_url, 40) AS foto_preview
      FROM tabla_grupo_1_usuario u
      LEFT JOIN tabla_grupo_1_perfil p ON p.id_usuario = u.id_usuario
      WHERE u.id_usuario = 6;
    `);

    if (rows.length === 0) {
      console.log('❌ No se encontró el usuario 6.');
    } else {
      console.table(rows);
    }
  } catch (error) {
    console.error('❌ Error consultando tu foto:', error);
  } finally {
    await pool.end();
  }
})();