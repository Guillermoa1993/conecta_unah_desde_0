import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const TABLAS = [
  'tabla_grupo_2_comentario',
  'tabla_grupo_2_publicaciones',
  'tabla_grupo_2_like_publicacion',
  'tabla_grupo_2_reacciones',
];

async function inspeccionar() {
  try {
    for (const tabla of TABLAS) {
      const columnas = await pool.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = $1
         ORDER BY ordinal_position;`,
        [tabla]
      );

      const conteo = await pool.query(`SELECT COUNT(*)::int AS total FROM ${tabla};`);

      console.log(`\n=== ${tabla} (${conteo.rows[0].total} filas) ===`);
      columnas.rows.forEach((col) => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
  } catch (error) {
    console.error('Error inspeccionando tablas:', error);
  } finally {
    await pool.end();
  }
}

inspeccionar();