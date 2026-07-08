import pool from '../src/infrastructure/database/db';
import bcrypt from 'bcryptjs';

async function setPasswords() {
  const client = await pool.connect();
  try {
    console.log('🔄 Generando hash de contraseña...');
    const hash = await bcrypt.hash('123456', 10);
    
    console.log('🔄 Actualizando contraseñas en la base de datos...');
    
    // Update Tutor
    await client.query(
      "UPDATE tabla_grupo_1_usuario SET password = $1 WHERE correo = 'tutor@unah.edu.hn'",
      [hash]
    );
    console.log('✅ Contraseña para tutor@unah.edu.hn establecida en "123456"');

    // Update VOAE
    await client.query(
      "UPDATE tabla_grupo_1_usuario SET password = $1 WHERE correo = 'voae@unah.hn'",
      [hash]
    );
    console.log('✅ Contraseña para voae@unah.hn establecida en "123456"');

    // Update Estudiante
    await client.query(
      "UPDATE tabla_grupo_1_usuario SET password = $1 WHERE correo = 'guillermo.ayestas@unah.hn'",
      [hash]
    );
    console.log('✅ Contraseña para guillermo.ayestas@unah.hn establecida en "123456"');

  } catch (err) {
    console.error('❌ Error al actualizar contraseñas:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

setPasswords();
