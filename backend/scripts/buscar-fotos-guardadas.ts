import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.correo,
        LENGTH(p.foto_url) AS tamano_foto_bytes,
        LEFT(p.foto_url, 40) AS foto_preview
      FROM tabla_grupo_1_usuario u
      JOIN tabla_grupo_1_perfil p ON p.id_usuario = u.id_usuario
      WHERE p.foto_url IS NOT NULL AND p.foto_url <> ''
      ORDER BY u.id_usuario;
    `);

    if (rows.length === 0) {
      console.log('❌ No se encontró ningún usuario con foto_url guardada en tabla_grupo_1_perfil.');
    } else {
      console.log(`✅ Se encontraron ${rows.length} usuario(s) con foto guardada:`);
      console.table(rows);
    }
  } catch (error) {
    console.error('❌ Error buscando fotos guardadas:', error);
  } finally {
    await pool.end();
  }
})();