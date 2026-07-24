import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const { rows } = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'tabla_grupo_2_perfilpumita'
       ORDER BY ordinal_position`
    );
    console.table(rows);
  } catch (error) {
    console.error('Error consultando columnas:', error);
  } finally {
    await pool.end();
  }
})();