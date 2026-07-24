import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    // Te conecta a ti (id 6) con Fabian (id 8), ya en estado 'aceptada'
    await pool.query(
      `INSERT INTO tabla_grupo_2_perfilpumita
        (id_puma1, id_puma2, "Usuario_id_usuario", "Usuario_id_usuario1", estado)
       VALUES ($1, $2, $1, $2, 'aceptada')`,
      [6, 8]
    );
    console.log('✅ Conexión creada entre tú (usuario 6) y Fabian (usuario 8).');
  } catch (error) {
    console.error('❌ Error creando la conexión:', error);
  } finally {
    await pool.end();
  }
})();