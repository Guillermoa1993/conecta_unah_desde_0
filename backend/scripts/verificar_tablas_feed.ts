import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const TABLAS = [
  'tabla_grupo_1_publicacion',
  'tabla_grupo_1_comentario',
  'tabla_grupo_1_reaccion_post',
  'tabla_grupo_1_reaccion_comentario',
];

async function verificar() {
  try {
    for (const tabla of TABLAS) {
      const resultado = await pool.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = $1
         ORDER BY ordinal_position;`,
        [tabla]
      );

      if (resultado.rows.length === 0) {
        console.log(`\n❌ La tabla "${tabla}" NO existe.`);
        continue;
      }

      console.log(`\n✅ Columnas de ${tabla}:`);
      resultado.rows.forEach((col) => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
  } catch (error) {
    console.error('Error verificando tablas del feed:', error);
  } finally {
    await pool.end();
  }
}

verificar();