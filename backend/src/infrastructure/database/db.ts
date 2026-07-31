import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Se resuelve la ruta del .env de forma explícita, relativa a este archivo,
// en vez de confiar en el directorio de trabajo (process.cwd()). En Windows,
// cuando la ruta del proyecto tiene espacios o paréntesis (ej. "Nueva carpeta (8)"),
// el mecanismo de --respawn de ts-node-dev puede lanzar el proceso hijo con un
// cwd distinto al esperado, y dotenv.config() sin "path" no encuentra el .env
// aunque el archivo exista y esté bien escrito.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// En producción Docker inyecta DATABASE_URL directamente como variable de entorno.
// dotenv.config() carga el .env en desarrollo local.

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida. Verifica el docker-compose.yml o el archivo .env');
  process.exit(1);
}

// La base de datos siempre es Render.com (tanto en dev como en producción,
// no hay contenedor local de Postgres), y Render exige SSL siempre. Antes
// el SSL solo se activaba si NODE_ENV === 'production', pero backend-dev
// no define NODE_ENV, así que la conexión fallaba con "SSL/TLS required".
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => {
  console.log('✅ Conexión a PostgreSQL establecida correctamente');
});

pool.on('error', (err) => {
  console.error('❌ Error en el pool de PostgreSQL:', err.message);
});

export default pool;