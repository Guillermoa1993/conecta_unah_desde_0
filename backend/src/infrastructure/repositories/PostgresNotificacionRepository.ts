import { Pool } from 'pg';
import { NotificacionRepository } from '../../domain/repositories/NotificacionRepository';
import { Notificacion } from '../../domain/entities/Notificacion';

export class PostgresNotificacionRepository implements NotificacionRepository {
  constructor(private readonly pool: Pool) {}

  async findByUsuario(usuario_id: number): Promise<Notificacion[]> {
    const { rows } = await this.pool.query(
      `SELECT n.id_notificacion, n.id_usuario, n.id_tipo, n.mensaje,
              n.leida, n.fecha_creacion, n.id_emisor, n.titulo,
              emisor.nombre AS emisor_nombre,
              NULL AS emisor_foto_url,
              n.referencia_tipo, n.referencia_id,
              t.nombre AS tipo
       FROM tabla_grupo_1_notificaciones n
       LEFT JOIN tabla_grupo_1_tipo_notificacion t ON n.id_tipo = t.id_tipo
       LEFT JOIN tabla_grupo_1_usuario emisor ON emisor.id_usuario = n.id_emisor
       WHERE n.id_usuario = $1
       ORDER BY n.fecha_creacion DESC, n.id_notificacion DESC
       LIMIT 50`,
      [usuario_id],
    );
    return rows;
  }

  async crear(datos: {
    usuario_id: number;
    mensaje: string;
    tipo: string;
    id_emisor?: number | null;
    referencia_tipo?: string | null;
    referencia_id?: number | null;
  }): Promise<Notificacion> {
    const { rows } = await this.pool.query(
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
       VALUES (
         $1,
         COALESCE((SELECT id_tipo FROM tabla_grupo_1_tipo_notificacion WHERE nombre = $2 LIMIT 1), (SELECT id_tipo FROM tabla_grupo_1_tipo_notificacion LIMIT 1), 1),
         $3,
         FALSE,
         $4,
         $5,
         $6,
         NOW()
       )
       RETURNING id_notificacion, id_usuario, id_tipo, mensaje, leida, fecha_creacion,
                 id_emisor, referencia_tipo, referencia_id`,
      [
        datos.usuario_id,
        datos.tipo,
        datos.mensaje,
        datos.id_emisor ?? null,
        datos.referencia_tipo ?? null,
        datos.referencia_id ?? null,
      ],
    );
    return {
      ...rows[0],
      tipo: datos.tipo,
      emisor_nombre: null,
      emisor_foto_url: null,
    };
  }

  async marcarLeida(id_notificacion: number, usuario_id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `UPDATE tabla_grupo_1_notificaciones
       SET leida = true
       WHERE id_notificacion = $1 AND id_usuario = $2`,
      [id_notificacion, usuario_id],
    );
    return (rowCount ?? 0) > 0;
  }

  async marcarTodasLeidas(usuario_id: number): Promise<void> {
    await this.pool.query(
      `UPDATE tabla_grupo_1_notificaciones SET leida = true WHERE id_usuario = $1`,
      [usuario_id],
    );
  }

  async crearMasiva(datos: {
    usuario_ids: number[];
    titulo: string;
    mensaje: string;
    tipo: string;
    destinatario_grupo: string;
    id_emisor: number;
  }): Promise<{ total: number; fecha_creacion: Date }> {
    if (datos.usuario_ids.length === 0) {
      return { total: 0, fecha_creacion: new Date() };
    }

    const { rows } = await this.pool.query(
      `WITH lote AS (SELECT NOW() AS fecha_creacion)
       INSERT INTO tabla_grupo_1_notificaciones (
         id_usuario, id_tipo, mensaje, leida, id_emisor,
         referencia_tipo, referencia_id, titulo, destinatario_grupo, fecha_creacion
       )
       SELECT
         destinatario,
         (SELECT id_tipo FROM tabla_grupo_1_tipo_notificacion WHERE nombre = $2),
         $3, FALSE, $4, NULL, NULL, $5, $6, lote.fecha_creacion
       FROM unnest($1::int[]) AS destinatario, lote
       RETURNING fecha_creacion`,
      [
        datos.usuario_ids,
        datos.tipo,
        datos.mensaje,
        datos.id_emisor,
        datos.titulo,
        datos.destinatario_grupo,
      ],
    );

    return { total: rows.length, fecha_creacion: rows[0]?.fecha_creacion ?? new Date() };
  }

  async findEnviadasPorEmisor(id_emisor: number): Promise<
    Array<{
      titulo: string | null;
      mensaje: string;
      tipo: string;
      destinatario_grupo: string | null;
      fecha_creacion: Date;
      total_destinatarios: number;
      total_leidas: number;
    }>
  > {
    const { rows } = await this.pool.query(
      `SELECT n.titulo, n.mensaje, t.nombre AS tipo, n.destinatario_grupo, n.fecha_creacion,
              COUNT(*)::int AS total_destinatarios,
              COUNT(*) FILTER (WHERE n.leida)::int AS total_leidas
       FROM tabla_grupo_1_notificaciones n
       LEFT JOIN tabla_grupo_1_tipo_notificacion t ON n.id_tipo = t.id_tipo
       WHERE n.id_emisor = $1 AND n.destinatario_grupo IS NOT NULL
       GROUP BY n.titulo, n.mensaje, t.nombre, n.destinatario_grupo, n.fecha_creacion
       ORDER BY n.fecha_creacion DESC
       LIMIT 100`,
      [id_emisor],
    );
    return rows;
  }
}
