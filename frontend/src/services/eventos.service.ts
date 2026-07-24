import { api } from './api';
import type { Evento, CrearEventoPayload, FiltrosEvento } from '../types';

function buildQuery(filtros?: FiltrosEvento): string {
  if (!filtros) return '';
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const eventosService = {
  getAll(filtros?: FiltrosEvento): Promise<Evento[]> {
    return api.get<Evento[]>(`/eventos${buildQuery(filtros)}`);
  },

  getMisEventos(): Promise<Evento[]> {
    return api.get<Evento[]>('/eventos/mis-eventos');
  },

  getPendientes(): Promise<Evento[]> {
    return api.get<Evento[]>('/eventos/pendientes');
  },

  getById(id: string): Promise<Evento> {
    return api.get<Evento>(`/eventos/${id}`);
  },

  crear(payload: CrearEventoPayload): Promise<Evento> {
    return api.post<Evento>('/eventos', payload);
  },

  actualizar(id: string, payload: Partial<CrearEventoPayload>): Promise<Evento> {
    return api.put<Evento>(`/eventos/${id}`, payload);
  },

  aprobar(id: string): Promise<Evento> {
    return api.patch<Evento>(`/eventos/${id}/aprobar`);
  },

  rechazar(id: string, motivo: string): Promise<Evento> {
    return api.patch<Evento>(`/eventos/${id}/rechazar`, { motivo });
  },
};
