import pool from '../src/infrastructure/database/db';

async function inspect() {
  const client = await pool.connect();
  try {
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    for (const table of tables) {
      console.log(`\n========================================`);
      console.log(`Table: ${table.table_name}`);
      console.log(`========================================`);
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
      });
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
  }
}

inspect();
