import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    await pool.query(`
      INSERT INTO tabla_grupo_1_tipo_notificacion (nombre)
      VALUES
        ('SOLICITUD_PUMITA'),
        ('REACCION_PUMITA'),
        ('EVENTO_DISPONIBLE'),
        ('PUBLICACION_PUBLICADA'),
        ('PUBLICACION_RECHAZADA')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Tipos de notificación insertados (o ya existían).');
  } catch (error) {
    console.error('❌ Error insertando los tipos de notificación:', error);
  } finally {
    await pool.end();
  }
})();