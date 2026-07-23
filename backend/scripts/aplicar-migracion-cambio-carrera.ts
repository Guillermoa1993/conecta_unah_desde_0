import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tabla_grupo_2_solicitud_cambio_carrera (
        id_solicitud SERIAL PRIMARY KEY,
        id_usuario INT NOT NULL REFERENCES tabla_grupo_1_usuario(id_usuario),
        id_carrera_actual INT REFERENCES tabla_grupo_1_carreras(id_carrera),
        id_carrera_solicitada INT NOT NULL REFERENCES tabla_grupo_1_carreras(id_carrera),
        id_centro_regional_solicitado INT REFERENCES tabla_grupo_1_centro_regional(id_centro_regional),
        motivo TEXT NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
          CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
        comentario_revision TEXT,
        id_revisor INT REFERENCES tabla_grupo_1_usuario(id_usuario),
        fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
        fecha_revision TIMESTAMP
      );
    `);
    console.log('✅ Migración completada: tabla_grupo_2_solicitud_cambio_carrera creada (o ya existía).');
  } catch (error) {
    console.error('❌ Error migrando la tabla:', error);
  } finally {
    await pool.end();
  }
})();