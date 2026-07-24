import pool from '../src/infrastructure/database/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function initDb() {
  const client = await pool.connect();
  try {
    console.log('🔄 Conectando a la base de datos en Render.com...');
    const { rows } = await client.query('SELECT current_database(), current_user');
    console.log(`✅ Conectado a: ${rows[0].current_database} como ${rows[0].current_user}\n`);

    // Ver tablas existentes antes de iniciar
    const existentes = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    if (existentes.rows.length > 0) {
      console.log('📋 Tablas ya existentes:');
      existentes.rows.forEach((r) => console.log(`   • ${r.table_name}`));
      console.log('');
    }

    console.log('🔨 Ejecutando schema...\n');
    const raw = readFileSync(join(__dirname, '../database/schema.sql'), 'utf-8');

    const sql = raw
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let ok = 0;
    let skip = 0;
    for (const stmt of statements) {
      const label = stmt.slice(0, 60).replace(/\s+/g, ' ');
      try {
        await client.query(stmt);
        console.log(`   ✔ ${label}`);
        ok++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Ignorar errores de "ya existe"
        if (msg.includes('already exists') || msg.includes('ya existe')) {
          console.log(`   ⟳ (ya existe) ${label}`);
          skip++;
        } else {
          console.log(`   ✗ ERROR: ${msg}`);
          console.log(`     SQL: ${label}`);
          skip++;
        }
      }
    }

    const finales = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log(`\n📊 Tablas en la BD (${finales.rows.length} total):`);
    finales.rows.forEach((r) => console.log(`   ✔ ${r.table_name}`));

    console.log(`\n✅ Listo — ${ok} ejecutadas, ${skip} omitidas.`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error fatal:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

initDb();
