import pool from '../src/infrastructure/database/db';

const CORREO = 'dzunigar@unah.hn'; // cambia esto si tu correo es distinto

(async () => {
  try {
    const { rows: usuarioRows } = await pool.query(
      `SELECT id_usuario, nombre, correo FROM tabla_grupo_1_usuario WHERE correo = $1`,
      [CORREO]
    );

    if (usuarioRows.length === 0) {
      console.log(`❌ No se encontró ningún usuario con correo ${CORREO}`);
      process.exit(0);
    }

    const usuario = usuarioRows[0];
    console.log(`👤 Usuario encontrado: id_usuario=${usuario.id_usuario}, nombre=${usuario.nombre}`);

    const { rows: enrolRows } = await pool.query(
      `SELECT * FROM tabla_grupo_1_verificacion_enrolamiento WHERE id_usuario = $1`,
      [usuario.id_usuario]
    );

    if (enrolRows.length > 0) {
      console.log('✅ Ya estás enrolada. Fecha de enrolamiento:', enrolRows[0].fecha_enrolamiento);
    } else {
      console.log('⚠️ No estás enrolada todavía. Insertando registro...');
      await pool.query(
        `INSERT INTO tabla_grupo_1_verificacion_enrolamiento (id_usuario) VALUES ($1) ON CONFLICT DO NOTHING`,
        [usuario.id_usuario]
      );
      console.log('✅ Listo, ya quedaste enrolada.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
})();