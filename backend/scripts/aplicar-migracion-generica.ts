import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function aplicarMigracion() {
  const nombreArchivo = process.argv[2];

  if (!nombreArchivo) {
    console.error('❌ Debes indicar el nombre del archivo .sql. Ejemplo:');
    console.error('   npx ts-node scripts/aplicar-migracion-generica.ts 005_create_reaccion_comentario.sql');
    process.exit(1);
  }

  const rutaCompleta = path.join(__dirname, '..', 'database', 'migrations', nombreArchivo);

  if (!fs.existsSync(rutaCompleta)) {
    console.error(`❌ No se encontró el archivo en: ${rutaCompleta}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(rutaCompleta, 'utf-8');

  try {
    console.log(`\nAplicando migración: ${nombreArchivo}...\n`);
    await pool.query(sql);
    console.log('✅ Migración aplicada exitosamente.');
  } catch (error) {
    console.error('❌ Error aplicando la migración:', error);
  } finally {
    await pool.end();
  }
}

aplicarMigracion();