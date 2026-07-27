import { Pool } from 'pg';
import { PermisoSeguridadRepository } from '../../domain/repositories/PermisoSeguridadRepository';
import {
  PermisoSeguridad,
  CrearPermisoSeguridadDto,
  ActualizarPermisoSeguridadDto,
} from '../../domain/entities/PermisoSeguridad';

// NOTA: la tabla real tabla_grupo_4_permisos usa la columna "codigo"
// (no "nombre_permiso" como asumía la migración original 002). Se mapea
// aquí con un alias para no tener que renombrar el campo en toda la app
// (entidad, use-cases, frontend siguen usando "nombre_permiso").
const SELECT_PERMISO = `SELECT id_permiso, codigo AS nombre_permiso, modulo, descripcion FROM tabla_grupo_4_permisos`;

export class PostgresPermisoSeguridadRepository implements PermisoSeguridadRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(modulo?: string): Promise<PermisoSeguridad[]> {
    if (modulo) {
      const { rows } = await this.pool.query(
        `${SELECT_PERMISO} WHERE modulo = $1 ORDER BY codigo`,
        [modulo],
      );
      return rows;
    }
    const { rows } = await this.pool.query(`${SELECT_PERMISO} ORDER BY modulo, codigo`);
    return rows;
  }

  async findById(id: number): Promise<PermisoSeguridad | null> {
    const { rows } = await this.pool.query(`${SELECT_PERMISO} WHERE id_permiso = $1`, [id]);
    return rows[0] ?? null;
  }

  async create(data: CrearPermisoSeguridadDto): Promise<PermisoSeguridad> {
    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_4_permisos (codigo, modulo, descripcion)
       VALUES ($1, $2, $3) RETURNING id_permiso`,
      [data.nombre_permiso, data.modulo, data.descripcion ?? null],
    );
    return (await this.findById(rows[0].id_permiso)) as PermisoSeguridad;
  }

  async update(id: number, data: ActualizarPermisoSeguridadDto): Promise<PermisoSeguridad | null> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (data.nombre_permiso !== undefined) { campos.push(`codigo = $${idx++}`); valores.push(data.nombre_permiso); }
    if (data.modulo !== undefined)         { campos.push(`modulo = $${idx++}`); valores.push(data.modulo); }
    if (data.descripcion !== undefined)    { campos.push(`descripcion = $${idx++}`); valores.push(data.descripcion); }

    if (!campos.length) return this.findById(id);
    valores.push(id);
    await this.pool.query(`UPDATE tabla_grupo_4_permisos SET ${campos.join(', ')} WHERE id_permiso = $${idx}`, valores);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(`DELETE FROM tabla_grupo_4_permisos WHERE id_permiso = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }
}
