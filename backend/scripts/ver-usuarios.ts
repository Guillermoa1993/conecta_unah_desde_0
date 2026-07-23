import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const { rows } = await pool.query(
      'SELECT id_usuario, nombre, correo FROM tabla_grupo_1_usuario ORDER BY id_usuario'
    );
    console.log('--- Usuarios existentes ---');
    console.table(rows);

    const conexiones = await pool.query('SELECT * FROM tabla_grupo_2_perfilpumita');
    console.log('--- Conexiones Pumitas existentes ---');
    console.table(conexiones.rows);
  } catch (error) {
    console.error('Error consultando la base de datos:', error);
  } finally {
    await pool.end();
  }
})();