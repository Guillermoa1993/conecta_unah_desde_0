import { api } from './api';
import type { Notificacion } from '../types';

export const notificacionesService = {
  getMias(): Promise<Notificacion[]> {
    return api.get<Notificacion[]>('/notificaciones');
  },

  getNoLeidas(): Promise<{ count: number; notificaciones: Notificacion[] }> {
    return api.get('/notificaciones/no-leidas');
  },

  marcarLeida(id: string): Promise<{ message: string }> {
    return api.patch(`/notificaciones/${id}/leer`);
  },

  marcarTodasLeidas(): Promise<{ message: string }> {
    return api.patch('/notificaciones/leer-todas');
  },
};
