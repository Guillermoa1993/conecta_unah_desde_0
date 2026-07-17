import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    const { rows: usuarioRows } = await pool.query(
      `SELECT id_usuario FROM tabla_grupo_1_usuario WHERE correo = $1`,
      ['dzunigar@unah.hn']
    );
    const idUsuario = usuarioRows[0]?.id_usuario;
    if (!idUsuario) throw new Error('No se encontró el usuario con ese correo.');

    const { rows } = await pool.query(
      `INSERT INTO tabla_grupo_1_perfil (id_usuario, id_centro_regional)
       VALUES (
         $1,
         (SELECT id_centro_regional FROM tabla_grupo_1_centro_regional WHERE codigo = 'CU')
       )
       RETURNING *;`,
      [idUsuario]
    );
    console.log('✅ Perfil creado:', rows);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
})();