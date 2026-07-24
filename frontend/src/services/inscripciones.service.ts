import { api } from './api';
import type { Inscripcion } from '../types';

export const inscripcionesService = {
  getMisInscripciones(): Promise<Inscripcion[]> {
    return api.get<Inscripcion[]>('/inscripciones/mis-inscripciones');
  },

  getInscriptosPorEvento(eventoId: string): Promise<Inscripcion[]> {
    return api.get<Inscripcion[]>(`/inscripciones/evento/${eventoId}`);
  },

  inscribirse(eventoId: string): Promise<Inscripcion> {
    return api.post<Inscripcion>(`/inscripciones/evento/${eventoId}`, {});
  },

  cancelar(eventoId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/inscripciones/evento/${eventoId}`);
  },
};
