import { Pool } from 'pg';
import { NotificacionRepository } from '../../domain/repositories/NotificacionRepository';
import { Notificacion } from '../../domain/entities/Notificacion';

export class PostgresNotificacionRepository implements NotificacionRepository {
  constructor(private readonly pool: Pool) {}

  async findByUsuario(usuario_id: number): Promise<Notificacion[]> {
    const { rows } = await this.pool.query(
      `SELECT n.id_notificacion, n.id_usuario, n.id_tipo, n.mensaje, n.leida,
              t.nombre AS tipo
       FROM tabla_grupo_1_notificaciones n
       LEFT JOIN tabla_grupo_1_tipo_notificacion t ON n.id_tipo = t.id_tipo
       WHERE n.id_usuario = $1
       ORDER BY n.id_notificacion DESC
       LIMIT 50`,
      [usuario_id],
    );
    return rows;
  }

  async crear(datos: { usuario_id: number; mensaje: string; tipo: string }): Promise<Notificacion> {
    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_1_notificaciones (id_usuario, id_tipo, mensaje, leida)
       VALUES (
         $1,
         (SELECT id_tipo FROM tabla_grupo_1_tipo_notificacion WHERE nombre = $2),
         $3,
         false
       ) RETURNING id_notificacion, id_usuario, id_tipo, mensaje, leida`,
      [datos.usuario_id, datos.tipo, datos.mensaje],
    );
    return { ...rows[0], tipo: datos.tipo };
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
}
