import { Pool } from 'pg';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { Usuario, UsuarioPublico, RolUsuario } from '../../domain/entities/Usuario';

export class PostgresUsuarioRepository implements UsuarioRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async findByCorreo(correo: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    return rows[0] ?? null;
  }

  async findAll(filtros?: { rol?: RolUsuario; estado?: string }): Promise<UsuarioPublico[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filtros?.rol) { conditions.push(`rol = $${idx++}`); values.push(filtros.rol); }
    if (filtros?.estado) { conditions.push(`estado = $${idx++}`); values.push(filtros.estado); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await this.pool.query(
      `SELECT id, nombre, correo, rol, estado, numero_cuenta, carrera, centro_regional, telefono, foto_url, created_at FROM usuarios ${where} ORDER BY nombre`,
      values,
    );
    return rows;
  }

  async create(data: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>): Promise<Usuario> {
    const { rows } = await this.pool.query(
      `INSERT INTO usuarios (nombre, correo, contrasena_hash, rol, estado, numero_cuenta, carrera, centro_regional, telefono, foto_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [data.nombre, data.correo, data.contrasena_hash, data.rol, data.estado,
       data.numero_cuenta ?? null, data.carrera ?? null, data.centro_regional ?? null,
       data.telefono ?? null, data.foto_url ?? null],
    );
    return rows[0];
  }

  async update(id: string, data: Partial<Usuario>): Promise<Usuario | null> {
    const campos = Object.keys(data).filter((k) => k !== 'id');
    if (!campos.length) return this.findById(id);

    const sets = campos.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = campos.map((k) => (data as Record<string, unknown>)[k]);

    const { rows } = await this.pool.query(
      `UPDATE usuarios SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
}
