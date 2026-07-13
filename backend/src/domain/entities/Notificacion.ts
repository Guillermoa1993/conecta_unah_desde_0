export interface Notificacion {
  id_notificacion: number;
  id_usuario: number;
  id_tipo: number;
  tipo?: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion: Date;
  id_emisor?: number | null;
  emisor_nombre?: string | null;
  emisor_foto_url?: string | null;
  referencia_tipo?: string | null;
  referencia_id?: number | null;
}