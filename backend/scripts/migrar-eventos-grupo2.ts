import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    console.log('🔄 Iniciando migración de la tabla del Grupo 2...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tabla_grupo_2_inscripciones_evento (
        id_inscripcion SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
        id_evento INTEGER NOT NULL REFERENCES tabla_grupo_3_eventos(id) ON DELETE CASCADE,
        estado VARCHAR(50) NOT NULL DEFAULT 'INSCRITO',
        inscrito_at TIMESTAMP DEFAULT NOW(),
        cancelado_at TIMESTAMP,
        asistencia_entrada TIMESTAMP,
        asistencia_salida TIMESTAMP,
        latitud NUMERIC,
        longitud NUMERIC,
        estado_verificacion VARCHAR(50) DEFAULT 'Pendiente de verificación',
        UNIQUE (id_usuario, id_evento)
      );
    `);
    console.log('✅ Migración completada: tabla_grupo_2_inscripciones_evento creada (o ya existía).');
  } catch (error) {
    console.error('❌ Error migrando la tabla de Grupo 2:', error);
  } finally {
    await pool.end();
  }
})();
