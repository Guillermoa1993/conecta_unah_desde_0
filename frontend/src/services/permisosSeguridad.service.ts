import { api } from './api';
import type { PermisoSeguridad, CrearPermisoSeguridadPayload } from '../types';

export const permisosSeguridadService = {
  getAll(modulo?: string): Promise<PermisoSeguridad[]> {
    return api.get<PermisoSeguridad[]>(`/seguridad/permisos${modulo ? `?modulo=${encodeURIComponent(modulo)}` : ''}`);
  },

  getById(id: number): Promise<PermisoSeguridad> {
    return api.get<PermisoSeguridad>(`/seguridad/permisos/${id}`);
  },

  crear(payload: CrearPermisoSeguridadPayload): Promise<PermisoSeguridad> {
    return api.post<PermisoSeguridad>('/seguridad/permisos', payload);
  },

  actualizar(id: number, payload: Partial<CrearPermisoSeguridadPayload>): Promise<PermisoSeguridad> {
    return api.put<PermisoSeguridad>(`/seguridad/permisos/${id}`, payload);
  },

  eliminar(id: number): Promise<void> {
    return api.delete<void>(`/seguridad/permisos/${id}`);
  },
};
