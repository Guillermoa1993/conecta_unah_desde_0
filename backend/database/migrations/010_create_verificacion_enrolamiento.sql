CREATE TABLE IF NOT EXISTS tabla_grupo_1_verificacion_enrolamiento (
  id_usuario        INT PRIMARY KEY REFERENCES tabla_grupo_1_usuario(id_usuario) ON DELETE CASCADE,
  fecha_enrolamiento TIMESTAMP DEFAULT NOW()
);
