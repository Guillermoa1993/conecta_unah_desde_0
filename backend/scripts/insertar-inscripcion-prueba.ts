import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function insertar() {
  const estudianteId = 6; // tu usuario
  const eventoId = 8;     // "Prueba 1.0" - cámbialo si prefieres otro

  const { rows } = await pool.query(
    `INSERT INTO tabla_grupo_3_inscripcion (estudiante_id, evento_id, estado)
     VALUES ($1, $2, 'ASISTIDO') RETURNING *`,
    [estudianteId, eventoId]
  );

  console.log('Inscripción de prueba creada:');
  console.table(rows);

  await pool.end();
}

insertar().catch((err) => {
  console.error('Error al insertar:', err);
  process.exit(1);
});