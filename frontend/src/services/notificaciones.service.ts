import { api } from './api';
import type { Notificacion, TipoNotificacion } from '../types';

// Forma cruda que devuelve el backend (Postgres) para cada notificación
interface NotificacionRaw {
  id_notificacion: number;
  id_usuario: number;
  id_tipo: number;
  tipo?: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  id_emisor?: number | null;
  emisor_nombre?: string | null;
  emisor_foto_url?: string | null;
  referencia_tipo?: string | null;
  referencia_id?: number | null;
}

const TITULOS_POR_TIPO: Record<string, string> = {
  EVENTO_APROBADO: 'Evento aprobado',
  EVENTO_RECHAZADO: 'Evento rechazado',
  NUEVA_INSCRIPCION: 'Nueva inscripción',
  EVENTO_CANCELADO: 'Evento cancelado',
  CONSTANCIA_EMITIDA: 'Constancia emitida',
  RECORDATORIO: 'Recordatorio',
  SISTEMA: 'Notificación del sistema',
  REACCION_PUMITA: 'Nueva reacción',
  SOLICITUD_PUMITA: 'Nueva solicitud de conexión',   // ← nueva línea
  EVENTO_DISPONIBLE: 'Nuevo evento disponible', 
};

function mapearNotificacion(raw: NotificacionRaw): Notificacion {
  const tipo = (raw.tipo ?? 'SISTEMA') as TipoNotificacion;
  return {
    id: String(raw.id_notificacion),
    usuario_id: String(raw.id_usuario),
    titulo: TITULOS_POR_TIPO[tipo] ?? 'Notificación',
    mensaje: raw.mensaje,
    tipo,
    leida: raw.leida,
    evento_id: raw.referencia_tipo === 'EVENTO' && raw.referencia_id != null
      ? String(raw.referencia_id)
      : undefined,
    created_at: raw.fecha_creacion,
    emisor_nombre: raw.emisor_nombre ?? undefined, 
    referencia_tipo: raw.referencia_tipo ?? undefined,   // ← nueva línea
    referencia_id: raw.referencia_id ?? undefined, 
  };
}

export const notificacionesService = {
  async getMias(): Promise<Notificacion[]> {
    const raw = await api.get<NotificacionRaw[]>('/notificaciones');
    return raw.map(mapearNotificacion);
  },

  async getNoLeidas(): Promise<{ count: number; notificaciones: Notificacion[] }> {
    const raw = await api.get<{ count: number; notificaciones: NotificacionRaw[] }>(
      '/notificaciones/no-leidas',
    );
    return {
      count: raw.count,
      notificaciones: raw.notificaciones.map(mapearNotificacion),
    };
  },

  marcarLeida(id: string): Promise<{ ok: boolean }> {
    return api.patch(`/notificaciones/${id}/leer`);
  },

  marcarTodasLeidas(): Promise<{ ok: boolean }> {
    return api.patch('/notificaciones/leer-todas');
  },
};