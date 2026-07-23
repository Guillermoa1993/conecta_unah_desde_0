import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const { rows } = await pool.query(
      `SELECT id_usuario, nombre, correo FROM tabla_grupo_1_usuario WHERE correo ILIKE $1`,
      ['dzunigar@unah.hn'] // reemplaza esto por parte de tu correo institucional
    );
    console.table(rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
})();