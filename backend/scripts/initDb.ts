import pool from '../src/infrastructure/database/db';
import fs from 'fs';
import path from 'path';

async function initDb() {
  console.log('\n Inicializando base de datos UNAH Conecta Pumas...\n');

  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const rawSql = fs.readFileSync(schemaPath, 'utf-8');

  // Eliminar líneas de comentarios y luego dividir por ;
  const cleanSql = rawSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`  Ejecutando ${statements.length} sentencias SQL...\n`);

  let ok = 0;
  let errors = 0;

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      const match = stmt.match(/CREATE\s+(?:TABLE|INDEX)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
      if (match) {
        console.log(`  OK  ${match[1]}`);
      }
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERR ${msg.slice(0, 80)}`);
      errors++;
    }
  }

  console.log(`\n  Resultado: ${ok} OK, ${errors} errores\n`);

  // Mostrar tablas existentes
  const { rows } = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `);
  console.log(`  Tablas en la BD (${rows.length} total):`);
  rows.forEach((r) => console.log(`    - ${r.table_name}`));

  await pool.end();
  console.log('\n  Listo.\n');
}

initDb().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
