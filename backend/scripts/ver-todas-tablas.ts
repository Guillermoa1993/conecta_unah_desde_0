import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const { rows } = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`
    );
    console.table(rows);
  } catch (error) {
    console.error('Error consultando tablas:', error);
  } finally {
    await pool.end();
  }
})();