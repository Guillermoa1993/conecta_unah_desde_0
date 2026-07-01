import { Notificacion, TipoNotificacion } from '../entities/Notificacion';

export interface NotificacionRepository {
  findByUsuario(usuario_id: string): Promise<Notificacion[]>;
  findNoLeidas(usuario_id: string): Promise<Notificacion[]>;
  crear(datos: { usuario_id: string; titulo: string; mensaje: string; tipo: TipoNotificacion; evento_id?: string }): Promise<Notificacion>;
  marcarLeida(id: string): Promise<boolean>;
  marcarTodasLeidas(usuario_id: string): Promise<number>;
}
