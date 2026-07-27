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

// NOTA IMPORTANTE (ajuste post-integración):
// Este módulo ahora lee/escribe directamente sobre las tablas REALES del
// Grupo 1 (tabla_grupo_1_usuario, tabla_grupo_1_rol, tabla_grupo_1_estado_usuario),
// que ya existen en la base de datos de Render. Antes apuntaba a un esquema
// paralelo (tabla_grupo_4_*) que nunca se migró a la base real.
//
// Diferencias importantes frente al esquema anterior (grupo 4):
//   - Un usuario tiene EXACTAMENTE UN rol (columna id_rol NOT NULL), no varios.
//   - No existen columnas apellido/telefono/modulos_acceso/motivo_inhabilitacion
//     en tabla_grupo_1_usuario. Se devuelven como null/[] para no romper el
//     frontend, pero no se guardan en la base de datos.
//   - No existe una tabla de "permisos directos por usuario": ese campo
//     siempre viene vacío ([]).
//   - "estado" en grupo 1 es una FK a tabla_grupo_1_estado_usuario
//     (ACTIVO/INACTIVO/SUSPENDIDO). Se traduce a 1 (activo) / 0 (inhabilitado)
//     para mantener el mismo contrato que usaba el frontend.

const SELECT_USUARIO = `
  SELECT
    u.id_usuario,
    u.nombre,
    NULL::varchar               AS apellido,
    u.correo,
    NULL::varchar               AS telefono,
    CASE WHEN e.estado = 'ACTIVO' THEN 1 ELSE 0 END AS estado,
    NULL::varchar               AS motivo_inhabilitacion,
    ARRAY[]::text[]             AS modulos_acceso,
    COALESCE(
      json_build_array(
        json_build_object('id_rol', r.id_rol, 'nombre_rol', r.nombre, 'codigo_rol', lower(r.nombre))
      ), '[]'
    ) AS roles,
    '[]'::json AS permisos_directos
  FROM tabla_grupo_1_usuario u
  JOIN tabla_grupo_1_rol r            ON r.id_rol = u.id_rol
  JOIN tabla_grupo_1_estado_usuario e ON e.id_estado = u.id_estado
`;

export class PostgresUsuarioSeguridadRepository implements UsuarioSeguridadRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(filtros?: FiltrosUsuarioSeguridad): Promise<UsuarioSeguridadPublico[]> {
    const condiciones: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (filtros?.busqueda) {
      condiciones.push(`(u.nombre ILIKE $${idx} OR u.correo ILIKE $${idx})`);
      valores.push(`%${filtros.busqueda}%`);
      idx++;
    }
    if (filtros?.estado !== undefined) {
      condiciones.push(`(CASE WHEN e.estado = 'ACTIVO' THEN 1 ELSE 0 END) = $${idx}`);
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
      `SELECT id_usuario, nombre, correo, password AS contrasena_hash, id_rol, id_estado
         FROM tabla_grupo_1_usuario WHERE correo = $1`,
      [correo],
    );
    if (!rows[0]) return null;
    const u = rows[0];
    return {
      id_usuario: u.id_usuario,
      nombre: u.nombre,
      apellido: null,
      correo: u.correo,
      contrasena_hash: u.contrasena_hash,
      telefono: null,
      estado: 1,
      motivo_inhabilitacion: null,
      modulos_acceso: [],
    };
  }

  async create(data: CrearUsuarioSeguridadDto, contrasenaHash: string): Promise<UsuarioSeguridadPublico> {
    // id_rol: se usa el primer rol indicado en el formulario (grupo 1 solo
    // admite un rol por usuario). Si no se indicó ninguno, cae a ESTUDIANTE.
    const idRol = data.roles?.[0];

    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_1_usuario (nombre, correo, password, id_rol, id_estado)
       VALUES (
         $1, $2, $3,
         COALESCE($4, (SELECT id_rol FROM tabla_grupo_1_rol WHERE nombre = 'ESTUDIANTE')),
         (SELECT id_estado FROM tabla_grupo_1_estado_usuario WHERE estado = 'ACTIVO')
       )
       RETURNING id_usuario`,
      [data.nombre, data.correo, contrasenaHash, idRol ?? null],
    );
    return (await this.findById(rows[0].id_usuario)) as UsuarioSeguridadPublico;
  }

  async update(id: number, data: ActualizarUsuarioSeguridadDto): Promise<UsuarioSeguridadPublico | null> {
    // Nota: apellido/telefono/modulos_acceso llegan del formulario pero no
    // existen como columnas en tabla_grupo_1_usuario, así que se ignoran.
    if (data.nombre !== undefined && data.nombre.trim()) {
      await this.pool.query(`UPDATE tabla_grupo_1_usuario SET nombre = $1 WHERE id_usuario = $2`, [
        data.nombre,
        id,
      ]);
    }
    return this.findById(id);
  }

  async inhabilitar(id: number, _motivo: string): Promise<UsuarioSeguridadPublico | null> {
    // grupo 1 no tiene columna motivo_inhabilitacion; solo se cambia el estado.
    await this.pool.query(
      `UPDATE tabla_grupo_1_usuario
       SET id_estado = (SELECT id_estado FROM tabla_grupo_1_estado_usuario WHERE estado = 'INACTIVO')
       WHERE id_usuario = $1`,
      [id],
    );
    return this.findById(id);
  }

  async habilitar(id: number): Promise<UsuarioSeguridadPublico | null> {
    await this.pool.query(
      `UPDATE tabla_grupo_1_usuario
       SET id_estado = (SELECT id_estado FROM tabla_grupo_1_estado_usuario WHERE estado = 'ACTIVO')
       WHERE id_usuario = $1`,
      [id],
    );
    return this.findById(id);
  }

  // grupo 1 solo permite UN rol por usuario: "asignar" reemplaza el rol actual.
  async asignarRol(idUsuario: number, idRol: number): Promise<void> {
    await this.pool.query(`UPDATE tabla_grupo_1_usuario SET id_rol = $2 WHERE id_usuario = $1`, [
      idUsuario,
      idRol,
    ]);
  }

  // No se puede "quitar" el único rol de un usuario (la columna es NOT NULL).
  // Si el rol que se intenta revocar ya no es el actual (porque se reemplazó
  // por otro en el mismo guardado), no hay nada que hacer.
  async revocarRol(_idUsuario: number, _idRol: number): Promise<void> {
    return;
  }

  async asignarPermisoDirecto(_idUsuario: number, _idPermiso: number): Promise<void> {
    throw new Error('Los permisos directos por usuario no están disponibles en este esquema');
  }

  async revocarPermisoDirecto(_idUsuario: number, _idPermiso: number): Promise<void> {
    throw new Error('Los permisos directos por usuario no están disponibles en este esquema');
  }
}
