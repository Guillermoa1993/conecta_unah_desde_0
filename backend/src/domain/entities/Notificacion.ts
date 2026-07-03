export interface Notificacion {
  id_notificacion: number;
  id_usuario: number;
  id_tipo: number;
  tipo?: string;
  mensaje: string;
  leida: boolean;
}
