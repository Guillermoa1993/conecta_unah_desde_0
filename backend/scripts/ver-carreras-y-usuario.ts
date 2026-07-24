import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    console.log('\n=== Columnas de tabla_grupo_1_carreras ===');
    const { rows: colsCarreras } = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tabla_grupo_1_carreras'
      ORDER BY ordinal_position
    `);
    console.table(colsCarreras);

    console.log('\n=== Datos actuales de tabla_grupo_1_carreras ===');
    const { rows: dataCarreras } = await pool.query(`SELECT * FROM tabla_grupo_1_carreras ORDER BY id_carrera`);
    console.table(dataCarreras);

    console.log('\n=== Columnas de tabla_grupo_1_usuario ===');
    const { rows: colsUsuario } = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tabla_grupo_1_usuario'
      ORDER BY ordinal_position
    `);
    console.table(colsUsuario);
  } catch (error) {
    console.error('❌ Error consultando:', error);
  } finally {
    await pool.end();
  }
})();