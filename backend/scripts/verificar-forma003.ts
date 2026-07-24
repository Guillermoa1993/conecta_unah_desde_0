// backend/scripts/verificar-forma003.ts
import pool from '../src/infrastructure/database/db';

async function main() {
  const existe = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'tabla_grupo_2_forma003_historial'
    );
  `);
  console.log('¿Existe la tabla?', existe.rows[0].exists);

  if (existe.rows[0].exists) {
    const columnas = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tabla_grupo_2_forma003_historial'
      ORDER BY ordinal_position;
    `);
    console.table(columnas.rows);
  }
}

main().then(() => process.exit(0)).catch(console.error);