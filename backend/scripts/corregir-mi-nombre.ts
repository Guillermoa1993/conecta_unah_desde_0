import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const { rows } = await pool.query(
      `UPDATE tabla_grupo_1_usuario
       SET nombre = $1
       WHERE correo = $2
       RETURNING id_usuario, nombre, correo;`,
      ['Dora Luz Zuniga Rosales', 'dzunigar@unah.hn']
    );
    console.log('✅ Nombre actualizado:', rows);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
})();