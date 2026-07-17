import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const { rows } = await pool.query(`
      UPDATE tabla_grupo_1_usuario
      SET id_carrera = (
        SELECT id_carrera FROM tabla_grupo_1_carreras
        WHERE nombre = 'Licenciatura en Informática Administrativa'
      )
      WHERE correo = 'dzunigar@unah.hn'
      RETURNING id_usuario, nombre, correo, id_carrera;
    `);
    console.log('✅ Actualizado:', rows);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
})();