import { Pool } from 'pg';
import { RolSeguridadRepository } from '../../domain/repositories/RolSeguridadRepository';
import {
  RolSeguridad,
  RolSeguridadConPermisos,
  CrearRolSeguridadDto,
  ActualizarRolSeguridadDto,
} from '../../domain/entities/RolSeguridad';

// NOTA: apunta a tabla_grupo_1_rol (la tabla real ya usada por el login de
// toda la aplicación). La matriz de permisos por rol vive en
// tabla_grupo_4_rol_permiso, tabla puente que YA EXISTE en la base real de
// Render (creada manualmente, no está en ningún archivo de migración) y
// conecta tabla_grupo_1_rol(id_rol) con tabla_grupo_4_permisos(id_permiso).

const SELECT_ROL = `
  SELECT
    r.id_rol,
    r.nombre AS nombre_rol,
    lower(r.nombre) AS codigo_rol,
    NULL::varchar AS descripcion,
    COALESCE(
      json_agg(
        json_build_object(
          'id_permiso', p.id_permiso,
          'nombre_permiso', p.codigo,
          'modulo', p.modulo
        )
      ) FILTER (WHERE p.id_permiso IS NOT NULL),
      '[]'
    ) AS permisos
  FROM tabla_grupo_1_rol r
  LEFT JOIN tabla_grupo_4_rol_permiso rp ON rp.id_rol = r.id_rol
  LEFT JOIN tabla_grupo_4_permisos p ON p.id_permiso = rp.id_permiso
`;

const GROUP_BY_ROL = ' GROUP BY r.id_rol, r.nombre';

export class PostgresRolSeguridadRepository implements RolSeguridadRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<RolSeguridadConPermisos[]> {
    const { rows } = await this.pool.query(`${SELECT_ROL}${GROUP_BY_ROL} ORDER BY r.nombre`);
    return rows;
  }

  async findById(id: number): Promise<RolSeguridadConPermisos | null> {
    const { rows } = await this.pool.query(
      `${SELECT_ROL} WHERE r.id_rol = $1${GROUP_BY_ROL}`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByCodigo(codigo: string): Promise<RolSeguridad | null> {
    const { rows } = await this.pool.query(
      `SELECT id_rol, nombre AS nombre_rol, lower(nombre) AS codigo_rol, NULL::varchar AS descripcion
         FROM tabla_grupo_1_rol WHERE lower(nombre) = $1`,
      [codigo.toLowerCase()],
    );
    return rows[0] ?? null;
  }

  async create(data: CrearRolSeguridadDto): Promise<RolSeguridadConPermisos> {
    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_1_rol (nombre) VALUES ($1) RETURNING id_rol`,
      [data.nombre_rol.toUpperCase()],
    );
    return (await this.findById(rows[0].id_rol)) as RolSeguridadConPermisos;
  }

  async update(id: number, data: ActualizarRolSeguridadDto): Promise<RolSeguridadConPermisos | null> {
    // codigo_rol/descripcion no existen como columnas: se ignoran si llegan.
    if (data.nombre_rol !== undefined && data.nombre_rol.trim()) {
      await this.pool.query(`UPDATE tabla_grupo_1_rol SET nombre = $1 WHERE id_rol = $2`, [
        data.nombre_rol.toUpperCase(),
        id,
      ]);
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(`DELETE FROM tabla_grupo_1_rol WHERE id_rol = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async asignarPermiso(idRol: number, idPermiso: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO tabla_grupo_4_rol_permiso (id_rol, id_permiso) VALUES ($1, $2)
       ON CONFLICT (id_rol, id_permiso) DO NOTHING`,
      [idRol, idPermiso],
    );
  }

  async revocarPermiso(idRol: number, idPermiso: number): Promise<void> {
    await this.pool.query(
      `DELETE FROM tabla_grupo_4_rol_permiso WHERE id_rol = $1 AND id_permiso = $2`,
      [idRol, idPermiso],
    );
  }

  async contarUsuariosAsignados(idRol: number): Promise<number> {
    const { rows } = await this.pool.query(
      `SELECT COUNT(*)::int AS total FROM tabla_grupo_1_usuario WHERE id_rol = $1`,
      [idRol],
    );
    return rows[0].total;
  }
}