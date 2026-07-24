import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function verificar() {
  console.log('--- Eventos en tabla_grupo_3_eventos ---');
  const eventos = await pool.query(
    `SELECT id, titulo, estado, fecha_inicio, duracion_horas
     FROM tabla_grupo_3_eventos
     ORDER BY fecha_inicio DESC
     LIMIT 20`
  );
  console.log(`Total encontrados: ${eventos.rowCount}`);
  console.table(eventos.rows);

  console.log('\n--- Inscripciones en tabla_grupo_3_inscripcion ---');
  const inscripciones = await pool.query(
    `SELECT id, estudiante_id, evento_id, estado
     FROM tabla_grupo_3_inscripcion
     ORDER BY id DESC
     LIMIT 20`
  );
  console.log(`Total encontrados: ${inscripciones.rowCount}`);
  console.table(inscripciones.rows);

  await pool.end();
}

verificar().catch((err) => {
  console.error('Error al verificar:', err);
  process.exit(1);
});