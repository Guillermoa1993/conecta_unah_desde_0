import { Pool } from 'pg';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { Usuario, UsuarioPublico } from '../../domain/entities/Usuario';

const SELECT_USUARIO = `
  SELECT u.id_usuario, u.nombre, u.correo, u.password,
         u.id_rol,    r.nombre  AS rol,
         u.id_estado, e.estado,
         u.id_carrera, c.nombre AS carrera, f.nombre AS facultad,
         u.created_at,
         u.microsoft_id, u.otp_code, u.otp_expira,
         u.permite_reacciones_perfil,
         p.telefono, p.numero_cuenta, p.id_centro_regional,
         cr.nombre AS centro_regional,
         p.genero, p.biografia, p.foto_url, p.forma003_base64,
         p.numero_empleado, p.id_departamento,
         d.nombre AS departamento
  FROM tabla_grupo_1_usuario u
  LEFT JOIN tabla_grupo_1_rol            r  ON u.id_rol     = r.id_rol
  LEFT JOIN tabla_grupo_1_estado_usuario e  ON u.id_estado  = e.id_estado
  LEFT JOIN tabla_grupo_1_carreras       c  ON u.id_carrera = c.id_carrera
  LEFT JOIN tabla_grupo_1_facultad       f  ON c.id_facultad = f.id_facultad
  LEFT JOIN tabla_grupo_1_perfil         p  ON u.id_usuario = p.id_usuario
  LEFT JOIN tabla_grupo_1_centro_regional cr ON p.id_centro_regional = cr.id_centro_regional
  LEFT JOIN tabla_grupo_1_departamento    d  ON p.id_departamento = d.id_departamento
`;

export class PostgresUsuarioRepository implements UsuarioRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: number): Promise<Usuario | null> {
    const { rows } = await this.pool.query(`${SELECT_USUARIO} WHERE u.id_usuario = $1`, [id]);
    return rows[0] ?? null;
  }

  async findByCorreo(correo: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query(`${SELECT_USUARIO} WHERE u.correo = $1`, [correo]);
    return rows[0] ?? null;
  }

  async findByMicrosoftId(microsoftId: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query(`${SELECT_USUARIO} WHERE u.microsoft_id = $1`, [microsoftId]);
    return rows[0] ?? null;
  }

  async findAll(filtros?: { rol?: string; estado?: string }): Promise<UsuarioPublico[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (filtros?.rol)    { conditions.push(`r.nombre = $${idx++}`); values.push(filtros.rol); }
    if (filtros?.estado) { conditions.push(`e.estado = $${idx++}`); values.push(filtros.estado); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await this.pool.query(`${SELECT_USUARIO} ${where} ORDER BY u.nombre`, values);
    return rows;
  }

  async create(data: {
    nombre: string; correo: string; password: string; rol: string; carrera?: string;
    telefono?: string; numero_cuenta?: string; centro_regional?: string;
    genero?: string; biografia?: string; foto_url?: string; forma003_base64?: string;
    numero_empleado?: string; departamento?: string;
  }): Promise<Usuario> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const usuarioResult = await client.query(
        `INSERT INTO tabla_grupo_1_usuario (nombre, correo, password, id_rol, id_estado, id_carrera)
         VALUES (
           $1, $2, $3,
           (SELECT id_rol     FROM tabla_grupo_1_rol            WHERE nombre = $4),
           (SELECT id_estado  FROM tabla_grupo_1_estado_usuario WHERE estado = 'ACTIVO'),
           (SELECT id_carrera FROM tabla_grupo_1_carreras        WHERE nombre = $5)
         ) RETURNING id_usuario`,
        [data.nombre, data.correo, data.password, data.rol, data.carrera ?? null],
      );
      const idUsuario = usuarioResult.rows[0].id_usuario;

      await client.query(
        `INSERT INTO tabla_grupo_1_perfil
           (id_usuario, telefono, numero_cuenta, id_centro_regional, genero, biografia,
            foto_url, forma003_base64, numero_empleado, id_departamento)
         VALUES (
           $1, $2, $3,
           (SELECT id_centro_regional FROM tabla_grupo_1_centro_regional WHERE codigo = $4),
           $5, $6, $7, $8, $9,
           (SELECT id_departamento FROM tabla_grupo_1_departamento WHERE nombre = $10)
         )`,
        [idUsuario, data.telefono ?? null, data.numero_cuenta ?? null, data.centro_regional ?? null,
         data.genero ?? null, data.biografia ?? null, data.foto_url ?? null, data.forma003_base64 ?? null,
         data.numero_empleado ?? null, data.departamento ?? null],
      );

      await client.query('COMMIT');
      return this.findById(idUsuario) as Promise<Usuario>;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id: number, data: Partial<Record<string, unknown>>): Promise<Usuario | null> {
    const allowed = ['nombre', 'correo', 'password', 'microsoft_id', 'otp_code', 'otp_expira'];
    const campos = Object.keys(data).filter((k) => allowed.includes(k));
    if (campos.length) {
      const sets = campos.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const values = campos.map((k) => data[k]);
      await this.pool.query(`UPDATE tabla_grupo_1_usuario SET ${sets} WHERE id_usuario = $1`, [id, ...values]);
    }
    return this.findById(id);
  }

  async actualizarPerfil(id: number, data: {
  telefono?: string; genero?: string; biografia?: string; foto_url?: string;
}): Promise<Usuario | null> {
  const campos = (['telefono', 'genero', 'biografia', 'foto_url'] as const).filter(
    (k) => data[k] !== undefined
  );
  if (campos.length === 0) return this.findById(id);

  const sets = campos.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = campos.map((k) => data[k]);

  await this.pool.query(
    `INSERT INTO tabla_grupo_1_perfil (id_usuario, ${campos.join(', ')})
     VALUES ($1, ${campos.map((_, i) => `$${i + 2}`).join(', ')})
     ON CONFLICT (id_usuario) DO UPDATE SET ${sets}`,
    [id, ...values],
  );

  return this.findById(id);
}

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM tabla_grupo_1_usuario WHERE id_usuario = $1', [id],
    );
    return (rowCount ?? 0) > 0;
  }
}
