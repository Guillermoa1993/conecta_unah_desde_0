import { Pool } from 'pg';
import { PermisoSeguridadRepository } from '../../domain/repositories/PermisoSeguridadRepository';
import {
  PermisoSeguridad,
  CrearPermisoSeguridadDto,
  ActualizarPermisoSeguridadDto,
} from '../../domain/entities/PermisoSeguridad';

export class PostgresPermisoSeguridadRepository implements PermisoSeguridadRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(modulo?: string): Promise<PermisoSeguridad[]> {
    if (modulo) {
      const { rows } = await this.pool.query(
        `SELECT * FROM tabla_grupo_4_permisos WHERE modulo = $1 ORDER BY nombre_permiso`,
        [modulo],
      );
      return rows;
    }
    const { rows } = await this.pool.query(`SELECT * FROM tabla_grupo_4_permisos ORDER BY modulo, nombre_permiso`);
    return rows;
  }

  async findById(id: number): Promise<PermisoSeguridad | null> {
    const { rows } = await this.pool.query(`SELECT * FROM tabla_grupo_4_permisos WHERE id_permiso = $1`, [id]);
    return rows[0] ?? null;
  }

  async create(data: CrearPermisoSeguridadDto): Promise<PermisoSeguridad> {
    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_4_permisos (nombre_permiso, modulo, descripcion)
       VALUES ($1, $2, $3) RETURNING *`,
      [data.nombre_permiso, data.modulo, data.descripcion ?? null],
    );
    return rows[0];
  }

  async update(id: number, data: ActualizarPermisoSeguridadDto): Promise<PermisoSeguridad | null> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (data.nombre_permiso !== undefined) { campos.push(`nombre_permiso = $${idx++}`); valores.push(data.nombre_permiso); }
    if (data.modulo !== undefined)         { campos.push(`modulo = $${idx++}`); valores.push(data.modulo); }
    if (data.descripcion !== undefined)    { campos.push(`descripcion = $${idx++}`); valores.push(data.descripcion); }

    if (!campos.length) return this.findById(id);
    valores.push(id);
    const { rows } = await this.pool.query(
      `UPDATE tabla_grupo_4_permisos SET ${campos.join(', ')} WHERE id_permiso = $${idx} RETURNING *`,
      valores,
    );
    return rows[0] ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(`DELETE FROM tabla_grupo_4_permisos WHERE id_permiso = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }
}
