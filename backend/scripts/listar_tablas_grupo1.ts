import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function listarTablasGrupo1() {
  try {
    const resultado = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_name LIKE 'tabla_grupo_1_%'
       ORDER BY table_name;`
    );

    console.log('\nTablas de Grupo_1 en la base de datos:\n');
    resultado.rows.forEach((fila) => {
      console.log(`- ${fila.table_name}`);
    });
    console.log(`\nTotal: ${resultado.rows.length} tablas`);
  } catch (error) {
    console.error('Error listando tablas de Grupo_1:', error);
  } finally {
    await pool.end();
  }
}

listarTablasGrupo1();