import pool from '../src/infrastructure/database/db';

async function listUsers() {
  const client = await pool.connect();
  try {
    const columnsRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tabla_grupo_1_usuario'
    `);
    console.log('Columns:', columnsRes.rows.map(r => r.column_name));

    const { rows } = await client.query('SELECT * FROM tabla_grupo_1_usuario LIMIT 10');
    console.log('👥 Usuarios registrados en la base de datos:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error al consultar usuarios:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

listUsers();
