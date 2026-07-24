import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const { rows } = await pool.query('SELECT * FROM tabla_grupo_2_perfilpumita');
    console.log(`Total de filas: ${rows.length}`);
    console.table(rows);
  } catch (error) {
    console.error('Error consultando datos:', error);
  } finally {
    await pool.end();
  }
})();