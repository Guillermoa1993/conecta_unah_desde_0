import { Pool } from 'pg';
import {
  UsuarioSeguridadRepository,
  FiltrosUsuarioSeguridad,
} from '../../domain/repositories/UsuarioSeguridadRepository';
import {
  UsuarioSeguridad,
  UsuarioSeguridadPublico,
  CrearUsuarioSeguridadDto,
  ActualizarUsuarioSeguridadDto,
} from '../../domain/entities/UsuarioSeguridad';

// Cada fila trae sus roles y permisos directos ya agregados como JSON,
// usando subconsultas correlacionadas (más simples que un LEFT JOIN doble
// con GROUP BY cuando hay dos relaciones 1:N distintas que agregar).
const SELECT_USUARIO = `
  SELECT
    u.id_usuario, u.nombre, u.apellido, u.correo, u.telefono,
    u.estado, u.motivo_inhabilitacion, u.modulos_acceso,
    COALESCE((
      SELECT json_agg(json_build_object(
               'id_rol', r.id_rol, 'nombre_rol', r.nombre_rol, 'codigo_rol', r.codigo_rol
             ) ORDER BY r.nombre_rol)
      FROM tabla_grupo_4_usuarios_roles ur
      JOIN tabla_grupo_4_roles r ON r.id_rol = ur.id_rol
      WHERE ur.id_usuario = u.id_usuario
    ), '[]') AS roles,
    COALESCE((
      SELECT json_agg(json_build_object(
               'id_permiso', p.id_permiso, 'nombre_permiso', p.nombre_permiso, 'modulo', p.modulo
             ) ORDER BY p.nombre_permiso)
      FROM tabla_grupo_4_usuarios_permisos up
      JOIN tabla_grupo_4_permisos p ON p.id_permiso = up.id_permiso
      WHERE up.id_usuario = u.id_usuario
    ), '[]') AS permisos_directos
  FROM tabla_grupo_4_usuarios u
`;

export class PostgresUsuarioSeguridadRepository implements UsuarioSeguridadRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(filtros?: FiltrosUsuarioSeguridad): Promise<UsuarioSeguridadPublico[]> {
    const condiciones: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (filtros?.busqueda) {
      condiciones.push(`(u.nombre ILIKE $${idx} OR u.apellido ILIKE $${idx} OR u.correo ILIKE $${idx})`);
      valores.push(`%${filtros.busqueda}%`);
      idx++;
    }
    if (filtros?.estado !== undefined) {
      condiciones.push(`u.estado = $${idx}`);
      valores.push(filtros.estado);
      idx++;
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const { rows } = await this.pool.query(`${SELECT_USUARIO} ${where} ORDER BY u.nombre`, valores);
    return rows;
  }

  async findById(id: number): Promise<UsuarioSeguridadPublico | null> {
    const { rows } = await this.pool.query(`${SELECT_USUARIO} WHERE u.id_usuario = $1`, [id]);
    return rows[0] ?? null;
  }

  async findByCorreo(correo: string): Promise<UsuarioSeguridad | null> {
    const { rows } = await this.pool.query(
      `SELECT id_usuario, nombre, apellido, correo, contrasena_hash, telefono,
              estado, motivo_inhabilitacion, modulos_acceso
         FROM tabla_grupo_4_usuarios WHERE correo = $1`,
      [correo],
    );
    return rows[0] ?? null;
  }

  async create(data: CrearUsuarioSeguridadDto, contrasenaHash: string): Promise<UsuarioSeguridadPublico> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO tabla_grupo_4_usuarios (nombre, apellido, correo, contrasena_hash, telefono, modulos_acceso)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id_usuario`,
        [
          data.nombre, data.apellido ?? null, data.correo, contrasenaHash,
          data.telefono ?? null, data.modulos_acceso ?? [],
        ],
      );
      const idUsuario = rows[0].id_usuario;

      for (const idRol of data.roles ?? []) {
        await client.query(
          `INSERT INTO tabla_grupo_4_usuarios_roles (id_usuario, id_rol) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [idUsuario, idRol],
        );
      }
      for (const idPermiso of data.permisos_directos ?? []) {
        await client.query(
          `INSERT INTO tabla_grupo_4_usuarios_permisos (id_usuario, id_permiso) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [idUsuario, idPermiso],
        );
      }

      await client.query('COMMIT');
      return (await this.findById(idUsuario)) as UsuarioSeguridadPublico;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id: number, data: ActualizarUsuarioSeguridadDto): Promise<UsuarioSeguridadPublico | null> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (data.nombre !== undefined)         { campos.push(`nombre = $${idx++}`); valores.push(data.nombre); }
    if (data.apellido !== undefined)       { campos.push(`apellido = $${idx++}`); valores.push(data.apellido); }
    if (data.telefono !== undefined)       { campos.push(`telefono = $${idx++}`); valores.push(data.telefono); }
    if (data.modulos_acceso !== undefined) { campos.push(`modulos_acceso = $${idx++}`); valores.push(data.modulos_acceso); }

    if (campos.length) {
      valores.push(id);
      await this.pool.query(
        `UPDATE tabla_grupo_4_usuarios SET ${campos.join(', ')} WHERE id_usuario = $${idx}`,
        valores,
      );
    }
    return this.findById(id);
  }

  async inhabilitar(id: number, motivo: string): Promise<UsuarioSeguridadPublico | null> {
    await this.pool.query(
      `UPDATE tabla_grupo_4_usuarios SET estado = 0, motivo_inhabilitacion = $2 WHERE id_usuario = $1`,
      [id, motivo],
    );
    return this.findById(id);
  }

  async habilitar(id: number): Promise<UsuarioSeguridadPublico | null> {
    await this.pool.query(
      `UPDATE tabla_grupo_4_usuarios SET estado = 1, motivo_inhabilitacion = NULL WHERE id_usuario = $1`,
      [id],
    );
    return this.findById(id);
  }

  async asignarRol(idUsuario: number, idRol: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO tabla_grupo_4_usuarios_roles (id_usuario, id_rol) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [idUsuario, idRol],
    );
  }

  async revocarRol(idUsuario: number, idRol: number): Promise<void> {
    await this.pool.query(
      `DELETE FROM tabla_grupo_4_usuarios_roles WHERE id_usuario = $1 AND id_rol = $2`,
      [idUsuario, idRol],
    );
  }

  async asignarPermisoDirecto(idUsuario: number, idPermiso: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO tabla_grupo_4_usuarios_permisos (id_usuario, id_permiso) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [idUsuario, idPermiso],
    );
  }

  async revocarPermisoDirecto(idUsuario: number, idPermiso: number): Promise<void> {
    await this.pool.query(
      `DELETE FROM tabla_grupo_4_usuarios_permisos WHERE id_usuario = $1 AND id_permiso = $2`,
      [idUsuario, idPermiso],
    );
  }
}
