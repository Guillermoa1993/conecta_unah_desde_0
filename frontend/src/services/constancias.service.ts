import { api } from './api';
import type { Constancia } from '../types';

export const constanciasService = {
  getMisConstancias(): Promise<Constancia[]> {
    return api.get<Constancia[]>('/constancias/mis-constancias');
  },

  getPendientes(): Promise<Constancia[]> {
    return api.get<Constancia[]>('/constancias/pendientes');
  },

  solicitar(eventoId: string): Promise<Constancia> {
    return api.post<Constancia>(`/constancias/evento/${eventoId}`, {});
  },

  aprobar(id: string): Promise<Constancia> {
    return api.patch<Constancia>(`/constancias/${id}/aprobar`);
  },

  rechazar(id: string, motivo: string): Promise<Constancia> {
    return api.patch<Constancia>(`/constancias/${id}/rechazar`, { motivo });
  },
};
