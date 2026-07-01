export type TipoNotificacion =
  | 'EVENTO_APROBADO'
  | 'EVENTO_RECHAZADO'
  | 'NUEVA_INSCRIPCION'
  | 'EVENTO_CANCELADO'
  | 'CONSTANCIA_EMITIDA'
  | 'RECORDATORIO'
  | 'SISTEMA';

export interface Notificacion {
  id: string;
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leida: boolean;
  evento_id?: string;
  created_at: Date;
}
