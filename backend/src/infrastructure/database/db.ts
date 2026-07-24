import { Pool } from 'pg';

// En producción Docker inyecta DATABASE_URL directamente como variable de entorno.
// dotenv.config() NO es necesario aquí — las variables ya están disponibles
// a través de process.env gracias al docker-compose.yml environment section.

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