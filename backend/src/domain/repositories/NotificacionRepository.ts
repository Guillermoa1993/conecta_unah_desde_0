import { Notificacion } from '../entities/Notificacion';

export interface NotificacionRepository {
  findByUsuario(usuario_id: number): Promise<Notificacion[]>;
  crear(datos: { usuario_id: number; mensaje: string; tipo: string }): Promise<Notificacion>;
  marcarLeida(id_notificacion: number, usuario_id: number): Promise<boolean>;
  marcarTodasLeidas(usuario_id: number): Promise<void>;
}
