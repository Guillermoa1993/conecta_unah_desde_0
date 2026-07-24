import { Pool } from 'pg';
import { RolSeguridadRepository } from '../../domain/repositories/RolSeguridadRepository';
import {
  RolSeguridad,
  RolSeguridadConPermisos,
  CrearRolSeguridadDto,
  ActualizarRolSeguridadDto,
} from '../../domain/entities/RolSeguridad';

const SELECT_ROL = `
  SELECT
    r.id_rol, r.nombre_rol, r.codigo_rol, r.descripcion,
    COALESCE((
      SELECT json_agg(json_build_object(
               'id_permiso', p.id_permiso, 'nombre_permiso', p.nombre_permiso, 'modulo', p.modulo
             ) ORDER BY p.nombre_permiso)
      FROM tabla_grupo_4_roles_permisos rp
      JOIN tabla_grupo_4_permisos p ON p.id_permiso = rp.id_permiso
      WHERE rp.id_rol = r.id_rol
    ), '[]') AS permisos
  FROM tabla_grupo_4_roles r
`;

export class PostgresRolSeguridadRepository implements RolSeguridadRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<RolSeguridadConPermisos[]> {
    const { rows } = await this.pool.query(`${SELECT_ROL} ORDER BY r.nombre_rol`);
    return rows;
  }

  async findById(id: number): Promise<RolSeguridadConPermisos | null> {
    const { rows } = await this.pool.query(`${SELECT_ROL} WHERE r.id_rol = $1`, [id]);
    return rows[0] ?? null;
  }

  async findByCodigo(codigo: string): Promise<RolSeguridad | null> {
    const { rows } = await this.pool.query(
      `SELECT id_rol, nombre_rol, codigo_rol, descripcion FROM tabla_grupo_4_roles WHERE codigo_rol = $1`,
      [codigo],
    );
    return rows[0] ?? null;
  }

  async create(data: CrearRolSeguridadDto): Promise<RolSeguridadConPermisos> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO tabla_grupo_4_roles (nombre_rol, codigo_rol, descripcion)
         VALUES ($1, $2, $3) RETURNING id_rol`,
        [data.nombre_rol, data.codigo_rol, data.descripcion ?? null],
      );
      const idRol = rows[0].id_rol;

      for (const idPermiso of data.permisos ?? []) {
        await client.query(
          `INSERT INTO tabla_grupo_4_roles_permisos (id_rol, id_permiso) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [idRol, idPermiso],
        );
      }

      await client.query('COMMIT');
      return (await this.findById(idRol)) as RolSeguridadConPermisos;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id: number, data: ActualizarRolSeguridadDto): Promise<RolSeguridadConPermisos | null> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (data.nombre_rol !== undefined)  { campos.push(`nombre_rol = $${idx++}`); valores.push(data.nombre_rol); }
    if (data.codigo_rol !== undefined)  { campos.push(`codigo_rol = $${idx++}`); valores.push(data.codigo_rol); }
    if (data.descripcion !== undefined) { campos.push(`descripcion = $${idx++}`); valores.push(data.descripcion); }

    if (campos.length) {
      valores.push(id);
      await this.pool.query(`UPDATE tabla_grupo_4_roles SET ${campos.join(', ')} WHERE id_rol = $${idx}`, valores);
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(`DELETE FROM tabla_grupo_4_roles WHERE id_rol = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async asignarPermiso(idRol: number, idPermiso: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO tabla_grupo_4_roles_permisos (id_rol, id_permiso) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [idRol, idPermiso],
    );
  }

  async revocarPermiso(idRol: number, idPermiso: number): Promise<void> {
    await this.pool.query(
      `DELETE FROM tabla_grupo_4_roles_permisos WHERE id_rol = $1 AND id_permiso = $2`,
      [idRol, idPermiso],
    );
  }

  async contarUsuariosAsignados(idRol: number): Promise<number> {
    const { rows } = await this.pool.query(
      `SELECT COUNT(*)::int AS total FROM tabla_grupo_4_usuarios_roles WHERE id_rol = $1`,
      [idRol],
    );
    return rows[0].total;
  }
}
