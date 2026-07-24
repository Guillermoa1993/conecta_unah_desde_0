import { Pool } from 'pg';
import { ReaccionPumita, ReaccionPumitaRecibida } from '../../domain/entities/ReaccionPumita';
import {
  CrearReaccionPumitaConNotificacionDatos,
  ReaccionPumitaRepository,
} from '../../domain/repositories/ReaccionPumitaRepository';

export class PostgresReaccionPumitaRepository implements ReaccionPumitaRepository {
  constructor(private readonly pool: Pool) {}

  async crearConNotificacion(datos: CrearReaccionPumitaConNotificacionDatos): Promise<ReaccionPumita> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const reaccionResult = await client.query<ReaccionPumita>(
        `INSERT INTO tabla_grupo_1_reacciones_pumita (id_emisor, id_receptor, tipo)
         VALUES ($1, $2, $3)
         RETURNING id_reaccion, id_emisor, id_receptor, tipo, fecha_creacion`,
        [datos.id_emisor, datos.id_receptor, datos.tipo],
      );

      const reaccion = reaccionResult.rows[0];

      let tipoResult = await client.query<{ id_tipo: number }>(
        'SELECT id_tipo FROM tabla_grupo_1_tipo_notificacion WHERE nombre = $1',
        ['REACCION_PUMITA'],
      );

      if (!tipoResult.rows[0]) {
        tipoResult = await client.query<{ id_tipo: number }>(
          `INSERT INTO tabla_grupo_1_tipo_notificacion (nombre)
           VALUES ($1)
           RETURNING id_tipo`,
          ['REACCION_PUMITA'],
        );
      }

      await client.query(
        `INSERT INTO tabla_grupo_1_notificaciones (
           id_usuario,
           id_tipo,
           mensaje,
           leida,
           id_emisor,
           referencia_tipo,
           referencia_id,
           fecha_creacion
         )
         VALUES ($1, $2, $3, FALSE, $4, $5, $6, NOW())`,
        [
          datos.id_receptor,
          tipoResult.rows[0].id_tipo,
          datos.mensaje,
          datos.id_emisor,
          'REACCION_PUMITA',
          reaccion.id_reaccion,
        ],
      );

      await client.query('COMMIT');
      return reaccion;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listarRecibidas(id_receptor: number): Promise<ReaccionPumitaRecibida[]> {
    const { rows } = await this.pool.query<ReaccionPumitaRecibida>(
      `SELECT r.id_reaccion,
              r.id_emisor,
              r.id_receptor,
              r.tipo,
              r.fecha_creacion,
              u.nombre AS emisor_nombre,
              NULL AS emisor_foto_url
       FROM tabla_grupo_1_reacciones_pumita r
       INNER JOIN tabla_grupo_1_usuario u ON u.id_usuario = r.id_emisor
       WHERE r.id_receptor = $1
       ORDER BY r.fecha_creacion DESC`,
      [id_receptor],
    );

    return rows;
  }
}