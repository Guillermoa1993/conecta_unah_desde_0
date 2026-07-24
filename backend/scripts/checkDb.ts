import pool from '../src/infrastructure/database/db';

async function check() {
  const { rows } = await pool.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_name = 'notificaciones'
     ORDER BY ordinal_position`
  );
  console.log('Columnas de notificaciones:');
  rows.forEach((r) => console.log(' ', r.column_name, '-', r.data_type));
  process.exit(0);
}

check().catch((e) => { console.error(e); process.exit(1); });
