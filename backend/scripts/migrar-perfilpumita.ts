import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    await pool.query(`
      ALTER TABLE tabla_grupo_2_perfilpumita
        ADD COLUMN IF NOT EXISTS id_conexion SERIAL UNIQUE,
        ADD COLUMN IF NOT EXISTS id_puma1 INTEGER,
        ADD COLUMN IF NOT EXISTS id_puma2 INTEGER,
        ADD COLUMN IF NOT EXISTS "Usuario_id_usuario" INTEGER REFERENCES tabla_grupo_1_usuario(id_usuario),
        ADD COLUMN IF NOT EXISTS "Usuario_id_usuario1" INTEGER REFERENCES tabla_grupo_1_usuario(id_usuario),
        ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente'
          CHECK (estado IN ('pendiente', 'aceptada', 'bloqueada')),
        ADD COLUMN IF NOT EXISTS fecha_conexion TIMESTAMP DEFAULT NOW();
    `);
    console.log('✅ Migración completada: columnas de conexión agregadas.');
  } catch (error) {
    console.error('❌ Error migrando la tabla:', error);
  } finally {
    await pool.end();
  }
})();