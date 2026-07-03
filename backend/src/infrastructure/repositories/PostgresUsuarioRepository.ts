import { Pool } from 'pg';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { Usuario, UsuarioPublico } from '../../domain/entities/Usuario';

const SELECT_USUARIO = `
  SELECT u.id_usuario, u.nombre, u.correo, u.password,
         u.id_rol,    r.nombre  AS rol,
         u.id_estado, e.estado,
         u.id_carrera, c.nombre AS carrera,
         u.microsoft_id, u.otp_code, u.otp_expira
  FROM tabla_grupo_1_usuario u
  LEFT JOIN tabla_grupo_1_rol            r ON u.id_rol     = r.id_rol
  LEFT JOIN tabla_grupo_1_estado_usuario e ON u.id_estado  = e.id_estado
  LEFT JOIN tabla_grupo_1_carreras       c ON u.id_carrera = c.id_carrera
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

  async create(data: { nombre: string; correo: string; password: string; rol: string; carrera?: string }): Promise<Usuario> {
    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_1_usuario (nombre, correo, password, id_rol, id_estado, id_carrera)
       VALUES (
         $1, $2, $3,
         (SELECT id_rol     FROM tabla_grupo_1_rol            WHERE nombre = $4),
         (SELECT id_estado  FROM tabla_grupo_1_estado_usuario WHERE estado = 'ACTIVO'),
         (SELECT id_carrera FROM tabla_grupo_1_carreras        WHERE nombre = $5)
       ) RETURNING id_usuario`,
      [data.nombre, data.correo, data.password, data.rol, data.carrera ?? null],
    );
    return this.findById(rows[0].id_usuario) as Promise<Usuario>;
  }

  async update(id: number, data: Partial<Record<string, unknown>>): Promise<Usuario | null> {
    const allowed = ['nombre', 'correo', 'password', 'microsoft_id', 'otp_code', 'otp_expira'];
    const campos = Object.keys(data).filter((k) => allowed.includes(k));
    if (!campos.length) return this.findById(id);
    const sets = campos.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = campos.map((k) => data[k]);
    await this.pool.query(`UPDATE tabla_grupo_1_usuario SET ${sets} WHERE id_usuario = $1`, [id, ...values]);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM tabla_grupo_1_usuario WHERE id_usuario = $1', [id],
    );
    return (rowCount ?? 0) > 0;
  }
}
