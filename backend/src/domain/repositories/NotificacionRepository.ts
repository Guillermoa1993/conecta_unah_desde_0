import { Notificacion } from '../entities/Notificacion';

export interface NotificacionRepository {
  findByUsuario(usuario_id: number): Promise<Notificacion[]>;
  crear(datos: {
    usuario_id: number;
    mensaje: string;
    tipo: string;
    id_emisor?: number | null;
    referencia_tipo?: string | null;
    referencia_id?: number | null;
  }): Promise<Notificacion>;
  marcarLeida(id_notificacion: number, usuario_id: number): Promise<boolean>;
  marcarTodasLeidas(usuario_id: number): Promise<void>;

  /**
   * Crea una notificación para cada usuario en `usuario_ids` compartiendo
   * el mismo título/mensaje/fecha, de modo que luego puedan agruparse como
   * un único envío masivo en `findEnviadasPorEmisor`.
   */
  crearMasiva(datos: {
    usuario_ids: number[];
    titulo: string;
    mensaje: string;
    tipo: string;
    destinatario_grupo: string;
    id_emisor: number;
  }): Promise<{ total: number; fecha_creacion: Date }>;

  /**
   * Historial de envíos masivos hechos por un emisor (ej. panel de admin),
   * agrupados por lote (mismo título + mensaje + fecha) con conteo de
   * destinatarios y de lecturas.
   */
  findEnviadasPorEmisor(id_emisor: number): Promise<
    Array<{
      titulo: string | null;
      mensaje: string;
      tipo: string;
      destinatario_grupo: string | null;
      fecha_creacion: Date;
      total_destinatarios: number;
      total_leidas: number;
    }>
  >;
}
