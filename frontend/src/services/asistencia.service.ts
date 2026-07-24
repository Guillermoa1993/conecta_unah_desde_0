import { api } from './api';
import type { Asistencia } from '../types';

export const asistenciaService = {
  getByEvento(eventoId: string): Promise<Asistencia[]> {
    return api.get<Asistencia[]>(`/asistencia/evento/${eventoId}`);
  },

  registrarQR(qr_token: string): Promise<{ message: string; asistencia: Asistencia }> {
    return api.post('/asistencia/qr', { qr_token });
  },

  registrarManual(eventoId: string, estudiante_id: string): Promise<Asistencia> {
    return api.post<Asistencia>(`/asistencia/manual/evento/${eventoId}`, { estudiante_id });
  },
};
