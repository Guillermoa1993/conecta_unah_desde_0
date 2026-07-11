import { Pool } from 'pg';
import { PumitaRepository } from '../../domain/repositories/PumitaRepository';
import { Pumita } from '../../domain/entities/Pumita';

export class PostgresPumitaRepository implements PumitaRepository {
  constructor(private readonly pool: Pool) {}

  async listarConexiones(id_usuario: number): Promise<Pumita[]> {
    const { rows } = await this.pool.query(
      `SELECT
         p.id_conexion,
         CASE WHEN p."Usuario_id_usuario" = $1 THEN p."Usuario_id_usuario1" ELSE p."Usuario_id_usuario" END AS id_usuario,
         u.nombre,
         p.estado,
         (p."Usuario_id_usuario" = $1) AS soy_solicitante
       FROM tabla_grupo_2_perfilpumita p
       JOIN tabla_grupo_1_usuario u
         ON u.id_usuario = CASE WHEN p."Usuario_id_usuario" = $1 THEN p."Usuario_id_usuario1" ELSE p."Usuario_id_usuario" END
       WHERE (p."Usuario_id_usuario" = $1 OR p."Usuario_id_usuario1" = $1)
         AND p.estado = 'aceptada'
       ORDER BY p.fecha_conexion DESC`,
      [id_usuario],
    );
    return rows;
  }

  async listarSolicitudesPendientes(id_usuario: number): Promise<Pumita[]> {
    const { rows } = await this.pool.query(
      `SELECT
         p.id_conexion,
         p."Usuario_id_usuario" AS id_usuario,
         u.nombre,
         p.estado,
         false AS soy_solicitante
       FROM tabla_grupo_2_perfilpumita p
       JOIN tabla_grupo_1_usuario u ON u.id_usuario = p."Usuario_id_usuario"
       WHERE p."Usuario_id_usuario1" = $1 AND p.estado = 'pendiente'
       ORDER BY p.fecha_conexion DESC`,
      [id_usuario],
    );
    return rows;
  }

  async enviarSolicitud(id_solicitante: number, id_receptor: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO tabla_grupo_2_perfilpumita
        (id_puma1, id_puma2, "Usuario_id_usuario", "Usuario_id_usuario1", estado)
       VALUES ($1, $2, $1, $2, 'pendiente')`,
      [id_solicitante, id_receptor],
    );
  }

  async aceptarSolicitud(id_conexion: number, id_usuario: number): Promise<void> {
    await this.pool.query(
      `UPDATE tabla_grupo_2_perfilpumita
       SET estado = 'aceptada'
       WHERE id_conexion = $1 AND "Usuario_id_usuario1" = $2`,
      [id_conexion, id_usuario],
    );
  }

  async eliminarConexion(id_conexion: number, id_usuario: number): Promise<void> {
    await this.pool.query(
      `DELETE FROM tabla_grupo_2_perfilpumita
       WHERE id_conexion = $1
         AND ("Usuario_id_usuario" = $2 OR "Usuario_id_usuario1" = $2)`,
      [id_conexion, id_usuario],
    );
  }
  async listarSugeridos(id_usuario: number): Promise<Pumita[]> {
    const { rows } = await this.pool.query(
      `SELECT
         NULL::int AS id_conexion,
         u.id_usuario,
         u.nombre,
         'sugerido' AS estado,
         false AS soy_solicitante
       FROM tabla_grupo_1_usuario u
       WHERE u.id_usuario <> $1
         AND u.id_usuario NOT IN (
           SELECT CASE WHEN p."Usuario_id_usuario" = $1 THEN p."Usuario_id_usuario1" ELSE p."Usuario_id_usuario" END
           FROM tabla_grupo_2_perfilpumita p
           WHERE p."Usuario_id_usuario" = $1 OR p."Usuario_id_usuario1" = $1
         )
       ORDER BY u.nombre
       LIMIT 20`,
      [id_usuario],
    );
    return rows;
  }
  async listarSolicitudesEnviadas(id_usuario: number): Promise<Pumita[]> {
    const { rows } = await this.pool.query(
      `SELECT
         p.id_conexion,
         p."Usuario_id_usuario1" AS id_usuario,
         u.nombre,
         p.estado,
         true AS soy_solicitante
       FROM tabla_grupo_2_perfilpumita p
       JOIN tabla_grupo_1_usuario u ON u.id_usuario = p."Usuario_id_usuario1"
       WHERE p."Usuario_id_usuario" = $1 AND p.estado = 'pendiente'
       ORDER BY p.fecha_conexion DESC`,
      [id_usuario],
    );
    return rows;
  }
}