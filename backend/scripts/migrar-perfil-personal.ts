import pool from '../src/infrastructure/database/db';

(async () => {
  try {
    await pool.query(`
      ALTER TABLE tabla_grupo_1_carreras
        ADD COLUMN IF NOT EXISTS facultad VARCHAR(150);
    `);

    await pool.query(`
      ALTER TABLE tabla_grupo_1_usuario
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);

    // Facultad de Ingeniería
    await pool.query(`
      UPDATE tabla_grupo_1_carreras SET facultad = 'Facultad de Ingeniería'
      WHERE nombre IN (
        'Ingeniería en Sistemas', 'Ingeniería Civil', 'Ingeniería Industrial',
        'Ingeniería Química', 'Ingeniería Eléctrica', 'Ingeniería Mecánica'
      );
    `);

    // Facultad de Ciencias Económicas, Administrativas y Contables
    await pool.query(`
      UPDATE tabla_grupo_1_carreras SET facultad = 'Facultad de Ciencias Económicas, Administrativas y Contables'
      WHERE nombre IN (
        'Licenciatura en Informática Administrativa',
        'Licenciatura en Administración de Empresas', 'Administración de Empresas',
        'Licenciatura en Contaduría Pública', 'Contaduría Pública',
        'Licenciatura en Economía'
      );
    `);

    // Facultad de Ciencias Sociales
    await pool.query(`
      UPDATE tabla_grupo_1_carreras SET facultad = 'Facultad de Ciencias Sociales'
      WHERE nombre IN (
        'Licenciatura en Psicología', 'Psicología',
        'Licenciatura en Pedagogía',
        'Licenciatura en Periodismo', 'Comunicación Social',
        'Licenciatura en Trabajo Social', 'Licenciatura en Sociología',
        'Licenciatura en Historia', 'Licenciatura en Antropología'
      );
    `);

    // Facultad de Ciencias Jurídicas
    await pool.query(`
      UPDATE tabla_grupo_1_carreras SET facultad = 'Facultad de Ciencias Jurídicas'
      WHERE nombre IN ('Licenciatura en Derecho', 'Derecho');
    `);

    // Facultad de Ciencias Médicas
    await pool.query(`
      UPDATE tabla_grupo_1_carreras SET facultad = 'Facultad de Ciencias Médicas'
      WHERE nombre IN (
        'Doctorado en Medicina y Cirugía', 'Medicina',
        'Licenciatura en Enfermería'
      );
    `);

    // Facultad de Ciencias
    await pool.query(`
      UPDATE tabla_grupo_1_carreras SET facultad = 'Facultad de Ciencias'
      WHERE nombre IN (
        'Licenciatura en Microbiología', 'Licenciatura en Nutrición',
        'Licenciatura en Química y Farmacia', 'Licenciatura en Odontología',
        'Matemáticas'
      );
    `);

    // Facultad de Humanidades y Artes
    await pool.query(`
      UPDATE tabla_grupo_1_carreras SET facultad = 'Facultad de Humanidades y Artes'
      WHERE nombre IN (
        'Licenciatura en Lenguas Extranjeras', 'Licenciatura en Letras',
        'Licenciatura en Filosofía', 'Licenciatura en Música',
        'Licenciatura en Arquitectura'
      );
    `);

    const { rows } = await pool.query(`SELECT id_carrera, nombre, facultad FROM tabla_grupo_1_carreras ORDER BY id_carrera`);
    console.log('✅ Migración completada. Resultado:');
    console.table(rows);
  } catch (error) {
    console.error('❌ Error migrando la tabla:', error);
  } finally {
    await pool.end();
  }
})();