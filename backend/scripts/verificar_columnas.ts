import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Render normalmente requiere esto
});

async function verificarColumnas() {
  try {
    // Paso 1: buscar tablas que contengan "facultad" en el nombre
    const tablas = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_name ILIKE '%facultad%';`
    );

    console.log('\nTablas relacionadas a "facultad":\n');
    tablas.rows.forEach((fila) => {
      console.log(`- ${fila.table_name}`);
    });

    // Paso 2: para cada tabla encontrada, mostrar sus columnas
    for (const fila of tablas.rows) {
      const columnas = await pool.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = $1
         ORDER BY ordinal_position;`,
        [fila.table_name]
      );
      console.log(`\nColumnas de ${fila.table_name}:`);
      columnas.rows.forEach((col) => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
  } catch (error) {
    console.error('Error al verificar columnas:', error);
  } finally {
    await pool.end();
  }
}

verificarColumnas();