import { Pool } from 'pg';
import { NotificacionRepository } from '../../domain/repositories/NotificacionRepository';
import { Notificacion, TipoNotificacion } from '../../domain/entities/Notificacion';

export class PostgresNotificacionRepository implements NotificacionRepository {
  constructor(private readonly pool: Pool) {}

  async findByUsuario(usuario_id: string): Promise<Notificacion[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT 50',
      [usuario_id],
    );
    return rows;
  }

  async findNoLeidas(usuario_id: string): Promise<Notificacion[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM notificaciones WHERE usuario_id = $1 AND leida = FALSE ORDER BY created_at DESC',
      [usuario_id],
    );
    return rows;
  }

  async crear(datos: { usuario_id: string; titulo: string; mensaje: string; tipo: TipoNotificacion; evento_id?: string }): Promise<Notificacion> {
    const { rows } = await this.pool.query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, evento_id, leida)
       VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING *`,
      [datos.usuario_id, datos.titulo, datos.mensaje, datos.tipo, datos.evento_id ?? null],
    );
    return rows[0];
  }

  async marcarLeida(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'UPDATE notificaciones SET leida = TRUE WHERE id = $1',
      [id],
    );
    return (rowCount ?? 0) > 0;
  }

  async marcarTodasLeidas(usuario_id: string): Promise<number> {
    const { rowCount } = await this.pool.query(
      'UPDATE notificaciones SET leida = TRUE WHERE usuario_id = $1 AND leida = FALSE',
      [usuario_id],
    );
    return rowCount ?? 0;
  }
}
