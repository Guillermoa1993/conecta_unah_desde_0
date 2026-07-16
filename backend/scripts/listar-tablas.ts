import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function listarTablas() {
  const { rows } = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  console.log(`Total de tablas encontradas: ${rows.length}\n`);
  rows.forEach((r, i) => console.log(`${i + 1}. ${r.table_name}`));

  console.log('\n--- Verificación puntual de las 4 tablas en duda ---');
  const nombresBuscados = [
    'tabla_grupo_2_fechas_evento',
    'tabla_grupo_2_estado_evento',
    'tabla_grupo_2_inscripciones_evento',
    'tabla_grupo_2_estado',
  ];

  const encontradas = rows.map((r) => r.table_name);
  nombresBuscados.forEach((nombre) => {
    const existe = encontradas.includes(nombre);
    console.log(`${nombre}: ${existe ? 'SÍ EXISTE' : 'NO EXISTE'}`);
  });

  await pool.end();
}

listarTablas().catch((err) => {
  console.error('Error al listar tablas:', err);
  process.exit(1);
});