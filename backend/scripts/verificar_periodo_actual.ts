import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function verificar() {
  try {
    const resultado = await pool.query(
      "SELECT * FROM tabla_grupo_1_parametros WHERE nombre = 'PERIODO_ACADEMICO_ACTUAL'"
    );

    if (resultado.rows.length === 0) {
      console.log('\n❌ El parámetro PERIODO_ACADEMICO_ACTUAL NO existe todavía.');
      console.log('Por eso la validación se está saltando y deja pasar cualquier período.\n');
    } else {
      console.log('\n✅ El parámetro existe:');
      console.table(resultado.rows);
    }
  } catch (error) {
    console.error('Error verificando el parámetro:', error);
  } finally {
    await pool.end();
  }
}

verificar();