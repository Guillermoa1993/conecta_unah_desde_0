import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    // Conecta a Fabian (id 8) con Jose Carlos (id 13), ya en estado 'aceptada'
    await pool.query(
      `INSERT INTO tabla_grupo_2_perfilpumita
        (id_puma1, id_puma2, "Usuario_id_usuario", "Usuario_id_usuario1", estado)
       VALUES ($1, $2, $1, $2, 'aceptada')`,
      [8, 13]
    );
    console.log('✅ Conexión de prueba creada entre usuario 8 y usuario 13.');
  } catch (error) {
    console.error('❌ Error creando la conexión:', error);
  } finally {
    await pool.end();
  }
})();