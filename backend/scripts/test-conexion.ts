import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function probarConexion() {
  console.log('🔎 Probando conexión a:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000, // no esperar eternamente si la red la bloquea
  });

  try {
    const inicio = Date.now();
    const { rows } = await pool.query('SELECT NOW() AS hora_servidor, version()');
    console.log('✅ Conexión exitosa en', Date.now() - inicio, 'ms');
    console.log('   Hora del servidor:', rows[0].hora_servidor);
    console.log('   Versión Postgres:', rows[0].version);

    // Si la conexión pasó, probamos una consulta real sobre una tabla nuestra
    // (Grupo_2) para confirmar que también tenemos permisos de lectura sobre
    // el esquema, no solo conexión al servidor.
    try {
      const tabla = await pool.query(
        'SELECT COUNT(*)::int AS total FROM tabla_grupo_2_solicitud_cambio_carrera'
      );
      console.log('✅ Lectura de tabla_grupo_2_solicitud_cambio_carrera OK. Filas:', tabla.rows[0].total);
    } catch (errTabla: any) {
      console.error('⚠️  Conectó al servidor pero falló la consulta a la tabla:', errTabla.message);
      console.error('   Código:', errTabla.code ?? '(sin código)');
      console.error('   (código 42501 = falta de permiso; 42P01 = la tabla no existe con ese nombre)');
    }
  } catch (err: any) {
    console.error('❌ Falló la conexión:', err.message);
    console.error('   Código:', err.code ?? '(sin código)');
  } finally {
    await pool.end();
    process.exit(0);
  }
}

probarConexion();